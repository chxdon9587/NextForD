"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface LikedProject {
  id: string;
  project_id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  goal_amount: number;
  current_amount: number;
  backer_count: number;
  deadline: string;
  cover_image: string | null;
  like_count: number;
}

interface FollowedCreator {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followed_at: string;
}

export default function BackerSaved({ userId }: { userId: string }) {
  const [likedProjects, setLikedProjects] = useState<LikedProject[]>([]);
  const [followedCreators, setFollowedCreators] = useState<FollowedCreator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  async function fetchData() {
    const supabase = createClient();

    const [likesResult, followsResult] = await Promise.all([
      supabase
        .from('likes')
        .select(`
          *,
          projects (
            id,
            title,
            slug,
            description,
            category,
            status,
            goal_amount,
            current_amount,
            backer_count,
            deadline,
            cover_image,
            like_count
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('follows')
        .select(`
          *,
          users!following_id (
            id,
            username,
            full_name,
            avatar_url,
            bio
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    if (likesResult.error) {
      console.error('Error fetching liked projects:', likesResult.error);
    } else {
      const projects = likesResult.data
        ?.map(l => ({
          ...l.projects,
          project_id: l.project_id,
        }))
        .filter(Boolean) as LikedProject[];
      setLikedProjects(projects);
    }

    if (followsResult.error) {
      console.error('Error fetching follows:', followsResult.error);
    } else {
      const creators = followsResult.data
        ?.map(f => ({
          ...f.users,
          followed_at: f.created_at,
        }))
        .filter(Boolean) as FollowedCreator[];
      setFollowedCreators(creators);
    }

    setLoading(false);
  }

  const getProgress = (current: number, goal: number) => {
    return goal > 0 ? (current / goal) * 100 : 0;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      live: 'bg-green-100 text-green-800',
      successful: 'bg-purple-100 text-purple-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toLowerCase()}
      </Badge>
    );
  };

  const ProjectCard = ({ project }: { project: LikedProject }) => {
    const progress = getProgress(project.current_amount, project.goal_amount);

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
            {project.cover_image && (
              <img
                src={project.cover_image}
                alt={project.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">
                  ${project.current_amount.toLocaleString()}
                </span>
                <span className="text-gray-600">
                  of ${project.goal_amount.toLocaleString()} goal
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{progress.toFixed(0)}% funded</span>
                <span>{project.backer_count} backers</span>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p className="line-clamp-2">{project.description}</p>
              <p className="mt-1">
                Deadline: {formatDistanceToNow(new Date(project.deadline), { addSuffix: true })}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Link href={`/projects/${project.slug}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Project
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CreatorCard = ({ creator }: { creator: FollowedCreator }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.full_name || creator.username || 'Anonymous'}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
              👤
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {creator.full_name || creator.username || 'Anonymous'}
            </h3>
            {creator.username && (
              <p className="text-sm text-gray-600">@{creator.username}</p>
            )}
            {creator.bio && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {creator.bio}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Followed {formatDistanceToNow(new Date(creator.followed_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
        <p className="text-gray-600">Loading saved items...</p>
      </div>
    );
  }

  return (
    <div>
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="projects">
            Liked Projects ({likedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="creators">
            Followed Creators ({followedCreators.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {likedProjects.length === 0 ? (
            <EmptyState message="You haven't liked any projects yet. Browse projects and like your favorites!" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {likedProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="creators">
          {followedCreators.length === 0 ? (
            <EmptyState message="You aren't following any creators yet. Follow creators whose projects you love!" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {followedCreators.map(creator => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
