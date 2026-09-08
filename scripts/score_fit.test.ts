import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { roundHalfToEven, computeScore, evaluate, render, persistFitment } from "./score_fit";

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

test("computeScore caps at 5 when a non-blocking critical cluster has zero evidence, even with strong everything else", () => {
  const clusters = [
    {
      cluster: "Core stack",
      importance: "critical",
      blocking: false,
      requirements: [{ requirement: "writes Go daily", primary: true, evidence: "none" }],
    },
    { cluster: "Delivery", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
    { cluster: "Nice", importance: "important", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
    { cluster: "Bonus", importance: "nice_to_have", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
  ] as any;
  const uncapped = computeScore(clusters.slice(1)); // without the zeroed critical cluster
  assert.ok(uncapped > 5, `sanity: the rest alone should score above 5, got ${uncapped}`);
  const score = computeScore(clusters);
  assert.ok(score <= 5, `a critical cluster with no evidence must cap the score at 5, got ${score}`);
});

test("computeScore does NOT cap when the zero-evidence cluster is only important, not critical", () => {
  const clusters = [
    { cluster: "Nice-to-have gap", importance: "important", blocking: false, requirements: [{ primary: true, evidence: "none" }] },
    { cluster: "Core", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
    { cluster: "Core2", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
  ] as any;
  assert.ok(computeScore(clusters) > 5, "an important (not critical) zero cluster must not trigger the cap");
});

test("an `unclear` verdict caps the score at 7, even when the clusters would score higher", () => {
  const clusters = [
    { cluster: "A", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
    { cluster: "B", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
    { cluster: "C", importance: "important", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
  ] as any;
  assert.equal(computeScore(clusters), 10, "sanity: uncapped this is a 10");
  assert.equal(evaluate({ clusters, fit_category: "unclear" } as any).score, 7);
  assert.equal(evaluate({ clusters, fit_category: "scope_unclear" } as any).score, 7);
  // A thin posting can still land below the ceiling on its own merits.
  const thin = [{ cluster: "A", importance: "important", blocking: false, requirements: [{ primary: true, evidence: "transferable" }] }] as any;
  assert.ok(evaluate({ clusters: thin, fit_category: "unclear" } as any).score < 7);
});

test("a capped score overrides a positive fit_category so the label never contradicts the number", () => {
  const blocking = [
    { cluster: "Location", importance: "critical", blocking: true, requirements: [{ primary: true, evidence: "none" }] },
    { cluster: "Craft", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
  ] as any;
  const blocked = evaluate({ clusters: blocking, fit_category: "clean_fit" } as any);
  assert.ok(blocked.score <= 3);
  // Neutral gap label, never craft_mismatch -- a blocking cap is a location/skill gate, not a
  // discipline verdict (only the model itself says craft_mismatch).
  assert.equal(blocked.fit_category, "context_gap", "blocking cap + clean_fit -> context_gap");
  assert.match(blocked.markdown, /^## Match: \d\/10 — context gap/m);

  const criticalGap = [
    { cluster: "Core stack", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "none" }] },
    { cluster: "Delivery", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
    { cluster: "More", importance: "important", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
  ] as any;
  assert.equal(evaluate({ clusters: criticalGap, fit_category: "stretch_fit" } as any).fit_category, "context_gap");
  assert.equal(evaluate({ clusters: criticalGap, fit_category: "underreach" } as any).fit_category, "context_gap");
  // Engagement vocabulary reconciles within its own set.
  assert.equal(evaluate({ clusters: criticalGap, fit_category: "good_bet" } as any).fit_category, "thin_margin");
  assert.equal(evaluate({ clusters: blocking, fit_category: "good_bet" } as any).fit_category, "thin_margin");
  // craft_mismatch the model chose is left alone.
  assert.equal(evaluate({ clusters: blocking, fit_category: "craft_mismatch" } as any).fit_category, "craft_mismatch");
});

test("category reconciliation leaves an uncapped score's category untouched", () => {
  const clusters = [
    { cluster: "Lead", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "direct_partial" }] },
    { cluster: "Ship", importance: "important", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
  ] as any;
  const result = evaluate({ clusters, fit_category: "stretch_fit" } as any);
  assert.ok(result.score > 5, "sanity: not capped");
  assert.equal(result.fit_category, "stretch_fit");
  assert.equal(evaluate({ clusters, fit_category: "altitude_mismatch" } as any).fit_category, "altitude_mismatch");
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

test("persistFitment writes fitment.json (the input, replayable) and fitment.md (the render)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "career-space-persist-"));
  const assessment = {
    job_summary: "Build a thing.",
    clusters: [{ cluster: "Core", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "direct_partial" }] }],
    risk: "thin",
    appeal: "real",
    fit_category: "stretch_fit",
  };
  const { jsonPath, mdPath } = persistFitment(assessment as any, dir);
  assert.equal(jsonPath, path.join(dir, "fitment.json"));
  assert.equal(mdPath, path.join(dir, "fitment.md"));

  const reloaded = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  assert.deepEqual(reloaded, assessment, "fitment.json must round-trip the assessment verbatim");
  assert.equal(evaluate(reloaded).score, evaluate(assessment as any).score, "replaying the saved json gives the same score");
  assert.match(fs.readFileSync(mdPath, "utf-8"), /## Match: \d+\/10/);
});
