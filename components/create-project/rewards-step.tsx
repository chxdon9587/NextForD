"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Reward } from "@/lib/validations/project";

interface RewardsStepProps {
  initialData: Reward[];
  onComplete: (data: Reward[]) => void;
  onBack: () => void;
}

export function RewardsStep({ initialData, onComplete, onBack }: RewardsStepProps) {
  const [rewards, setRewards] = useState<Reward[]>(
    initialData.length > 0
      ? initialData
      : [
          {
            title: "",
            description: "",
            pledgeAmount: 10,
            estimatedDelivery: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            shippingType: "digital",
          },
        ]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addReward = () => {
    setRewards([
      ...rewards,
      {
        title: "",
        description: "",
        pledgeAmount: (rewards[rewards.length - 1]?.pledgeAmount || 0) + 25,
        estimatedDelivery: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        shippingType: "worldwide",
      },
    ]);
  };

  const removeReward = (index: number) => {
    if (rewards.length > 1) {
      setRewards(rewards.filter((_, i) => i !== index));
    }
  };

  const updateReward = (index: number, field: keyof Reward, value: any) => {
    const updated = [...rewards];
    updated[index] = { ...updated[index], [field]: value };
    setRewards(updated);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    rewards.forEach((r, index) => {
      if (!r.title || r.title.length < 3) {
        newErrors[`title-${index}`] = "Title must be at least 3 characters";
      }
      if (!r.description || r.description.length < 10) {
        newErrors[`description-${index}`] = "Description must be at least 10 characters";
      }
      if (!r.pledgeAmount || r.pledgeAmount < 1) {
        newErrors[`pledgeAmount-${index}`] = "Pledge amount must be at least $1";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onComplete(rewards);
    }
  };

  const shippingTypes = [
    { value: "digital", label: "Digital Only" },
    { value: "local", label: "Local Pickup" },
    { value: "domestic", label: "Domestic Shipping" },
    { value: "worldwide", label: "Worldwide Shipping" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          Reward Tiers
        </h3>
        <p className="text-sm text-blue-800">
          Create different reward tiers for backers. Start with lower amounts and work up to higher-value rewards. Be clear about what backers will receive.
        </p>
      </div>

      <div className="space-y-4">
        {rewards
          .sort((a, b) => a.pledgeAmount - b.pledgeAmount)
          .map((reward, index) => {
            const originalIndex = rewards.findIndex(r => r === reward);
            return (
              <Card key={originalIndex}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <Badge variant="default">${reward.pledgeAmount || 0} Tier</Badge>
                    {rewards.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReward(originalIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`pledgeAmount-${originalIndex}`}>Pledge Amount ($) *</Label>
                      <Input
                        id={`pledgeAmount-${originalIndex}`}
                        type="number"
                        step="1"
                        value={reward.pledgeAmount}
                        onChange={(e) =>
                          updateReward(originalIndex, "pledgeAmount", Number(e.target.value))
                        }
                      />
                      {errors[`pledgeAmount-${originalIndex}`] && (
                        <p className="text-sm text-red-600">{errors[`pledgeAmount-${originalIndex}`]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`shippingType-${originalIndex}`}>Shipping Type *</Label>
                      <Select
                        id={`shippingType-${originalIndex}`}
                        value={reward.shippingType}
                        onChange={(e) =>
                          updateReward(originalIndex, "shippingType", e.target.value)
                        }
                      >
                        {shippingTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`title-${originalIndex}`}>Reward Title *</Label>
                    <Input
                      id={`title-${originalIndex}`}
                      placeholder="e.g., Early Bird Special"
                      value={reward.title}
                      onChange={(e) => updateReward(originalIndex, "title", e.target.value)}
                    />
                    {errors[`title-${originalIndex}`] && (
                      <p className="text-sm text-red-600">{errors[`title-${originalIndex}`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`description-${originalIndex}`}>
                      What&apos;s Included *
                    </Label>
                    <Textarea
                      id={`description-${originalIndex}`}
                      placeholder="List what backers will receive&#10;- Item 1&#10;- Item 2&#10;- Item 3"
                      rows={4}
                      value={reward.description}
                      onChange={(e) => updateReward(originalIndex, "description", e.target.value)}
                    />
                    {errors[`description-${originalIndex}`] && (
                      <p className="text-sm text-red-600">{errors[`description-${originalIndex}`]}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`estimatedDelivery-${originalIndex}`}>
                        Estimated Delivery *
                      </Label>
                      <Input
                        id={`estimatedDelivery-${originalIndex}`}
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={reward.estimatedDelivery.toISOString().split("T")[0]}
                        onChange={(e) =>
                          updateReward(originalIndex, "estimatedDelivery", new Date(e.target.value))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`backerLimit-${originalIndex}`}>
                        Backer Limit (Optional)
                      </Label>
                      <Input
                        id={`backerLimit-${originalIndex}`}
                        type="number"
                        placeholder="Leave empty for unlimited"
                        value={reward.backerLimit || ""}
                        onChange={(e) =>
                          updateReward(
                            originalIndex,
                            "backerLimit",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {rewards.length < 20 && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addReward}
        >
          + Add Another Reward Tier
        </Button>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handleSubmit}>
          Next: Review
        </Button>
      </div>
    </div>
  );
}
