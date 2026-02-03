import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CreatorAnalyticsProps {
  userId: string;
}

export default async function CreatorAnalytics({ userId }: CreatorAnalyticsProps) {
  const supabase = await createClient();

  const [
    { count: totalProjects },
    { count: liveProjects },
    { data: totalFunding },
    { data: milestoneData },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId),
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .eq('status', 'live'),
    supabase
      .from('projects')
      .select('id, current_amount')
      .eq('creator_id', userId)
      .in('status', ['live', 'successful']),
    supabase
      .from('backings')
      .select('project_id')
      .eq('backer_id', userId),
  ]);

  const projectIds = totalFunding?.map(p => p.id) || [];

  const [
    { count: totalBackers },
    { count: completedMilestones },
  ] = await Promise.all([
    supabase
      .from('backings')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds.length > 0 ? projectIds : ['']),
    supabase
      .from('milestones')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds.length > 0 ? projectIds : [''])
      .eq('status', 'completed'),
  ]);

  const totalFundingAmount = totalFunding?.reduce((sum, project) => {
    return sum + (parseFloat(project.current_amount?.toString() || '0'));
  }, 0) || 0;

  const avgFundingPerProject = totalProjects ? totalFundingAmount / totalProjects : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {totalProjects || 0}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {liveProjects || 0} currently live
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Backers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {totalBackers || 0}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Funding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ${totalFundingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              ${avgFundingPerProject.toLocaleString()} avg per project
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Milestones Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {completedMilestones || 0}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Successfully verified
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New backers this week</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Projects nearing deadline</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Updates posted this month</span>
                <span className="text-sm font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/create"
                className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Create New Project
              </a>
              <a
                href="/dashboard/creator?tab=milestones"
                className="block w-full text-center border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium"
              >
                Manage Milestones
              </a>
              <a
                href="/dashboard/creator?tab=backers"
                className="block w-full text-center border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium"
              >
                View Backers
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
