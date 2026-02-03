"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLike, isLiked } from "@/app/actions/likes";

interface LikeButtonProps {
  projectId: string;
  initialLiked?: boolean;
  initialCount?: number;
}

export default function LikeButton({
  projectId,
  initialLiked = false,
  initialCount = 0,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLikeStatus();
  }, [projectId]);

  async function loadLikeStatus() {
    const liked = await isLiked(projectId);
    setLiked(liked);
  }

  async function handleToggle() {
    setLoading(true);

    const result = await toggleLike(projectId);

    if (!result.error) {
      setLiked(result.liked ?? !liked);
      setCount(prev => result.liked ? prev + 1 : prev - 1);
    }

    setLoading(false);
  }

  return (
    <Button
      variant={liked ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={liked ? "bg-red-600 hover:bg-red-700" : ""}
    >
      <Heart
        className={`w-4 h-4 mr-2 ${liked ? "fill-current" : ""}`}
      />
      {count} {count === 1 ? 'Like' : 'Likes'}
    </Button>
  );
}
