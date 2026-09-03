#!/usr/bin/env node
/**
 * Deterministic fit score + rendering. The score is a fixed weighted formula over requirement
 * clusters -- each cluster's evidence level (direct_strong/direct_partial/transferable/none)
 * scored against its importance tier (critical/important/nice_to_have), with a hard cap when a
 * real blocking requirement has zero evidence. See `computeScore` below for the exact weights.
 * The rendering is Markdown (headers, bold, horizontal rules), because this repo's output is
 * read in a chat client that renders Markdown -- grouped by evidence state (Major gaps / Minor
 * gaps / Transferable / Strong overlap, then risk/appeal).
 *
 * Real code, not something a playbook should try to eyeball in a chat response -- weighted
 * averages and threshold rounding are exactly the class of deterministic step that must not
 * depend on a model getting arithmetic right by feel, and a hand-computed score would drift
 * attempt to attempt in a way that defeats the point of "private, blunt, honest" fitment. See
 * playbooks/fitment.md for how this is used: the agent does the actual judgment (extracting
 * requirement clusters and judging evidence for each), writes it as JSON, and this script turns
 * that judgment into the scored, formatted result.
 *
 * Usage: node scripts/dist/score_fit.js <input.json>
 *
 * Input JSON shape:
 * {
 *   "job_summary": "...",
 *   "clusters": [
 *     {
 *       "cluster": "short name for this requirement cluster",
 *       "importance": "critical" | "important" | "nice_to_have",
 *       "blocking": false,
 *       "requirements": [
 *         {"requirement": "...", "primary": true, "evidence": "direct_strong" | "direct_partial" |
 *          "transferable" | "none", "quote": "..." | null, "reason": "..."}
 *       ]
 *     }
 *   ],
 *   "risk": "one honest sentence, or empty string",
 *   "appeal": "one honest sentence, or empty string",
 *   "fit_category": "clean_fit" | "stretch_fit" | "underreach" | "craft_mismatch" |
 *                    "altitude_mismatch" | "context_gap" | "unclear",
 *   "eligibility": {
 *     "location": {
 *       "status": "open_remote" | "local" | "location_exception_candidate" |
 *                 "hard_location_block" | "unclear",
 *       "reason": "one sentence, optional"
 *     }
 *   }
 * }
 *
 * Exactly one requirement per cluster should have "primary": true -- if zero or more than one
 * do, this script deterministically falls back to the first requirement in the array, rather
 * than guessing which one was "meant".
 */

import * as fs from "fs";
import { Eligibility, normalizeEligibility } from "./eligibility";

interface Requirement {
  requirement?: string;
  primary?: boolean;
  evidence?: string;
  quote?: string | null;
  reason?: string;
}

interface Cluster {
  cluster?: string;
  importance?: string;
  blocking?: boolean;
  requirements?: Requirement[];
}

export interface Assessment {
  job_summary?: string;
  clusters?: Cluster[];
  risk?: string;
  appeal?: string;
  fit_category?: string;
  eligibility?: Eligibility;
}

export interface FitResult {
  score: number;
  fit_category: string;
  eligibility?: Eligibility;
  markdown: string;
}

const EVIDENCE_VALUE: Record<string, number> = {
  direct_strong: 1.0,
  direct_partial: 0.7,
  transferable: 0.5,
  none: 0.0,
};
const TIER_WEIGHT: Record<string, number> = { critical: 0.6, important: 0.3, nice_to_have: 0.1 };
const SECONDARY_EVIDENCE_DISCOUNT = 0.7;
const BLOCKING_SCORE_CAP = 3;
const NO_EXTRACTION_FALLBACK_SCORE = 5;

const STATE_ORDER = ["major_gap", "minor_gap", "transferable", "strong"] as const;
type ClusterState = (typeof STATE_ORDER)[number];

// (short header label, one-line explanation) -- kept separate so render() can put the short form
// in a bold headline and the explanation as a subtitle, instead of one long run-on line.
const FIT_CATEGORY_LABELS: Record<string, [string, string]> = {
  clean_fit: ["clean fit", "requirements and evidence line up cleanly"],
  stretch_fit: ["stretch fit", "worth trying, gaps need honest framing"],
  underreach: ["underreach", "you may be aiming lower than your evidence supports"],
  craft_mismatch: ["craft mismatch", "different discipline, not just a different level"],
  altitude_mismatch: ["altitude mismatch", "right discipline, wrong level of responsibility"],
  context_gap: ["context gap", "missing domain/stack evidence this posting wants"],
  unclear: ["unclear", "not enough to classify confidently"],
};

// One header per group -- plain text, no emoji-as-color-coding (a chat Markdown renderer already
// makes "###" visually distinct; emoji piled on every line would fight for attention with the
// warning/checkmark risk/appeal callouts at the end, which are the two lines actually worth
// flagging visually).
const STATE_HEADERS: Record<ClusterState, string> = {
  major_gap: "### Major gaps",
  minor_gap: "### Minor gaps",
  transferable: "### Transferable / partial overlap",
  strong: "### Strong overlap",
};

const LOCATION_ELIGIBILITY_LABELS: Record<string, string> = {
  open_remote: "open remote",
  local: "local",
  location_exception_candidate: "requires location exception",
  hard_location_block: "hard location block",
  unclear: "unclear",
};

/** Round-half-to-even (banker's rounding), not `Math.round`'s half-up tie-breaking -- at an
 * exact `.5` boundary, `roundHalfToEven(2.5) === 2`, not 3. Deliberate: half-up rounding biases
 * every exact-`.5` score upward, half-to-even doesn't. See score_fit.test.ts for the boundary
 * case. */
export function roundHalfToEven(x: number): number {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

/** `Math.max(...values)` returns `-Infinity` for an empty array with no way to supply a
 * default, unlike Python's `max(iterable, default=...)`. Explicit helper so the empty-secondary-
 * requirements case (a cluster with only one requirement) produces `0.0`, not `-Infinity`. */
function maxOrDefault(values: number[], fallback: number): number {
  return values.length === 0 ? fallback : Math.max(...values);
}

function clusterPrimary(cluster: Cluster): Requirement {
  const reqs = cluster.requirements ?? [];
  const primaries = reqs.filter((r) => r.primary);
  if (primaries.length === 1) return primaries[0]!;
  return reqs[0]!;
}

function clusterEvidenceScore(cluster: Cluster): number {
  const reqs = cluster.requirements ?? [];
  if (reqs.length === 0) return 0.0;
  const primary = clusterPrimary(cluster);
  const secondary = reqs.filter((r) => r !== primary);
  const primaryValue = EVIDENCE_VALUE[primary.evidence ?? ""] ?? 0.0;
  const secondaryValue =
    maxOrDefault(
      secondary.map((r) => EVIDENCE_VALUE[r.evidence ?? ""] ?? 0.0),
      0.0
    ) * SECONDARY_EVIDENCE_DISCOUNT;
  return Math.max(primaryValue, secondaryValue);
}

function clusterState(cluster: Cluster): ClusterState {
  const primary = clusterPrimary(cluster);
  const evidence = primary.evidence;
  if (evidence === "direct_strong") return "strong";
  if (evidence === "direct_partial" || evidence === "transferable") return "transferable";
  if (cluster.blocking || cluster.importance === "critical") return "major_gap";
  return "minor_gap";
}

export function computeScore(clusters: Cluster[]): number {
  const clusterScores = clusters.map(clusterEvidenceScore);
  const tierIndices: Record<string, number[]> = {};
  for (const tier of Object.keys(TIER_WEIGHT)) tierIndices[tier] = [];
  clusters.forEach((cluster, idx) => {
    const importance = cluster.importance;
    if (importance !== undefined && importance in tierIndices) {
      tierIndices[importance]!.push(idx);
    }
  });

  const presentTiers = Object.entries(TIER_WEIGHT).filter(([tier]) => tierIndices[tier]!.length > 0);
  if (presentTiers.length === 0) return NO_EXTRACTION_FALLBACK_SCORE;

  const totalWeight = presentTiers.reduce((sum, [, weight]) => sum + weight, 0);
  let score01 = 0.0;
  for (const [tier, weight] of presentTiers) {
    const indices = tierIndices[tier]!;
    const share = weight / totalWeight;
    const n = indices.length;
    for (const i of indices) {
      score01 += share * (clusterScores[i]! / n);
    }
  }

  let score = Math.max(1, Math.min(10, roundHalfToEven(1 + score01 * 9)));

  // Hard gate: a real blocker (hard location block, mandatory language, clearance, or a
  // technology that IS the role's literal subject) with zero evidence on its own primary
  // requirement caps the score outright, regardless of how the weighted average came out.
  if (clusters.some((cluster) => cluster.blocking && clusterPrimary(cluster).evidence === "none")) {
    score = Math.min(score, BLOCKING_SCORE_CAP);
  }

  return score;
}

/** Markdown output -- this repo's output is read in a chat client that renders it (Claude
 * Code, Cursor, ...), so headers/bold/rules are free readability, not decoration. A wall of
 * undifferentiated dash-bullets was a real, reported readability problem here, not a
 * hypothetical one -- this is the fix. */
export function render(assessment: Assessment): string {
  const result = evaluate(assessment);
  return result.markdown;
}

export function evaluate(assessment: Assessment): FitResult {
  const clusters = assessment.clusters ?? [];
  const score = computeScore(clusters);
  const category = assessment.fit_category ?? "unclear";
  const [shortLabel, explanation] = FIT_CATEGORY_LABELS[category] ?? [category, ""];
  const eligibility = normalizeEligibility(assessment.eligibility);

  const lines: string[] = [`## Match: ${score}/10 — ${shortLabel}`];
  if (explanation) lines.push(`*${explanation}*`);
  const jobSummary = (assessment.job_summary ?? "").trim();
  if (jobSummary) {
    lines.push("");
    lines.push(jobSummary);
  }
  const locationEligibility = eligibility?.location;
  if (locationEligibility) {
    lines.push("");
    const label = LOCATION_ELIGIBILITY_LABELS[locationEligibility.status] ?? locationEligibility.status;
    const reason = locationEligibility.reason ? ` — ${locationEligibility.reason}` : "";
    lines.push(`**Location eligibility:** ${label}${reason}`);
  }
  lines.push("");
  lines.push("---");

  const grouped: Record<ClusterState, Cluster[]> = { major_gap: [], minor_gap: [], transferable: [], strong: [] };
  for (const cluster of clusters) {
    grouped[clusterState(cluster)].push(cluster);
  }

  for (const state of STATE_ORDER) {
    const items = grouped[state];
    if (items.length === 0) continue;
    lines.push("");
    lines.push(STATE_HEADERS[state]);
    for (const cluster of items) {
      const primary = clusterPrimary(cluster);
      let prefix: string;
      if (cluster.blocking) {
        prefix = "**blocking** — ";
      } else if (cluster.importance === "critical") {
        prefix = "**critical requirement** — ";
      } else if (cluster.importance === "nice_to_have") {
        prefix = "nice-to-have — ";
      } else {
        prefix = "";
      }
      const headline = primary.reason || cluster.cluster || "";
      lines.push(`- ${prefix}${headline}`);
    }
  }

  const risk = (assessment.risk ?? "").trim();
  const appeal = (assessment.appeal ?? "").trim();
  if (risk || appeal) {
    lines.push("");
    lines.push("---");
  }
  if (risk) {
    lines.push("");
    lines.push(`⚠️ **Risk:** ${risk}`);
  }
  if (appeal) {
    lines.push("");
    lines.push(`✅ **Appeal:** ${appeal}`);
  }

  return {
    score,
    fit_category: category,
    eligibility,
    markdown: lines.join("\n"),
  };
}

function main(): void {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/dist/score_fit.js <input.json>");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8")) as Assessment;
  console.log(render(data));
}

if (require.main === module) {
  main();
}
