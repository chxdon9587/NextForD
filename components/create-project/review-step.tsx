"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ProjectBasicInfo, Milestone, Reward } from "@/lib/validations/project";

interface ReviewStepProps {
  basicInfo: ProjectBasicInfo;
  milestones: Milestone[];
  rewards: Reward[];
  onPublish: () => void;
  onBack: () => void;
}

export function ReviewStep({
  basicInfo,
  milestones,
  rewards,
  onPublish,
  onBack,
}: ReviewStepProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      miniatures: "Miniatures & Models",
      accessories: "Accessories",
      organization: "Organization",
      tools: "Tools & Equipment",
      art: "Art & Decoration",
      functional: "Functional Parts",
      other: "Other",
    };
    return labels[category] || category;
  };

  const getShippingLabel = (type: string) => {
    const labels: Record<string, string> = {
      digital: "Digital Only",
      local: "Local Pickup",
      domestic: "Domestic Shipping",
      worldwide: "Worldwide Shipping",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">
          Almost There!
        </h3>
        <p className="text-sm text-green-800">
          Review your project details below. Once you publish, your project will be submitted for review before going live.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">{basicInfo.title}</h3>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary">{getCategoryLabel(basicInfo.category)}</Badge>
              <Badge variant="default">
                ${basicInfo.fundingGoal.toLocaleString()} goal
              </Badge>
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {basicInfo.description}
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-semibold">{getCategoryLabel(basicInfo.category)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funding Goal</p>
                <p className="font-semibold">${basicInfo.fundingGoal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Campaign End Date</p>
                <p className="font-semibold">{formatDate(basicInfo.deadline)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">
                  {Math.ceil(
                    (basicInfo.deadline.getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones ({milestones.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">
                    Milestone {index + 1}: {milestone.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {milestone.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">
                    ${milestone.fundingTarget.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">target</p>
                </div>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">
                $
                {milestones
                  .reduce((sum, m) => sum + m.fundingTarget, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reward Tiers ({rewards.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rewards
            .sort((a, b) => a.pledgeAmount - b.pledgeAmount)
            .map((reward, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-bold text-primary-600">
                        ${reward.pledgeAmount}
                      </span>
                      <Badge variant="secondary">{getShippingLabel(reward.shippingType)}</Badge>
                      {reward.backerLimit && (
                        <Badge variant="warning">Limited to {reward.backerLimit}</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold mb-1">{reward.title}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {reward.description}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Estimated delivery: {formatDate(reward.estimatedDelivery)}
                </p>
              </div>
            ))}
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Before Publishing</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Make sure the database is deployed (see scripts/deploy-database.md)</li>
              <li>Your project will be in &quot;pending_review&quot; status after publishing</li>
              <li>Platform admins will review before making it live</li>
              <li>You can save as draft and come back later</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline">
            Save as Draft
          </Button>
          <Button type="button" onClick={onPublish}>
            Publish Project
          </Button>
        </div>
      </div>
    </div>
  );
}
