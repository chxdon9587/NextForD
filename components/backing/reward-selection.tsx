"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RewardCard } from "@/components/project/reward-card";

interface RewardSelectionProps {
  rewards: any[];
  onSelect: (reward: any, customAmount?: number) => void;
}

export function RewardSelection({ rewards, onSelect }: RewardSelectionProps) {
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleRewardSelect = (reward: any) => {
    setSelectedRewardId(reward.id);
    setShowCustom(false);
  };

  const handleCustomSelect = () => {
    setSelectedRewardId(null);
    setShowCustom(true);
  };

  const handleContinue = () => {
    if (showCustom) {
      const amount = parseFloat(customAmount);
      if (amount >= 1) {
        onSelect({ id: "custom", title: "Custom Amount", pledge_amount: amount }, amount);
      }
    } else if (selectedRewardId) {
      const reward = rewards.find((r) => r.id === selectedRewardId);
      if (reward) {
        onSelect(reward);
      }
    }
  };

  const canContinue = showCustom
    ? parseFloat(customAmount) >= 1
    : selectedRewardId !== null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Reward</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select a reward tier to support this project. Your pledge helps bring this idea to life!
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {rewards
          .sort((a, b) => a.pledge_amount - b.pledge_amount)
          .map((reward) => (
            <div key={reward.id} onClick={() => handleRewardSelect(reward)}>
              <RewardCard
                {...reward}
                isSelected={selectedRewardId === reward.id}
                onSelect={() => handleRewardSelect(reward)}
              />
            </div>
          ))}

        <Card
          className={`cursor-pointer transition-all ${
            showCustom
              ? "ring-2 ring-primary-600 border-primary-600"
              : "hover:border-primary-300"
          }`}
          onClick={handleCustomSelect}
        >
          <CardHeader>
            <CardTitle className="text-lg">Custom Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Support this project with a custom pledge amount of your choice.
            </p>
            {showCustom && (
              <div className="space-y-2">
                <Label htmlFor="customAmount">Your Pledge Amount ($)</Label>
                <Input
                  id="customAmount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleContinue} disabled={!canContinue}>
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}
