"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RewardSelection } from "./reward-selection";
import { PaymentStep } from "./payment-step";
import { BackingConfirmation } from "./backing-confirmation";

type Step = "reward" | "payment" | "confirmation";

interface BackingFlowProps {
  project: any;
  user: any;
}

export function BackingFlow({ project, user }: BackingFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>("reward");
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState(0);
  const [backingId, setBackingId] = useState<string | null>(null);

  const steps = [
    { id: "reward", title: "Choose Reward" },
    { id: "payment", title: "Payment" },
    { id: "confirmation", title: "Confirmation" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleRewardSelect = (reward: any, amount?: number) => {
    setSelectedReward(reward);
    if (amount) setCustomAmount(amount);
    setCurrentStep("payment");
  };

  const handlePaymentSuccess = (id: string) => {
    setBackingId(id);
    setCurrentStep("confirmation");
  };

  return (
    <div className="space-y-8">
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
                    index <= currentStepIndex ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </div>
              </div>
              {index !== steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 ml-4">
                  <div
                    className={`h-full ${
                      index < currentStepIndex ? "bg-primary-600" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Progress value={progress} className="h-2" />

      {currentStep === "reward" && (
        <RewardSelection
          rewards={project.rewards}
          onSelect={handleRewardSelect}
        />
      )}

      {currentStep === "payment" && selectedReward && (
        <PaymentStep
          project={project}
          reward={selectedReward}
          amount={customAmount || selectedReward.pledge_amount}
          user={user}
          onSuccess={handlePaymentSuccess}
          onBack={() => setCurrentStep("reward")}
        />
      )}

      {currentStep === "confirmation" && backingId && (
        <BackingConfirmation
          project={project}
          reward={selectedReward}
          backingId={backingId}
        />
      )}
    </div>
  );
}
