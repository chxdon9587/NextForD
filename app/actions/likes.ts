"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleLike(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated' };
  }

  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (existingLike) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);

    if (error) {
      return { error: 'Failed to unlike project' };
    }

    await updateLikeCount(projectId, -1);
    revalidatePath(`/projects/[slug]`);
    return { liked: false };
  }

  const { error } = await supabase
    .from('likes')
    .insert({
      project_id: projectId,
      user_id: user.id,
    });

  if (error) {
    return { error: 'Failed to like project' };
  }

  await updateLikeCount(projectId, 1);
  revalidatePath(`/projects/[slug]`);
  return { liked: true };
}

async function updateLikeCount(projectId: string, delta: number) {
  const supabase = await createClient();

  await supabase.rpc('update_like_count', {
    project_id: projectId,
    delta: delta,
  });
}

export async function isLiked(projectId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  return !!data && !error;
}

export async function getProjectLikes(projectId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching likes:', error);
    return 0;
  }

  return count || 0;
}
