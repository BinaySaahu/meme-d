import mongoose, { Types } from "mongoose";
import type { RequestHandler } from "express";
import { z } from "zod";
import { Campaign } from "../models/Campaign";
import { Submission } from "../models/Submission";
import { AppError } from "../utils/AppError";
import {
  allocateWithinBudget,
  getIncrementalPayout,
  getTargetPayout,
} from "../utils/payout";

const submissionSchema = z.object({
  campaignId: z.string().refine(Types.ObjectId.isValid, "Invalid campaign ID"),
  postUrl: z
    .string()
    .url()
    .max(2048)
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    }, "Post URL must use HTTP or HTTPS"),
});

const viewsSchema = z.object({
  views: z.number().int().nonnegative(),
});

export const createSubmission: RequestHandler = async (req, res) => {
  const input = submissionSchema.parse(req.body);
  const campaign = await Campaign.findById(input.campaignId);

  if (!campaign || !campaign.isLive) {
    throw new AppError(404, "Live campaign not found");
  }
  if (campaign.totalBudget <= (campaign.spentBudget ?? 0)) {
    throw new AppError(409, "Campaign has no remaining budget");
  }

  const submission = await Submission.create({
    campaignId: campaign._id,
    creatorId: req.user!.id,
    postUrl: input.postUrl,
  });

  res.status(201).json({ submission });
};

export const updateViews: RequestHandler = async (req, res) => {
  const submissionId = req.params.id;
  if (typeof submissionId !== "string" || !Types.ObjectId.isValid(submissionId)) {
    throw new AppError(400, "Invalid submission ID");
  }

  const { views } = viewsSchema.parse(req.body);
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const submission = await Submission.findOne({
        _id: submissionId,
        // creatorId: req.user!.id,
      }).session(session);

      if (!submission) {
        const exists = await Submission.exists({ _id: submissionId }).session(session);
        if (exists) {
          throw new AppError(403, "You can only update your own submissions");
        }
        throw new AppError(404, "Submission not found");
      }

      const currentViews = submission.views ?? 0;
      const currentPaidAmount = submission.paidAmount ?? 0;

      if (views < currentViews) {
        throw new AppError(400, "Views cannot be lower than the current view count");
      }

      const campaign = await Campaign.findById(submission.campaignId).session(session);
      if (!campaign || !campaign.isLive) {
        throw new AppError(404, "Live campaign not found");
      }

      const targetPayout = getTargetPayout(campaign.milestones, views);
      const additionalPayout = getIncrementalPayout(
        targetPayout,
        currentPaidAmount
      );
      const allocation = allocateWithinBudget(
        campaign.totalBudget,
        campaign.spentBudget ?? 0,
        additionalPayout
      );

      if (!allocation) {
        throw new AppError(
          409,
          "Insufficient campaign budget; the view update was not applied"
        );
      }

      if (additionalPayout > 0) {
        const allocatedCampaign = await Campaign.findOneAndUpdate(
          {
            _id: campaign._id,
            $expr: {
              $gte: [
                {
                  $subtract: [
                    "$totalBudget",
                    { $ifNull: ["$spentBudget", 0] },
                  ],
                },
                additionalPayout,
              ],
            },
          },
          { $inc: { spentBudget: additionalPayout } },
          { new: true, session }
        );

        if (!allocatedCampaign) {
          throw new AppError(
            409,
            "Insufficient campaign budget; the view update was not applied"
          );
        }
      }

      submission.views = views;
      submission.targetPayout = targetPayout;
      submission.paidAmount = currentPaidAmount + additionalPayout;
      await submission.save({ session });

      return {
        submission: submission.toObject(),
        campaignBudget: allocation,
      };
    });

    res.status(200).json(result);
  } finally {
    await session.endSession();
  }
};

export const listMySubmissions: RequestHandler = async (req, res) => {
  const submissions = await Submission.find({ creatorId: req.user!.id })
    .populate("campaignId", "name platform milestones")
    .select("-__v")
    .sort({ createdAt: -1 })
    .lean();

  const totalPaidAmount = submissions.reduce(
    (total, submission) => total + (submission.paidAmount ?? 0),
    0
  );

  res.status(200).json({ submissions, totalPaidAmount });
};
