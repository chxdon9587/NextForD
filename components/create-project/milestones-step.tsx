"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Milestone } from "@/lib/validations/project";

interface MilestonesStepProps {
  initialData: Milestone[];
  fundingGoal: number;
  onComplete: (data: Milestone[]) => void;
  onBack: () => void;
}

export function MilestonesStep({
  initialData,
  fundingGoal,
  onComplete,
  onBack,
}: MilestonesStepProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(
    initialData.length > 0
      ? initialData
      : [
          {
            title: "",
            description: "",
            fundingTarget: Math.floor(fundingGoal * 0.33),
            order_index: 1,
          },
        ]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addMilestone = () => {
    const newOrder = milestones.length + 1;
    const remainingFunding = fundingGoal - getTotalFunding();
    setMilestones([
      ...milestones,
      {
        title: "",
        description: "",
        fundingTarget: Math.max(100, remainingFunding),
        order_index: newOrder,
      },
    ]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      const updated = milestones.filter((_, i) => i !== index);
      updated.forEach((m, i) => {
        m.order_index = i + 1;
      });
      setMilestones(updated);
    }
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const getTotalFunding = () => {
    return milestones.reduce((sum, m) => sum + (m.fundingTarget || 0), 0);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    milestones.forEach((m, index) => {
      if (!m.title || m.title.length < 3) {
        newErrors[`title-${index}`] = "Title must be at least 3 characters";
      }
      if (!m.description || m.description.length < 10) {
        newErrors[`description-${index}`] = "Description must be at least 10 characters";
      }
      if (!m.fundingTarget || m.fundingTarget < 100) {
        newErrors[`fundingTarget-${index}`] = "Funding target must be at least $100";
      }
    });

    const total = getTotalFunding();
    if (total !== fundingGoal) {
      newErrors.total = `Total milestone funding ($${total.toLocaleString()}) must equal project goal ($${fundingGoal.toLocaleString()})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onComplete(milestones);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          What are Milestones?
        </h3>
        <p className="text-sm text-blue-800">
          Milestones are funding stages in your project. Funds are released to you as each milestone is reached and verified. This builds trust with backers and ensures accountability.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Total Milestone Funding</span>
          <span className={`text-lg font-bold ${getTotalFunding() === fundingGoal ? 'text-green-600' : 'text-red-600'}`}>
            ${getTotalFunding().toLocaleString()} / ${fundingGoal.toLocaleString()}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getTotalFunding() === fundingGoal ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min((getTotalFunding() / fundingGoal) * 100, 100)}%` }}
          />
        </div>
        {errors.total && (
          <p className="text-sm text-red-600 mt-2">{errors.total}</p>
        )}
      </div>

      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <Card key={index}>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <Badge variant="secondary">Milestone {index + 1}</Badge>
                {milestones.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMilestone(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`title-${index}`}>Milestone Title *</Label>
                <Input
                  id={`title-${index}`}
                  placeholder="e.g., Design & Prototyping"
                  value={milestone.title}
                  onChange={(e) => updateMilestone(index, "title", e.target.value)}
                />
                {errors[`title-${index}`] && (
                  <p className="text-sm text-red-600">{errors[`title-${index}`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`description-${index}`}>Description *</Label>
                <Textarea
                  id={`description-${index}`}
                  placeholder="What will you accomplish in this milestone?"
                  rows={3}
                  value={milestone.description}
                  onChange={(e) => updateMilestone(index, "description", e.target.value)}
                />
                {errors[`description-${index}`] && (
                  <p className="text-sm text-red-600">{errors[`description-${index}`]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`fundingTarget-${index}`}>Funding Target ($) *</Label>
                <Input
                  id={`fundingTarget-${index}`}
                  type="number"
                  step="100"
                  value={milestone.fundingTarget}
                  onChange={(e) =>
                    updateMilestone(index, "fundingTarget", Number(e.target.value))
                  }
                />
                {errors[`fundingTarget-${index}`] && (
                  <p className="text-sm text-red-600">{errors[`fundingTarget-${index}`]}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {milestones.length < 10 && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addMilestone}
        >
          + Add Another Milestone
        </Button>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handleSubmit}>
          Next: Rewards
        </Button>
      </div>
    </div>
  );
}
