import { z } from "zod";

export const projectBasicInfoSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be less than 5000 characters"),
  category: z.enum([
    "miniatures",
    "accessories",
    "organization",
    "tools",
    "art",
    "functional",
    "other",
  ]),
  fundingGoal: z
    .number()
    .min(100, "Funding goal must be at least $100")
    .max(1000000, "Funding goal must be less than $1,000,000"),
  deadline: z.date().min(new Date(), "Deadline must be in the future"),
  imageUrl: z.string().url().optional(),
});

export const milestoneSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  fundingTarget: z
    .number()
    .min(100, "Funding target must be at least $100"),
  order_index: z.number().int().min(1),
});

export const rewardSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  pledgeAmount: z
    .number()
    .min(1, "Pledge amount must be at least $1"),
  estimatedDelivery: z.date(),
  backerLimit: z.number().int().min(1).optional(),
  shippingType: z.enum(["digital", "local", "domestic", "worldwide"]),
});

export const projectMilestonesSchema = z.object({
  milestones: z
    .array(milestoneSchema)
    .min(1, "At least one milestone is required")
    .max(10, "Maximum 10 milestones allowed"),
});

export const projectRewardsSchema = z.object({
  rewards: z
    .array(rewardSchema)
    .min(1, "At least one reward is required")
    .max(20, "Maximum 20 rewards allowed"),
});

export type ProjectBasicInfo = z.infer<typeof projectBasicInfoSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type Reward = z.infer<typeof rewardSchema>;
