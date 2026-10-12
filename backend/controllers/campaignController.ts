import type { RequestHandler } from "express";
import { z } from "zod";
import { Campaign } from "../models/Campaign";

const campaignSchema = z.object({
  name: z.string().trim().min(1).max(120),
  platform: z.string().trim().min(1).max(50),
  totalBudget: z.number().finite().positive(),
  milestones: z
    .array(
      z.object({
        views: z.number().int().positive(),
        payout: z.number().finite().nonnegative(),
      })
    )
    .min(1)
    .refine(
      (milestones) =>
        milestones.every(
          (milestone, index) =>
            index === 0 ||
            (milestone.views > milestones[index - 1].views &&
              milestone.payout >= milestones[index - 1].payout)
        ),
      "Milestone views must increase and payouts cannot decrease"
    ),
}).superRefine((campaign, context) => {
  campaign.milestones.forEach((milestone, index) => {
    if (milestone.payout > campaign.totalBudget) {
      context.addIssue({
        code: "custom",
        path: ["milestones", index, "payout"],
        message: "A milestone payout cannot exceed the campaign budget",
      });
    }
  });
});

export const createCampaign: RequestHandler = async (req, res) => {
  const input = campaignSchema.parse(req.body);
  const campaign = await Campaign.create({
    ...input,
    brandId: req.user!.id,
  });

  res.status(201).json({ campaign });
};

export const listLiveCampaigns: RequestHandler = async (_req, res) => {
  const campaigns = await Campaign.find({
    isLive: true,
    $expr: {
      $gt: ["$totalBudget", { $ifNull: ["$spentBudget", 0] }],
    },
  })
    .select("-__v")
    .sort({ createdAt: -1 });

  res.status(200).json({ campaigns });
};

export const listMyCampaigns: RequestHandler = async (req, res) => {
  const campaigns = await Campaign.find({ brandId: req.user!.id })
    .select("-__v")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      spentBudget: campaign.spentBudget ?? 0,
      remainingBudget: Math.max(
        0,
        campaign.totalBudget - (campaign.spentBudget ?? 0)
      ),
    })),
  });
};
