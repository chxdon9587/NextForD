"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markMilestoneCompleted(milestoneId: string, proof?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  const { data: milestone } = await supabase
    .from("milestones")
    .select(`
      *,
      projects!inner(creator_id)
    `)
    .eq("id", milestoneId)
    .single();

  if (!milestone) {
    return { error: "Milestone not found" };
  }

  if (milestone.projects.creator_id !== user.id) {
    return { error: "You can only mark your own milestones as completed" };
  }

  if (milestone.status !== "in_progress") {
    return { error: "Milestone must be in progress to be marked as completed" };
  }

  const { error } = await supabase
    .from("milestones")
    .update({
      status: "completed",
      completion_proof: proof || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);

  if (error) {
    console.error("Error marking milestone as completed:", error);
    return { error: "Failed to mark milestone as completed" };
  }

  revalidatePath(`/projects/${milestone.projects.slug}`);
  return { success: true };
}

export async function requestMilestoneVerification(milestoneId: string, proof?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  const { data: milestone } = await supabase
    .from("milestones")
    .select(`
      *,
      projects!inner(creator_id)
    `)
    .eq("id", milestoneId)
    .single();

  if (!milestone) {
    return { error: "Milestone not found" };
  }

  if (milestone.projects.creator_id !== user.id) {
    return { error: "You can only request verification for your own milestones" };
  }

  if (milestone.status !== "completed") {
    return { error: "Milestone must be completed to request verification" };
  }

  const { error } = await supabase
    .from("milestones")
    .update({
      completion_proof: proof,
      updated_at: new Date().toISOString(),
    })
    .eq("id", milestoneId);

  if (error) {
    console.error("Error requesting milestone verification:", error);
    return { error: "Failed to request verification" };
  }

  revalidatePath(`/dashboard/creator?tab=milestones`);
  return { success: true };
}

export async function getProjectEscrowFunds(projectId: string) {
  const supabase = await createClient();

  const { data: escrowTransactions } = await supabase
    .from("escrow_transactions")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "held")
    .order("held_at", { ascending: false });

  if (!escrowTransactions) {
    return [];
  }

  return escrowTransactions;
}

export async function getProjectMilestones(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching milestones:", error);
    return [];
  }

  return data || [];
}

export async function releaseEscrowFunds(milestoneId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  const { data: milestone } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", milestoneId)
    .single();

  if (!milestone) {
    return { error: "Milestone not found" };
  }

  if (milestone.status !== "verified") {
    return { error: "Milestone must be verified to release funds" };
  }

  const { data: escrowFunds } = await supabase
    .from("escrow_transactions")
    .select("*")
    .eq("milestone_id", milestoneId)
    .eq("status", "held");

  if (!escrowFunds || escrowFunds.length === 0) {
    return { error: "No funds to release" };
  }

  const { error } = await supabase
    .from("escrow_transactions")
    .update({
      status: "released",
      released_at: new Date().toISOString(),
    })
    .eq("milestone_id", milestoneId)
    .eq("status", "held");

  if (error) {
    console.error("Error releasing escrow funds:", error);
    return { error: "Failed to release funds" };
  }

  const totalAmount = escrowFunds.reduce((sum: number, fund: any) => 
    sum + parseFloat(fund.amount?.toString() || "0"), 0);

  revalidatePath(`/dashboard/creator?tab=milestones`);
  return { success: true, amount: totalAmount, transactionCount: escrowFunds.length };
}

export async function getEscrowSummary(projectId: string) {
  const supabase = await createClient();

  const [{ data: heldFunds }, { data: releasedFunds }] = await Promise.all([
    supabase
      .from("escrow_transactions")
      .select("amount")
      .eq("project_id", projectId)
      .eq("status", "held"),
    supabase
      .from("escrow_transactions")
      .select("amount")
      .eq("project_id", projectId)
      .eq("status", "released"),
  ]);

  const heldTotal = heldFunds?.reduce((sum: number, fund: any) => 
    sum + parseFloat(fund.amount?.toString() || "0"), 0) || 0;
  const releasedTotal = releasedFunds?.reduce((sum: number, fund: any) => 
    sum + parseFloat(fund.amount?.toString() || "0"), 0) || 0;

  return {
    held: heldTotal,
    released: releasedTotal,
    total: heldTotal + releasedTotal,
  };
}
