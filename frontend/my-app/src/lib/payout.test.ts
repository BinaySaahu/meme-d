import {
  canAllocatePayout,
  getIncrementalPayout,
  getTargetPayout,
} from "./payout";

const milestones = [
  { views: 1_000, payout: 500 },
  { views: 5_000, payout: 2_000 },
  { views: 10_000, payout: 4_000 },
];

describe("payout calculations", () => {
  it("returns zero below the first milestone", () => {
    expect(getTargetPayout(milestones, 999)).toBe(0);
  });

  it("uses only the highest milestone crossed", () => {
    expect(getTargetPayout(milestones, 10_000)).toBe(4_000);
  });

  it("requires only the difference from the previous payout", () => {
    expect(getIncrementalPayout(2_000, 500)).toBe(1_500);
  });

  it("does not allocate the same milestone payout twice", () => {
    expect(getIncrementalPayout(2_000, 2_000)).toBe(0);
  });
});

describe("campaign budget cap", () => {
  it("allows a payout that exactly uses the remaining budget", () => {
    expect(canAllocatePayout(2_000, 500, 1_500)).toBe(true);
  });

  it("blocks a payout that exceeds the remaining budget", () => {
    expect(canAllocatePayout(2_000, 500, 1_501)).toBe(false);
  });

  it("allows zero payout without changing budget", () => {
    expect(canAllocatePayout(2_000, 500, 0)).toBe(true);
  });

  it("rejects invalid budget inputs", () => {
    expect(canAllocatePayout(1_000, 1_001, 1)).toBe(false);
    expect(canAllocatePayout(1_000, 0, Number.NaN)).toBe(false);
  });
});
