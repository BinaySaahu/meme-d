import {
  allocateWithinBudget,
  getIncrementalPayout,
  getTargetPayout,
} from "../utils/payout";

const milestones = [
  { views: 1_000, payout: 500 },
  { views: 5_000, payout: 2_000 },
  { views: 10_000, payout: 4_000 },
];

describe("payout calculations", () => {
  it("returns zero below the first milestone", () => {
    expect(getTargetPayout(milestones, 999)).toBe(0);
  });

  it("selects only the highest milestone crossed in one update", () => {
    expect(getTargetPayout(milestones, 10_000)).toBe(4_000);
  });

  it("calculates only the amount not already paid", () => {
    expect(getIncrementalPayout(2_000, 500)).toBe(1_500);
  });

  it("does not allocate the same payout on a repeated update", () => {
    expect(getIncrementalPayout(2_000, 2_000)).toBe(0);
  });

  it("does not allocate a payout below the amount already paid", () => {
    expect(getIncrementalPayout(500, 2_000)).toBe(0);
  });
});

describe("campaign budget cap", () => {
  it("allows an allocation that exactly uses the remaining budget", () => {
    expect(allocateWithinBudget(2_000, 500, 1_500)).toEqual({
      spentBudget: 2_000,
      remainingBudget: 0,
    });
  });

  it("rejects an allocation that exceeds the remaining budget", () => {
    expect(allocateWithinBudget(2_000, 500, 1_501)).toBeNull();
  });

  it("allows zero allocation without changing the budget", () => {
    expect(allocateWithinBudget(2_000, 500, 0)).toEqual({
      spentBudget: 500,
      remainingBudget: 1_500,
    });
  });

  it("rejects invalid budget values", () => {
    expect(() => allocateWithinBudget(1_000, 1_001, 1)).toThrow(RangeError);
  });
});
