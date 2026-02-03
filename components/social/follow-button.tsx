"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFollow, isFollowing } from "@/app/actions/follows";

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
}

export default function FollowButton({
  userId,
  initialFollowing = false,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFollowStatus();
  }, [userId]);

  async function loadFollowStatus() {
    const isUserFollowing = await isFollowing(userId);
    setFollowing(isUserFollowing);
  }

  async function handleToggle() {
    setLoading(true);

    const result = await toggleFollow(userId);

    if (!result.error) {
      setFollowing(result.following ?? !following);
    }

    setLoading(false);
  }

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {following ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}
