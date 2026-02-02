import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackingFlow } from "@/components/backing/backing-flow";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BackProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/projects/${slug}/back`);
  }

  const { data: project } = await supabase
    .from("projects")
    .select(`
      *,
      users!projects_creator_id_fkey (
        id,
        username,
        full_name
      ),
      rewards (*)
    `)
    .eq("slug", slug)
    .single();

  if (!project) {
    redirect("/projects");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Back this Project</h1>
          <p className="text-gray-600">{project.title}</p>
        </div>

        <BackingFlow project={project} user={user} />
      </div>
    </div>
  );
}
