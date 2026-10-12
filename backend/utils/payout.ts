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

export interface BudgetAllocation {
  spentBudget: number;
  remainingBudget: number;
}

export function allocateWithinBudget(
  totalBudget: number,
  spentBudget: number,
  requestedPayout: number
): BudgetAllocation | null {
  if (
    ![totalBudget, spentBudget, requestedPayout].every(Number.isFinite) ||
    totalBudget < 0 ||
    spentBudget < 0 ||
    spentBudget > totalBudget ||
    requestedPayout < 0
  ) {
    throw new RangeError("Budget values must be finite and within valid limits");
  }

  const remainingBudget = totalBudget - spentBudget;
  if (requestedPayout > remainingBudget) {
    return null;
  }

  const nextSpentBudget = spentBudget + requestedPayout;
  return {
    spentBudget: nextSpentBudget,
    remainingBudget: totalBudget - nextSpentBudget,
  };
}
