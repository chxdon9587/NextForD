"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { projectBasicInfoSchema, type ProjectBasicInfo } from "@/lib/validations/project";

interface BasicInfoStepProps {
  initialData: ProjectBasicInfo | null;
  onComplete: (data: ProjectBasicInfo) => void;
  onBack: () => void;
}

export function BasicInfoStep({ initialData, onComplete, onBack }: BasicInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProjectBasicInfo>({
    resolver: zodResolver(projectBasicInfoSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      category: "miniatures",
      fundingGoal: 5000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const description = watch("description");

  const onSubmit = (data: ProjectBasicInfo) => {
    onComplete(data);
  };

  const categories = [
    { value: "miniatures", label: "Miniatures & Models" },
    { value: "accessories", label: "Accessories" },
    { value: "organization", label: "Organization" },
    { value: "tools", label: "Tools & Equipment" },
    { value: "art", label: "Art & Decoration" },
    { value: "functional", label: "Functional Parts" },
    { value: "other", label: "Other" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Project Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Ultra-Detailed 3D Printed Miniatures Collection"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Project Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe your project in detail. What are you creating? Why should people support it?"
          rows={10}
          {...register("description")}
        />
        <div className="flex justify-between items-center">
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
          <p className="text-sm text-muted-foreground ml-auto">
            {description?.length || 0} / 5000 characters
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select id="category" {...register("category")}>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>
          {errors.category && (
            <p className="text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundingGoal">Funding Goal ($) *</Label>
          <Input
            id="fundingGoal"
            type="number"
            step="100"
            placeholder="5000"
            {...register("fundingGoal", { valueAsNumber: true })}
          />
          {errors.fundingGoal && (
            <p className="text-sm text-red-600">{errors.fundingGoal.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Campaign Deadline *</Label>
        <Input
          id="deadline"
          type="date"
          min={new Date().toISOString().split("T")[0]}
          {...register("deadline", {
            valueAsDate: true,
          })}
        />
        {errors.deadline && (
          <p className="text-sm text-red-600">{errors.deadline.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Select a realistic deadline for your campaign
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Image Upload Coming Soon</p>
            <p>
              Image upload functionality will be available after database deployment. For now, you can continue without images.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button type="submit">
          Next: Milestones
        </Button>
      </div>
    </form>
  );
}
