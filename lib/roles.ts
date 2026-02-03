"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UserRole = 'backer' | 'creator' | 'admin';

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  return data.map(item => item.role as UserRole);
}

export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('has_role', {
    user_id: userId,
    role_to_check: role
  });

  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }

  return data || false;
}

export async function isCreator(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('is_creator', {
    user_id: userId
  });

  if (error) {
    console.error('Error checking creator role:', error);
    return false;
  }

  return data || false;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('is_admin', {
    user_id: userId
  });

  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }

  return data || false;
}

export async function assignRole(userId: string, role: UserRole): Promise<boolean> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', role)
    .single();

  if (existing) {
    return true;
  }

  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: role
    });

  if (error) {
    console.error('Error assigning role:', error);
    return false;
  }

  revalidatePath('/dashboard');
  return true;
}

export async function removeRole(userId: string, role: UserRole): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);

  if (error) {
    console.error('Error removing role:', error);
    return false;
  }

  revalidatePath('/dashboard');
  return true;
}
