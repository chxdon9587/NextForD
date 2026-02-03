import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import { isCreator } from "@/lib/roles";
import BackerProjects from "@/components/dashboard/backer-projects";
import BackerActivity from "@/components/dashboard/backer-activity";
import BackerSaved from "@/components/dashboard/backer-saved";
import BackerFollows from "@/components/dashboard/backer-follows";

async function DashboardContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id, username, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  const isUserCreator = await isCreator(user.id);
  const tab = 'backed';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {userData?.full_name || userData?.username || user.email}!
          </p>
        </div>

        <Tabs defaultValue={tab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-[750px] mb-6">
            <TabsTrigger value="backed">My Backings</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="follows">Follows</TabsTrigger>
            {isUserCreator && (
              <TabsTrigger value="creator">Creator Dashboard</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="backed" className="space-y-6">
            <BackerProjects userId={user.id} />
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <BackerSaved userId={user.id} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <BackerActivity userId={user.id} />
          </TabsContent>

          <TabsContent value="follows" className="space-y-6">
            <BackerFollows userId={user.id} />
          </TabsContent>

          {isUserCreator && (
            <TabsContent value="creator" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Creator Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Manage your projects, view analytics, and track milestones.
                  </p>
                  <Link href="/dashboard/creator">
                    <Button className="w-full">
                      Go to Creator Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}