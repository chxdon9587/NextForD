import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.email}!</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary-600">0</p>
              <p className="text-sm text-muted-foreground mt-2">
                Projects created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backed Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary-600">0</p>
              <p className="text-sm text-muted-foreground mt-2">
                Projects supported
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Pledged</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary-600">$0</p>
              <p className="text-sm text-muted-foreground mt-2">
                Across all projects
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button>Create Project</Button>
              <Button variant="outline">Browse Projects</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
