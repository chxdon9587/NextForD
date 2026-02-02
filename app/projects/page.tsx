import { createClient } from "@/lib/supabase/server";
import { ProjectCard } from "@/components/project/project-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      users!projects_creator_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .in("status", ["live", "approved"])
    .order("created_at", { ascending: false })
    .limit(12);

  const mockProjects = [
    {
      id: "1",
      slug: "3d-printed-miniatures",
      title: "Ultra-Detailed 3D Printed Miniatures Collection",
      description:
        "High-quality, customizable 3D printed miniatures for tabletop gaming enthusiasts. 28mm scale with incredible detail.",
      cover_image: null,
      category: "miniatures",
      status: "live",
      goal_amount: 10000,
      current_amount: 7500,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      creator_id: "1",
      users: {
        username: "MiniMaster3D",
        avatar_url: null,
      },
    },
    {
      id: "2",
      slug: "custom-phone-stands",
      title: "Customizable 3D Printed Phone Stands",
      description:
        "Ergonomic, adjustable phone stands with custom color options. Perfect for desk setup enthusiasts.",
      cover_image: null,
      category: "accessories",
      status: "live",
      goal_amount: 5000,
      current_amount: 6200,
      deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      creator_id: "2",
      users: {
        username: "TechPrintCo",
        avatar_url: null,
      },
    },
    {
      id: "3",
      slug: "modular-desk-organizer",
      title: "Modular 3D Printed Desk Organizer System",
      description:
        "Build your perfect desk setup with interlocking modular organizer pieces. Customizable and expandable.",
      cover_image: null,
      category: "organization",
      status: "live",
      goal_amount: 8000,
      current_amount: 3200,
      deadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      creator_id: "3",
      users: {
        username: "OrganizeIt3D",
        avatar_url: null,
      },
    },
  ];

  const displayProjects = projects && projects.length > 0 ? projects : mockProjects;

  const categories = [
    { id: "all", name: "All Projects" },
    { id: "miniatures", name: "Miniatures" },
    { id: "accessories", name: "Accessories" },
    { id: "organization", name: "Organization" },
    { id: "tools", name: "Tools" },
    { id: "art", name: "Art & Decor" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Explore Projects</h1>
          <p className="text-gray-600">
            Discover innovative 3D printing projects from creators around the
            world
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 sticky top-4">
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`w-full text-left px-3 py-2 rounded-md transition ${
                      category.id === "all"
                        ? "bg-primary-600 text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4">Status</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Live</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Successful</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Completed</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4">Funding Goal</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Under $5,000</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">$5,000 - $10,000</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Over $10,000</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold">{displayProjects.length}</span>{" "}
                  projects
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select className="border rounded-md px-3 py-1.5 text-sm">
                  <option>Most Recent</option>
                  <option>Most Funded</option>
                  <option>Ending Soon</option>
                  <option>Most Backers</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProjects.map((project: any) => {
                const backersCount = Math.floor(Math.random() * 100) + 10;
                return (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    slug={project.slug}
                    title={project.title}
                    description={project.description}
                    imageUrl={project.cover_image}
                    category={project.category}
                    status={project.status}
                    fundingGoal={project.goal_amount}
                    currentFunding={project.current_amount}
                    backersCount={backersCount}
                    creatorName={project.users?.username || "Unknown"}
                    deadline={new Date(project.deadline)}
                  />
                );
              })}
            </div>

            {displayProjects.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}

            {displayProjects.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline">Load More Projects</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
