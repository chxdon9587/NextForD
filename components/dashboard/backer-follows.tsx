"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface Following {
  id: string;
  following_id: string;
  created_at: string;
  users: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function BackerFollows({ userId }: { userId: string }) {
  const [followings, setFollowings] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowings();
  }, [userId]);

  async function fetchFollowings() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('follows')
      .select(`
        *,
        users!follows_following_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching followings:', error);
    } else {
      setFollowings(data || []);
    }

    setLoading(false);
  }

  const handleUnfollow = async (followingId: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('following_id', followingId)
      .eq('follower_id', userId);

    if (error) {
      console.error('Error unfollowing:', error);
      alert('Failed to unfollow');
    } else {
      setFollowings(followings.filter(f => f.following_id !== followingId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading follows...</p>
      </div>
    );
  }

  return (
    <div>
      {followings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 text-center">You are not following any creators yet.</p>
            <Link href="/projects">
              <Button className="mt-4">Discover Projects</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {followings.map((following) => (
            <Card key={following.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarImage src={following.users.avatar_url || undefined} />
                    <AvatarFallback>
                      {following.users.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {following.users.full_name || following.users.username}
                    </h3>
                    <p className="text-sm text-gray-600">
                      @{following.users.username}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/creators/${following.users.username}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      View Profile
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnfollow(following.following_id)}
                  >
                    Unfollow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}