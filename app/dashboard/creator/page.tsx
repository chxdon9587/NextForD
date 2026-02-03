import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreatorAnalytics from "@/components/dashboard/creator-analytics";
import CreatorProjects from "@/components/dashboard/creator-projects";
import CreatorMilestones from "@/components/dashboard/creator-milestones";

export default async function CreatorDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{}>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  const tab = (await searchParams).tab || 'overview';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Creator Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {userData?.full_name || userData?.username || user.email}!
          </p>
        </div>

        <Tabs defaultValue={tab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="backers">Backers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <CreatorAnalytics userId={user.id} />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <CreatorProjects userId={user.id} />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            <CreatorMilestones userId={user.id} />
          </TabsContent>

          <TabsContent value="backers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Backer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  View and manage your project backers. Export lists to CSV for fulfillment.
                </p>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Select a project to view its backers
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
