"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPostUpdate(data: {
  projectId: string;
  title: string;
  content: string;
  visibility: "public" | "backers_only";
  images: string[];
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, creator_id')
    .eq('id', data.projectId)
    .single();

  if (projectError || !project) {
    return { error: "Project not found" };
  }

  if (project.creator_id !== user.id) {
    return { error: "You can only post updates to your own projects" };
  }

  const { error } = await supabase
    .from('project_updates')
    .insert({
      project_id: data.projectId,
      title: data.title,
      content: data.content,
      visibility: data.visibility,
      images: data.images,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating update:", error);
    return { error: "Failed to create update" };
  }

  revalidatePath(`/projects/[slug]`);
  return { success: true };
}

export async function getProjectUpdates(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_updates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching updates:", error);
    return [];
  }

  return data || [];
}
