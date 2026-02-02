"use server";

import { createClient } from "@/lib/supabase/server";

interface CreateBackingInput {
  projectId: string;
  rewardId: string | null;
  amount: number;
}

export async function createBacking(data: CreateBackingInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to back a project" };
  }

  const { projectId, rewardId, amount } = data;

  try {
    const { data: backing, error } = await supabase
      .from("backings")
      .insert({
        project_id: projectId,
        backer_id: user.id,
        reward_id: rewardId,
        amount,
        stripe_payment_intent_id: `mock_${Date.now()}`,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, backingId: backing.id };
  } catch (error: any) {
    console.error("Error creating backing:", error);
    return { error: error.message || "Failed to create backing" };
  }
}
