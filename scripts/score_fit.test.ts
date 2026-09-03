import { test } from "node:test";
import assert from "node:assert/strict";
import { roundHalfToEven, computeScore, evaluate, render } from "./score_fit";

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

test("location exception renders as eligibility, not as a score penalty", () => {
  const assessment = {
    job_summary: "Architecture-heavy engineering role.",
    clusters: [
      {
        cluster: "Architecture",
        importance: "critical",
        blocking: false,
        requirements: [{ requirement: "architecture", primary: true, evidence: "direct_strong", reason: "Strong architecture overlap." }],
      },
    ],
    risk: "The remote scope may need an exception.",
    appeal: "The content fit is strong.",
    fit_category: "clean_fit",
    eligibility: {
      location: {
        status: "location_exception_candidate",
        reason: "Remote scope lists nearby markets but no hard legal blocker.",
      },
    },
  } as const;

  assert.equal(computeScore(assessment.clusters as any), 10);
  const markdown = render(assessment as any);
  assert.match(markdown, /^## Match: 10\/10 — clean fit/m);
  assert.match(markdown, /Location eligibility:\*\* requires location exception/);
});

test("evaluate returns structured score data with rendered Markdown", () => {
  const assessment = {
    job_summary: "Engineering leadership role.",
    clusters: [
      {
        cluster: "Leadership",
        importance: "critical",
        blocking: false,
        requirements: [{ requirement: "lead teams", primary: true, evidence: "direct_partial", reason: "Some leadership overlap." }],
      },
    ],
    fit_category: "stretch_fit",
  };

  const result = evaluate(assessment as any);
  assert.equal(result.score, computeScore(assessment.clusters as any));
  assert.equal(result.fit_category, "stretch_fit");
  assert.match(result.markdown, /^## Match: \d+\/10 — stretch fit/m);
});
