import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackerProjects from "@/components/dashboard/backer-projects";
import BackerActivity from "@/components/dashboard/backer-activity";
import BackerSaved from "@/components/dashboard/backer-saved";

export default async function BackerDashboardPage({
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

  const tab = (await searchParams).tab || 'backed';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Backer Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {userData?.full_name || userData?.username || user.email}!
          </p>
        </div>

        <Tabs defaultValue={tab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="backed">Backed Projects</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="backed" className="space-y-6">
            <BackerProjects userId={user.id} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  View your complete order history with reward details and shipping information.
                </p>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    All your backing orders will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <BackerSaved userId={user.id} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <BackerActivity userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
