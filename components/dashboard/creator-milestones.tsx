"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'verified' | 'failed';

interface Milestone {
  id: string;
  project_id: string;
  project_title: string;
  project_slug: string;
  title: string;
  description: string | null;
  goal_amount: number;
  current_amount: number;
  order_index: number;
  deadline_days: number;
  status: MilestoneStatus;
  completion_proof: string | null;
  verified_at: string | null;
  created_at: string;
}

export default function CreatorMilestones({ userId }: { userId: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestones();
  }, [userId]);

  async function fetchMilestones() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('milestones')
      .select(`
        *,
        projects!inner (
          id,
          title,
          slug,
          creator_id
        )
      `)
      .eq('projects.creator_id', userId)
      .order('project_id')
      .order('order_index');

    if (error) {
      console.error('Error fetching milestones:', error);
    } else {
      const formattedMilestones = data.map(m => ({
        ...m,
        project_title: m.projects.title,
        project_slug: m.projects.slug,
        project_id: m.projects.id,
      })) as Milestone[];
      setMilestones(formattedMilestones);
    }

    setLoading(false);
  }

  const getMilestonesByStatus = (status: MilestoneStatus) => {
    return milestones.filter(m => m.status === status);
  };

  const getProgress = (milestone: Milestone) => {
    return milestone.goal_amount > 0
      ? (milestone.current_amount / milestone.goal_amount) * 100
      : 0;
  };

  const getStatusBadge = (status: MilestoneStatus) => {
    const variants: Record<MilestoneStatus, string> = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    const labels: Record<MilestoneStatus, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      verified: 'Verified',
      failed: 'Failed',
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const MilestoneCard = ({ milestone }: { milestone: Milestone }) => {
    const progress = getProgress(milestone);

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{milestone.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{milestone.project_title}</p>
            </div>
            {getStatusBadge(milestone.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestone.description && (
              <p className="text-sm text-gray-700">{milestone.description}</p>
            )}

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">
                  ${milestone.current_amount.toLocaleString()}
                </span>
                <span className="text-gray-600">
                  of ${milestone.goal_amount.toLocaleString()} goal
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-gray-600 mt-1">
                {progress.toFixed(0)}% funded
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">Order</p>
                <p>Milestone #{milestone.order_index + 1}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Deadline</p>
                <p>{milestone.deadline_days} days after launch</p>
              </div>
            </div>

            {milestone.verified_at && (
              <div className="text-sm text-green-600">
                Verified {formatDistanceToNow(new Date(milestone.verified_at), { addSuffix: true })}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" disabled>
                View Details
              </Button>
              {milestone.status === 'in_progress' && (
                <Button className="flex-1" disabled>
                  Request Verification
                </Button>
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
        <p className="text-gray-600">Loading milestones...</p>
      </div>
    );
  }

  const pendingMilestones = getMilestonesByStatus('pending');
  const inProgressMilestones = getMilestonesByStatus('in_progress');
  const completedMilestones = getMilestonesByStatus('completed');
  const verifiedMilestones = getMilestonesByStatus('verified');

  return (
    <div>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            All ({milestones.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingMilestones.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressMilestones.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedMilestones.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({verifiedMilestones.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {milestones.length === 0 ? (
            <EmptyState message="No milestones yet. Create a project with milestones to see them here!" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {milestones.map(milestone => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingMilestones.length === 0 ? (
            <EmptyState message="No pending milestones. Milestones waiting for funding will appear here." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {pendingMilestones.map(milestone => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress">
          {inProgressMilestones.length === 0 ? (
            <EmptyState message="No milestones in progress. Milestones that have reached their funding goal will appear here." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {inProgressMilestones.map(milestone => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedMilestones.length === 0 ? (
            <EmptyState message="No completed milestones awaiting verification." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {completedMilestones.map(milestone => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified">
          {verifiedMilestones.length === 0 ? (
            <EmptyState message="No verified milestones yet. Verified milestones will appear here." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {verifiedMilestones.map(milestone => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
