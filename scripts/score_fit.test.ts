import { test } from "node:test";
import assert from "node:assert/strict";
import { roundHalfToEven, computeScore } from "./score_fit";

test("roundHalfToEven uses banker's rounding at exact .5 boundaries, unlike Math.round", () => {
  assert.equal(roundHalfToEven(2.5), 2, "2.5 rounds to even (2), not up to 3");
  assert.equal(roundHalfToEven(3.5), 4, "3.5 rounds to even (4)");
  assert.equal(roundHalfToEven(0.5), 0);
  assert.equal(roundHalfToEven(1.5), 2);
  assert.equal(roundHalfToEven(-0.5), 0, "floor(-0.5) = -1, diff = 0.5, -1 is odd -> rounds to 0");
  // Non-tie cases must behave like ordinary rounding.
  assert.equal(roundHalfToEven(2.4), 2);
  assert.equal(roundHalfToEven(2.6), 3);
});

test("computeScore falls back to 5 when no cluster has a recognized importance tier", () => {
  assert.equal(computeScore([]), 5);
  assert.equal(computeScore([{ cluster: "x", importance: "unrecognized" }] as any), 5);
});

test("computeScore applies the blocking cap regardless of the weighted average", () => {
  const clusters = [
    {
      cluster: "Location",
      importance: "critical",
      blocking: true,
      requirements: [{ requirement: "on-site NYC", primary: true, evidence: "none", reason: "remote only" }],
    },
  ] as any;
  const score = computeScore(clusters);
  assert.ok(score <= 3, `blocking cluster with no evidence must cap the score at 3, got ${score}`);
});
