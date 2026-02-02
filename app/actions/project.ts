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

    const rewardsData = rewards.map((r) => ({
      project_id: project.id,
      title: r.title,
      description: r.description,
      pledge_amount: r.pledgeAmount,
      estimated_delivery: r.estimatedDelivery.toISOString(),
      backer_limit: r.backerLimit || null,
      shipping_type: r.shippingType,
      backers_count: 0,
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
