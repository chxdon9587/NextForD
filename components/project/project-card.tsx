import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface ProjectCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  status: string;
  fundingGoal: number;
  currentFunding: number;
  backersCount: number;
  creatorName: string;
  creatorAvatar?: string;
  deadline?: Date;
}

export function ProjectCard({
  slug,
  title,
  description,
  imageUrl,
  category,
  status,
  fundingGoal,
  currentFunding,
  backersCount,
  creatorName,
  deadline,
}: ProjectCardProps) {
  const fundingPercentage = (currentFunding / fundingGoal) * 100;
  const daysLeft = deadline
    ? Math.max(
        0,
        Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "live":
        return "success";
      case "successful":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Link href={`/projects/${slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer h-full">
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-200 to-gray-300">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={getStatusVariant(status)} className="capitalize">
              {status}
            </Badge>
            <Badge variant="secondary">{category}</Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {description}
          </p>

          <div className="space-y-2">
            <Progress value={currentFunding} max={fundingGoal} />
            <div className="flex justify-between text-sm">
              <div>
                <span className="font-bold text-primary-600">
                  ${currentFunding}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  of ${fundingGoal}
                </span>
              </div>
              <div className="text-muted-foreground">
                {fundingPercentage.toFixed(0)}%
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs">
              {creatorName[0]?.toUpperCase()}
            </div>
            <span>{creatorName}</span>
          </div>
          {daysLeft !== null && (
            <div>
              <span className="font-semibold text-gray-900">{daysLeft}</span>{" "}
              days left
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
