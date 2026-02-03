"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type ProjectStatus = 'draft' | 'pending_review' | 'approved' | 'live' | 'successful' | 'failed' | 'cancelled';

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: ProjectStatus;
  goal_amount: number;
  current_amount: number;
  backer_count: number;
  deadline: string;
  created_at: string;
  cover_image: string | null;
}

export default function CreatorProjects({ userId }: { userId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  async function fetchProjects() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }

    setLoading(false);
  }

  const getProjectsByStatus = (status: ProjectStatus | ProjectStatus[]) => {
    if (Array.isArray(status)) {
      return projects.filter(p => status.includes(p.status));
    }
    return projects.filter(p => p.status === status);
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const variants: Record<ProjectStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      live: 'bg-green-100 text-green-800',
      successful: 'bg-purple-100 text-purple-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<ProjectStatus, string> = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      approved: 'Approved',
      live: 'Live',
      successful: 'Successful',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const ProjectCard = ({ project }: { project: Project }) => {
    const progress = project.goal_amount > 0
      ? (project.current_amount / project.goal_amount) * 100
      : 0;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{project.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{project.category}</p>
            </div>
            {getStatusBadge(project.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">
                  ${project.current_amount.toLocaleString()}
                </span>
                <span className="text-gray-600">
                  of ${project.goal_amount.toLocaleString()} goal
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{progress.toFixed(0)}% funded</span>
                <span>{project.backer_count} backers</span>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                Deadline: {formatDistanceToNow(new Date(project.deadline), { addSuffix: true })}
              </p>
              <p className="mt-1">
                Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Link href={`/projects/${project.slug}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View
                </Button>
              </Link>
              {project.status === 'draft' && (
                <Link href={`/create?project=${project.id}`} className="flex-1">
                  <Button className="w-full">
                    Edit
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-600 text-center">{message}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading projects...</p>
      </div>
    );
  }

  const draftProjects = getProjectsByStatus('draft');
  const activeProjects = getProjectsByStatus(['pending_review', 'approved', 'live']);
  const completedProjects = getProjectsByStatus(['successful', 'failed', 'cancelled']);

  return (
    <div>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            All ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({draftProjects.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {projects.length === 0 ? (
            <EmptyState message="You haven't created any projects yet. Start by creating your first project!" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {activeProjects.length === 0 ? (
            <EmptyState message="No active projects. Projects awaiting review, approved, or live will appear here." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft">
          {draftProjects.length === 0 ? (
            <EmptyState message="No draft projects. Create your first project!" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {draftProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedProjects.length === 0 ? (
            <EmptyState message="No completed projects yet. Successful, failed, or cancelled projects will appear here." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
