"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFollow(userId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated' };
  }

  if (user.id === userId) {
    return { error: 'Cannot follow yourself' };
  }

  const { data: existingFollow } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', userId)
    .single();

  if (existingFollow) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('id', existingFollow.id);

    if (error) {
      return { error: 'Failed to unfollow user' };
    }

    revalidatePath('/dashboard/backer');
    return { following: false };
  }

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      following_id: userId,
    });

  if (error) {
    return { error: 'Failed to follow user' };
  }

  revalidatePath('/dashboard/backer');
  return { following: true };
}

export async function isFollowing(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', userId)
    .single();

  return !!data && !error;
}

export async function getFollowerCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) {
    console.error('Error fetching follower count:', error);
    return 0;
  }

  return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) {
    console.error('Error fetching following count:', error);
    return 0;
  }

  return count || 0;
}
