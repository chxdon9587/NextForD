"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ImageUpload } from "./image-upload";
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
    setValue,
  } = useForm<ProjectBasicInfo>({
    resolver: zodResolver(projectBasicInfoSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      category: "miniatures",
      fundingGoal: 5000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      imageUrl: "",
    },
  });

  const description = watch("description");
  const imageUrl = watch("imageUrl");

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

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Project Image (Optional)</Label>
        <ImageUpload
          value={imageUrl}
          onChange={(url) => setValue("imageUrl", url)}
        />
        <p className="text-sm text-muted-foreground">
          Upload a cover image for your project. This will be displayed on the project listing and detail pages.
        </p>
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
