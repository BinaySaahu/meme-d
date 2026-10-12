import assert from "node:assert/strict";
import test from "node:test";
import { getIncrementalPayout, getTargetPayout } from "../utils/payout";

const milestones = [
  { views: 1_000, payout: 500 },
  { views: 5_000, payout: 2_000 },
  { views: 10_000, payout: 4_000 },
];

test("returns zero below the first milestone", () => {
  assert.equal(getTargetPayout(milestones, 999), 0);
});

test("selects only the highest milestone crossed in one update", () => {
  assert.equal(getTargetPayout(milestones, 10_000), 4_000);
});

test("calculates only the amount not already paid", () => {
  assert.equal(getIncrementalPayout(2_000, 500), 1_500);
});

test("does not allocate the same payout on a repeated update", () => {
  assert.equal(getIncrementalPayout(2_000, 2_000), 0);
});

test("does not allocate a payout when target is below the amount already paid", () => {
  assert.equal(getIncrementalPayout(500, 2_000), 0);
});
