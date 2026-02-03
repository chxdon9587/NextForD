"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Backing {
  id: string;
  project_id: string;
  project_title: string;
  project_slug: string;
  project_cover_image: string | null;
  project_status: string;
  project_goal_amount: number;
  project_current_amount: number;
  amount: number;
  reward_id: string | null;
  reward_title: string | null;
  reward_estimated_delivery: string | null;
  status: string;
  backed_at: string;
}

export default function BackerProjects({ userId }: { userId: string }) {
  const [backings, setBackings] = useState<Backing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBackings();
  }, [userId]);

  async function fetchBackings() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('backings')
      .select(`
        *,
        projects!inner (
          id,
          title,
          slug,
          cover_image,
          status,
          goal_amount,
          current_amount
        ),
        rewards (
          id,
          title,
          estimated_delivery
        )
      `)
      .eq('backer_id', userId)
      .order('backed_at', { ascending: false });

    if (error) {
      console.error('Error fetching backings:', error);
    } else {
      const formattedBackings = data.map(b => ({
        ...b,
        project_title: b.projects.title,
        project_slug: b.projects.slug,
        project_cover_image: b.projects.cover_image,
        project_status: b.projects.status,
        project_goal_amount: b.projects.goal_amount,
        project_current_amount: b.projects.current_amount,
        reward_title: b.rewards?.title,
        reward_estimated_delivery: b.rewards?.estimated_delivery,
      })) as Backing[];
      setBackings(formattedBackings);
    }

    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      refunded: 'Refunded',
      cancelled: 'Cancelled',
    };

    return (
      <Badge className={variants[status] || variants.pending}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getProjectProgress = (current: number, goal: number) => {
    return goal > 0 ? (current / goal) * 100 : 0;
  };

  const BackingCard = ({ backing }: { backing: Backing }) => {
    const projectProgress = getProjectProgress(
      backing.project_current_amount,
      backing.project_goal_amount
    );

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{backing.project_title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Backed ${backing.amount.toLocaleString()}
              </p>
            </div>
            {getStatusBadge(backing.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backing.project_cover_image && (
              <img
                src={backing.project_cover_image}
                alt={backing.project_title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">
                  ${backing.project_current_amount.toLocaleString()}
                </span>
                <span className="text-gray-600">
                  of ${backing.project_goal_amount.toLocaleString()} goal
                </span>
              </div>
              <Progress value={projectProgress} className="h-2" />
              <div className="text-xs text-gray-600 mt-1">
                {projectProgress.toFixed(0)}% funded
              </div>
            </div>

            {backing.reward_title && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Reward</p>
                <p className="text-sm text-gray-600">{backing.reward_title}</p>
                {backing.reward_estimated_delivery && (
                  <p className="text-xs text-gray-500 mt-1">
                    Est. delivery: {new Date(backing.reward_estimated_delivery).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>
                Backed {formatDistanceToNow(new Date(backing.backed_at), { addSuffix: true })}
              </p>
            </div>

            <Link href={`/projects/${backing.project_slug}`} className="block">
              <Button variant="outline" className="w-full">
                View Project
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-600 text-center mb-4">{message}</p>
        <Link href="/projects">
          <Button>Browse Projects</Button>
        </Link>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading backed projects...</p>
      </div>
    );
  }

  return (
    <div>
      {backings.length === 0 ? (
        <EmptyState message="You haven't backed any projects yet. Discover amazing projects to support!" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {backings.map(backing => (
            <BackingCard key={backing.id} backing={backing} />
          ))}
        </div>
      )}
    </div>
  );
}
