"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BasicInfoStep } from "@/components/create-project/basic-info-step";
import { MilestonesStep } from "@/components/create-project/milestones-step";
import { RewardsStep } from "@/components/create-project/rewards-step";
import { ReviewStep } from "@/components/create-project/review-step";
import { publishProject, saveDraft, getProject, updateProject, resubmitProject } from "@/app/actions/project";
import type { ProjectBasicInfo, Milestone, Reward } from "@/lib/validations/project";

type Step = "basic" | "milestones" | "rewards" | "review";

function CreateProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProjectId = searchParams.get("project");

  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [basicInfo, setBasicInfo] = useState<ProjectBasicInfo | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const steps: { id: Step; title: string; description: string }[] = [
    {
      id: "basic",
      title: "Basic Info",
      description: "Project details and category",
    },
    {
      id: "milestones",
      title: "Milestones",
      description: "Funding stages and goals",
    },
    {
      id: "rewards",
      title: "Rewards",
      description: "Backer reward tiers",
    },
    {
      id: "review",
      title: "Review",
      description: "Review and publish",
    },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleBasicInfoComplete = (data: ProjectBasicInfo) => {
    setBasicInfo(data);
    setCurrentStep("milestones");
  };

  const handleMilestonesComplete = (data: Milestone[]) => {
    setMilestones(data);
    setCurrentStep("rewards");
  };

  const handleRewardsComplete = (data: Reward[]) => {
    setRewards(data);
    setCurrentStep("review");
  };

  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editProjectId) {
      loadProjectData(editProjectId);
    }
  }, [editProjectId]);

  async function loadProjectData(projectId: string) {
    setLoading(true);
    const result = await getProject(projectId);

    if (result.success && result.project) {
      const project = result.project;

      setBasicInfo({
        title: project.title,
        description: project.description,
        category: project.category,
        fundingGoal: project.goal_amount,
        deadline: new Date(project.deadline),
        imageUrl: project.cover_image || undefined,
      });

      if (project.milestones) {
        setMilestones(
          project.milestones.map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            fundingTarget: m.goal_amount,
            order_index: m.order_index,
            current_amount: m.current_amount,
            status: m.status,
          }))
        );
      }

      if (project.rewards) {
        setRewards(
          project.rewards.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            pledgeAmount: r.amount,
            estimatedDelivery: new Date(r.estimated_delivery),
            backerLimit: r.quantity_total || undefined,
            shippingType: !r.shipping_required
              ? "digital"
              : r.shipping_locations?.includes("worldwide")
              ? "worldwide"
              : r.shipping_locations?.includes("domestic")
              ? "domestic"
              : "local",
            quantity_claimed: r.quantity_claimed,
          }))
        );
      }

      setIsEditMode(true);
    } else if (result.error) {
      alert(`Error loading project: ${result.error}`);
      router.push("/dashboard");
    }

    setLoading(false);
  }

  const handlePublish = async () => {
    if (!basicInfo) return;

    setPublishing(true);

    if (isEditMode && editProjectId) {
      const result = await updateProject({
        basicInfo,
        milestones,
        rewards,
        projectId: editProjectId,
      });

      if (result.error) {
        alert(`Error: ${result.error}`);
        setPublishing(false);
      } else if (result.success) {
        const resubmitResult = await resubmitProject(editProjectId);
        if (resubmitResult.error) {
          alert(`Project updated but failed to resubmit: ${resubmitResult.error}`);
          setPublishing(false);
        } else {
          alert("Project updated and resubmitted for review! Redirecting to dashboard...");
          router.push("/dashboard/creator");
        }
      }
    } else {
      const result = await publishProject({
        basicInfo,
        milestones,
        rewards,
      });

      if (result.error) {
        alert(`Error: ${result.error}`);
        setPublishing(false);
      } else if (result.success) {
        alert("Project submitted for review! Redirecting to dashboard...");
        router.push("/dashboard/creator");
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!basicInfo) return;

    setSaving(true);

    if (isEditMode && editProjectId) {
      const result = await updateProject({
        basicInfo,
        milestones,
        rewards,
        projectId: editProjectId,
      });

      if (result.error) {
        alert(`Error: ${result.error}`);
      } else if (result.success) {
        alert("Draft updated successfully!");
      }
    } else {
      const result = await saveDraft({
        basicInfo,
        milestones,
        rewards,
      });

      if (result.error) {
        alert(`Error: ${result.error}`);
      } else if (result.success) {
        alert("Draft saved successfully!");
      }
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isEditMode ? "Edit Project" : "Create a Project"}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? "Update your project details and resubmit for review"
              : "Launch your 3D printing project and bring your ideas to life"}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">Loading project data...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex-1 ${index !== steps.length - 1 ? "pr-4" : ""}`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          index <= currentStepIndex
                            ? "bg-primary-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="ml-3 flex-1">
                        <div
                          className={`text-sm font-semibold ${
                            index <= currentStepIndex
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-500 hidden md:block">
                          {step.description}
                        </div>
                      </div>
                      {index !== steps.length - 1 && (
                        <div className="flex-1 h-0.5 bg-gray-200 ml-4">
                          <div
                            className={`h-full ${
                              index < currentStepIndex
                                ? "bg-primary-600"
                                : "bg-gray-200"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStepIndex].title}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep === "basic" && (
                  <BasicInfoStep
                    initialData={basicInfo}
                    onComplete={handleBasicInfoComplete}
                    onBack={() => router.push("/dashboard/creator")}
                  />
                )}
                {currentStep === "milestones" && (
                  <MilestonesStep
                    initialData={milestones}
                    fundingGoal={basicInfo?.fundingGoal || 0}
                    onComplete={handleMilestonesComplete}
                    onBack={() => setCurrentStep("basic")}
                  />
                )}
                {currentStep === "rewards" && (
                  <RewardsStep
                    initialData={rewards}
                    onComplete={handleRewardsComplete}
                    onBack={() => setCurrentStep("milestones")}
                  />
                )}
                {currentStep === "review" && basicInfo && (
                  <ReviewStep
                    basicInfo={basicInfo}
                    milestones={milestones}
                    rewards={rewards}
                    onPublish={handlePublish}
                    onSaveDraft={handleSaveDraft}
                    onBack={() => setCurrentStep("rewards")}
                    publishing={publishing}
                    saving={saving}
                  />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <CreateProjectContent />
    </Suspense>
  );
}
