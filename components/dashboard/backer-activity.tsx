"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: 'backing' | 'comment' | 'update' | 'like' | 'follow';
  project_title?: string;
  project_slug?: string;
  project_cover_image?: string | null;
  amount?: number;
  content?: string;
  creator_name?: string;
  creator_username?: string;
  created_at: string;
}

export default function BackerActivity({ userId }: { userId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  async function fetchActivities() {
    const supabase = createClient();

    const [backingsResult, commentsResult] = await Promise.all([
      supabase
        .from('backings')
        .select(`
          *,
          projects (
            title,
            slug,
            cover_image
          )
        `)
        .eq('backer_id', userId)
        .order('backed_at', { ascending: false })
        .limit(10),
      supabase
        .from('comments')
        .select(`
          *,
          projects (
            title,
            slug
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const activities: Activity[] = [];

    backingsResult.data?.forEach(b => {
      activities.push({
        id: `backing-${b.id}`,
        type: 'backing',
        project_title: b.projects?.title,
        project_slug: b.projects?.slug,
        project_cover_image: b.projects?.cover_image,
        amount: b.amount,
        created_at: b.backed_at,
      });
    });

    commentsResult.data?.forEach(c => {
      activities.push({
        id: `comment-${c.id}`,
        type: 'comment',
        project_title: c.projects?.title,
        project_slug: c.projects?.slug,
        content: c.content,
        created_at: c.created_at,
      });
    });

    activities.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setActivities(activities.slice(0, 20));
    setLoading(false);
  }

  const getIcon = (type: Activity['type']) => {
    const icons: Record<Activity['type'], string> = {
      backing: '💰',
      comment: '💬',
      update: '📢',
      like: '❤️',
      follow: '👥',
    };
    return icons[type] || '📌';
  };

  const getTypeLabel = (type: Activity['type']) => {
    const labels: Record<Activity['type'], string> = {
      backing: 'Backed',
      comment: 'Commented on',
      update: 'Update from',
      like: 'Liked',
      follow: 'Followed',
    };
    return labels[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading activity...</p>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No recent activity yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Start backing projects and engaging with the community!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="text-2xl">{getIcon(activity.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {getTypeLabel(activity.type)}
                      </span>
                      {activity.project_title && (
                        <span className="text-sm text-gray-600">
                          {activity.project_title}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                    {activity.amount && (
                      <p className="text-sm text-gray-600 mt-1">
                        Amount: ${activity.amount.toLocaleString()}
                      </p>
                    )}
                    {activity.content && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {activity.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
