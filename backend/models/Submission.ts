import { Schema, model, Types, HydratedDocument } from "mongoose";


export interface ISubmission {
  creatorId: Types.ObjectId;
  campaignId: Types.ObjectId;
  postUrl: string;
  views: number;        // current views
  targetPayout: number; // payout indicated by the milestone ladder
  paidAmount: number;   // amount actually allocated
}
 
const submissionSchema = new Schema<ISubmission>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    postUrl: { type: String, required: true },
    views: { type: Number, default: 0, min: 0 },
    targetPayout: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

submissionSchema.index({ campaignId: 1, postUrl: 1 }, { unique: true });
 
export const Submission = model<ISubmission>("Submission", submissionSchema);