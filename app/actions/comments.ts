"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createComment(
  projectId: string,
  content: string,
  parentId?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated' };
  }

  if (!content || content.trim().length === 0) {
    return { error: 'Comment cannot be empty' };
  }

  if (content.length > 2000) {
    return { error: 'Comment is too long (max 2000 characters)' };
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      project_id: projectId,
      user_id: user.id,
      parent_id: parentId || null,
      content: content.trim(),
    })
    .select(`
      *,
      user:users (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    return { error: 'Failed to create comment' };
  }

  revalidatePath(`/projects/[slug]`);
  return { data, error: null };
}

export async function updateComment(
  commentId: string,
  content: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated' };
  }

  if (!content || content.trim().length === 0) {
    return { error: 'Comment cannot be empty' };
  }

  if (content.length > 2000) {
    return { error: 'Comment is too long (max 2000 characters)' };
  }

  const { data: existingComment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!existingComment) {
    return { error: 'Comment not found' };
  }

  if (existingComment.user_id !== user.id) {
    return { error: 'You can only edit your own comments' };
  }

  const { data, error } = await supabase
    .from('comments')
    .update({
      content: content.trim(),
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    return { error: 'Failed to update comment' };
  }

  revalidatePath(`/projects/[slug]`);
  return { data, error: null };
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated' };
  }

  const { data: existingComment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!existingComment) {
    return { error: 'Comment not found' };
  }

  if (existingComment.user_id !== user.id) {
    return { error: 'You can only delete your own comments' };
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    return { error: 'Failed to delete comment' };
  }

  revalidatePath(`/projects/[slug]`);
  return { error: null };
}

export async function getComments(projectId: string, parentId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('comments')
    .select(`
      *,
      user:users (
        id,
        username,
        full_name,
        avatar_url
      ),
      replies:comments (
        id,
        content,
        created_at,
        user:users (
          id,
          username,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('project_id', projectId)
    .is('deleted', false)
    .order('created_at', { ascending: false });

  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else {
    query = query.is('parent_id', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return data || [];
}

export async function getCommentCount(projectId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('deleted', false);

  if (error) {
    console.error('Error fetching comment count:', error);
    return 0;
  }

  return count || 0;
}
