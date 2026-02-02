import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Milestone {
  id: string;
  title: string;
  description: string;
  fundingTarget: number;
  currentFunding: number;
  status: "pending" | "in_progress" | "completed" | "verified" | "failed";
  order_index: number;
}

interface MilestoneProgressProps {
  milestones: Milestone[];
  totalFunding: number;
  totalGoal: number;
}

export function MilestoneProgress({
  milestones,
  totalFunding,
  totalGoal,
}: MilestoneProgressProps) {
  const sortedMilestones = [...milestones].sort((a, b) => a.order_index - b.order_index);

  const getStatusColor = (status: Milestone["status"]) => {
    switch (status) {
      case "completed":
      case "verified":
        return "success";
      case "in_progress":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: Milestone["status"]) => {
    switch (status) {
      case "completed":
      case "verified":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "in_progress":
        return (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case "failed":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={totalFunding} max={totalGoal} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="font-bold text-primary-600 text-lg">
                ${totalFunding}
              </span>
              <span className="text-muted-foreground">
                ${totalGoal} goal
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sortedMilestones.map((milestone, index) => {
          const progress = Math.min(
            (milestone.currentFunding / milestone.fundingTarget) * 100,
            100
          );
          const isUnlocked = milestone.currentFunding >= milestone.fundingTarget;

          return (
            <Card
              key={milestone.id}
              className={`relative ${
                milestone.status === "verified" ? "bg-green-50" : ""
              }`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-l-lg" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      milestone.status === "verified"
                        ? "bg-green-500 text-white"
                        : milestone.status === "in_progress"
                        ? "bg-primary-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {getStatusIcon(milestone.status)}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">
                            Milestone {index + 1}: {milestone.title}
                          </h4>
                          <Badge
                            variant={getStatusColor(milestone.status)}
                            className="capitalize"
                          >
                            {milestone.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {milestone.description}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-primary-600 text-lg">
                          ${milestone.fundingTarget}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          target
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Progress
                        value={milestone.currentFunding}
                        max={milestone.fundingTarget}
                      />
                      <div className="flex justify-between text-sm">
                        <span>
                          <span className="font-semibold">
                            ${milestone.currentFunding}
                          </span>{" "}
                          <span className="text-muted-foreground">raised</span>
                        </span>
                        <span className="text-muted-foreground">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {isUnlocked && milestone.status !== "verified" && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            Funding goal reached! Waiting for verification.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
