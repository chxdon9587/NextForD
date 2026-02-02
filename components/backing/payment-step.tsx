"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBacking } from "@/app/actions/backing";

interface PaymentStepProps {
  project: any;
  reward: any;
  amount: number;
  user: any;
  onSuccess: (backingId: string) => void;
  onBack: () => void;
}

export function PaymentStep({
  project,
  reward,
  amount,
  user,
  onSuccess,
  onBack,
}: PaymentStepProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    setProcessing(true);
    setError("");

    const result = await createBacking({
      projectId: project.id,
      rewardId: reward.id !== "custom" ? reward.id : null,
      amount,
    });

    if (result.error) {
      setError(result.error);
      setProcessing(false);
    } else if (result.backingId) {
      onSuccess(result.backingId);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Stripe Payment Integration
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              In production, this would integrate with Stripe Elements for secure payment processing.
              For now, we&apos;ll simulate the payment flow.
            </p>
            <p className="text-xs text-blue-700">
              Full Stripe integration requires webhook setup and additional configuration.
              See TODO.md for implementation details.
            </p>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-semibold">Order Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project</span>
                <span className="font-medium">{project.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reward</span>
                <span className="font-medium">{reward.title}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm">
                <p className="font-semibold mb-1">Secure Payment</p>
                <p className="text-muted-foreground">
                  Your payment information is processed securely. We never store your card details.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={processing}>
          Back
        </Button>
        <Button onClick={handlePayment} disabled={processing}>
          {processing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}
