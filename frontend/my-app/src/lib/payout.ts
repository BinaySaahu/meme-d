export interface PayoutMilestone {
  views: number;
  payout: number;
}

export function getTargetPayout(
  milestones: readonly PayoutMilestone[],
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

export function canAllocatePayout(
  totalBudget: number,
  spentBudget: number,
  requestedPayout: number
): boolean {
  if (
    ![totalBudget, spentBudget, requestedPayout].every(Number.isFinite) ||
    totalBudget < 0 ||
    spentBudget < 0 ||
    spentBudget > totalBudget ||
    requestedPayout < 0
  ) {
    return false;
  }

  return requestedPayout <= totalBudget - spentBudget;
}
