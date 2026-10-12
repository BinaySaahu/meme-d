import type { IMilestone } from "../models/Campaign";

export function getTargetPayout(
  milestones: readonly IMilestone[],
  views: number
): number {
  let targetPayout = 0;

  for (const milestone of milestones) {
    if (views < milestone.views) {
      break;
    }
    targetPayout = milestone.payout;
  }

  return targetPayout;
}

export function getIncrementalPayout(
  targetPayout: number,
  paidAmount: number
): number {
  return Math.max(0, targetPayout - paidAmount);
}
