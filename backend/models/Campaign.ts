import { Schema, model, Types, HydratedDocument } from "mongoose";


export interface IMilestone {
  views: number;  // view threshold
  payout: number; // payout amount at that threshold
}
 
export interface ICampaign {
  brandId: Types.ObjectId;
  name: string;
  platform: string;
  totalBudget: number;
  spentBudget: number;
  isLive: boolean;
  milestones: IMilestone[];
}
 
const campaignSchema = new Schema<ICampaign>({
  brandId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  platform: { type: String, required: true, trim: true, lowercase: true },
  totalBudget: { type: Number, required: true, min: 0 },
  spentBudget: { type: Number, required: true, min: 0, default: 0 },
  isLive: { type: Boolean, required: true, default: true },
  milestones: {
    type: [
      {
        _id: false,
        views: { type: Number, required: true, min: 1 },
        payout: { type: Number, required: true, min: 0 },
      },
    ],
    validate: {
      validator: (ms: IMilestone[]) =>
        ms.every(
          (milestone, index) =>
            index === 0 ||
            (milestone.views > ms[index - 1].views &&
              milestone.payout >= ms[index - 1].payout)
        ),
      message: "Milestone views must increase and payouts cannot decrease",
    },
  },
}, { timestamps: true });
 
export const Campaign = model<ICampaign>("Campaign", campaignSchema);