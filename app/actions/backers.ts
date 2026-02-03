"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProjectBackers(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('backings')
    .select(`
      *,
      users (
        id,
        username,
        full_name,
        avatar_url,
        email
      ),
      rewards (
        id,
        title,
        description,
        amount
      )
    `)
    .eq('project_id', projectId)
    .order('backed_at', { ascending: false });

  if (error) {
    console.error('Error fetching project backers:', error);
    return [];
  }

  return data || [];
}

export async function exportBackersToCSV(projectId: string) {
  const backers = await getProjectBackers(projectId);

  if (backers.length === 0) {
    return { error: 'No backers to export' };
  }

  const headers = [
    'Name',
    'Email',
    'Reward',
    'Amount',
    'Status',
    'Backed At',
  ];

  const csvContent = [
    headers.join(','),
    ...backers.map(backing => {
      const reward = backing.rewards
        ? `${backing.rewards.title} ($${backing.rewards.amount})`
        : 'No reward';
      return [
        backing.users.full_name || backing.users.username || '',
        backing.users.email || '',
        `"${reward}"`,
        backing.amount,
        backing.status,
        backing.backed_at,
      ].join(',');
    }),
  ].join('\n');

  return {
    success: true,
    csv: csvContent,
    filename: `backers-${projectId}-${Date.now()}.csv`,
  };
}
