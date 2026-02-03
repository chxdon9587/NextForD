"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ProjectBasicInfo, Milestone, Reward } from "@/lib/validations/project";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface CreateProjectInput {
  basicInfo: ProjectBasicInfo;
  milestones: Milestone[];
  rewards: Reward[];
}

interface CreateProjectData extends CreateProjectInput {
  status: "draft" | "pending_review";
}

export async function createProject(data: CreateProjectData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create a project" };
  }

  const { basicInfo, milestones, rewards, status } = data;

  const slug = generateSlug(basicInfo.title);

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        title: basicInfo.title,
        description: basicInfo.description,
        slug,
        creator_id: user.id,
        category: basicInfo.category,
        funding_type: "milestone",
        goal_amount: basicInfo.fundingGoal,
        current_amount: 0,
        status,
        deadline: basicInfo.deadline.toISOString(),
        cover_image: basicInfo.imageUrl || null,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    const milestonesData = milestones.map((m, index) => {
      const baseDeadlineDays = 30;
      const deadlineDays = baseDeadlineDays + (index * 15);
      
      return {
        project_id: project.id,
        title: m.title,
        description: m.description,
        goal_amount: m.fundingTarget,
        current_amount: 0,
        order_index: m.order_index,
        deadline_days: deadlineDays,
        status: "pending" as const,
      };
    });

    const { error: milestonesError } = await supabase
      .from("milestones")
      .insert(milestonesData);

    if (milestonesError) throw milestonesError;

    const rewardsData = rewards.map((r, index) => ({
      project_id: project.id,
      title: r.title,
      description: r.description,
      amount: r.pledgeAmount,
      quantity_total: r.backerLimit || null,
      quantity_claimed: 0,
      is_limited: r.backerLimit ? true : false,
      estimated_delivery: r.estimatedDelivery.toISOString().split('T')[0],
      shipping_required: r.shippingType !== 'digital',
      shipping_locations: r.shippingType === 'worldwide' ? ['worldwide'] : 
                         r.shippingType === 'domestic' ? ['domestic'] :
                         r.shippingType === 'local' ? ['local'] : [],
      order_index: index + 1,
      is_active: true,
    }));

    const { error: rewardsError } = await supabase
      .from("rewards")
      .insert(rewardsData);

    if (rewardsError) throw rewardsError;

    return { success: true, projectId: project.id, slug: project.slug };
  } catch (error: any) {
    console.error("Error creating project:", error);
    return { error: error.message || "Failed to create project" };
  }
}

export async function saveDraft(data: CreateProjectInput) {
  return createProject({ ...data, status: "draft" });
}

export async function publishProject(data: CreateProjectInput) {
  return createProject({ ...data, status: "pending_review" });
}

export async function uploadProjectImage(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to upload images" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `project-images/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from("projects")
      .upload(filePath, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("projects").getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return { error: error.message || "Failed to upload image" };
  }
}

export async function getProject(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        *,
        milestones (
          id,
          title,
          description,
          goal_amount,
          current_amount,
          order_index,
          deadline_days,
          status
        ),
        rewards (
          id,
          title,
          description,
          amount,
          quantity_total,
          quantity_claimed,
          is_limited,
          estimated_delivery,
          shipping_required,
          shipping_locations,
          order_index,
          is_active
        )
      `)
      .eq("id", projectId)
      .eq("creator_id", user.id)
      .single();

    if (projectError) throw projectError;

    return { success: true, project };
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return { error: error.message || "Failed to fetch project" };
  }
}

interface UpdateProjectInput extends CreateProjectInput {
  projectId: string;
}

export async function updateProject(data: UpdateProjectInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to update a project" };
  }

  const { basicInfo, milestones, rewards, projectId } = data;

  const slug = generateSlug(basicInfo.title);

  try {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .update({
        title: basicInfo.title,
        description: basicInfo.description,
        slug,
        category: basicInfo.category,
        goal_amount: basicInfo.fundingGoal,
        deadline: basicInfo.deadline.toISOString(),
        cover_image: basicInfo.imageUrl || null,
      })
      .eq("id", projectId)
      .eq("creator_id", user.id)
      .select()
      .single();

    if (projectError) throw projectError;

    const { error: deleteMilestonesError } = await supabase
      .from("milestones")
      .delete()
      .eq("project_id", projectId);

    if (deleteMilestonesError) throw deleteMilestonesError;

    const milestonesData = milestones.map((m, index) => {
      const baseDeadlineDays = 30;
      const deadlineDays = baseDeadlineDays + (index * 15);

      return {
        project_id: projectId,
        title: m.title,
        description: m.description,
        goal_amount: m.fundingTarget,
        current_amount: (m as any).current_amount || 0,
        order_index: m.order_index,
        deadline_days: deadlineDays,
        status: (m as any).status || "pending" as const,
      };
    });

    const { error: milestonesError } = await supabase
      .from("milestones")
      .insert(milestonesData);

    if (milestonesError) throw milestonesError;

    const { error: deleteRewardsError } = await supabase
      .from("rewards")
      .delete()
      .eq("project_id", projectId);

    if (deleteRewardsError) throw deleteRewardsError;

    const rewardsData = rewards.map((r, index) => ({
      project_id: projectId,
      title: r.title,
      description: r.description,
      amount: r.pledgeAmount,
      quantity_total: r.backerLimit || null,
      quantity_claimed: (r as any).quantity_claimed || 0,
      is_limited: r.backerLimit ? true : false,
      estimated_delivery: r.estimatedDelivery.toISOString().split('T')[0],
      shipping_required: r.shippingType !== 'digital',
      shipping_locations: r.shippingType === 'worldwide' ? ['worldwide'] :
                         r.shippingType === 'domestic' ? ['domestic'] :
                         r.shippingType === 'local' ? ['local'] : [],
      order_index: index + 1,
      is_active: true,
    }));

    const { error: rewardsError } = await supabase
      .from("rewards")
      .insert(rewardsData);

    if (rewardsError) throw rewardsError;

    return { success: true, projectId: project.id, slug: project.slug };
  } catch (error: any) {
    console.error("Error updating project:", error);
    return { error: error.message || "Failed to update project" };
  }
}

export async function resubmitProject(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  try {
    const { error } = await supabase
      .from("projects")
      .update({ status: "pending_review" })
      .eq("id", projectId)
      .eq("creator_id", user.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Error resubmitting project:", error);
    return { error: error.message || "Failed to resubmit project" };
  }
}
