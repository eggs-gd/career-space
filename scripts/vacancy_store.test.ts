/**
 * Two kinds of coverage here, deliberately kept separate:
 *
 * - Against `scripts/fixtures/legacy-record.yaml` (synthetic, committed, always present) --
 *   a record can carry a microsecond-precision timestamp with an explicit `+00:00` offset (not
 *   every writer of `record.yaml` uses the same timestamp format), so this confirms that shape
 *   parses without throwing. Runs on every clone, including a clean OSS one with no `data/` at
 *   all.
 * - Against injected temp directories -- stateful write paths without touching real candidate
 *   data.
 * - Against the real `data/vacancies/` (gitignored, personal, only present on a maintainer's own
 *   machine) -- generic structural checks only, skipped entirely when `data/` doesn't exist.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as yaml from "js-yaml";
import {
  DATA_DIR,
  listVacancies,
  readVacancyContext,
  recordScoutOutcome,
  resolveVacancy,
  seenPath,
  vacancyDir,
} from "./vacancy_store";
import { REPO_ROOT } from "./repo_paths";

// Not `__dirname` -- at runtime that's `scripts/dist` (where this test itself compiles to), but
// the fixture lives in source (`scripts/fixtures/`), never copied into `dist/` by `tsc`.
const FIXTURE_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "legacy-record.yaml");

test("reads a microsecond-precision '+00:00'-offset timestamp record without throwing", () => {
  const record = yaml.load(fs.readFileSync(FIXTURE_PATH, "utf-8")) as Record<string, any>;
  assert.equal(record.slug, "acme-staff-engineer-a1b2c3d4");
  assert.equal(record.status, "new");
  assert.match(record.updated_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+00:00$/);
  // The actual point: parsing that exact timestamp shape as a JS Date must not throw/NaN --
  // this is what every timestamp-reading code path (rendering.ts's boardUpdatedShort, for one)
  // needs to survive against any record carrying this shape.
  const parsed = new Date(record.updated_at);
  assert.ok(!Number.isNaN(parsed.getTime()), `expected a parseable date, got ${record.updated_at}`);
});

test("listVacancies reads real on-disk data without throwing, when present", { skip: !fs.existsSync(DATA_DIR) }, () => {
  const all = listVacancies();
  assert.ok(Array.isArray(all));
  for (const v of all) {
    assert.equal(typeof v.slug, "string");
    assert.equal(typeof v.status, "string");
    // Same blanket timestamp-shape check as the synthetic fixture above, just against whatever
    // real records actually exist on this machine.
    if (v.updated_at) assert.match(v.updated_at, /^\d{4}-\d{2}-\d{2}T/);
  }
});

function tempVacanciesDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "career-space-vacancies-"));
}

function seenRows(root: string): Record<string, any>[] {
  const file = seenPath({ dataDir: root });
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf-8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, any>);
}

function candidate(id: string) {
  return {
    posting_id: `posting-${id}`,
    content_id: `content-${id}`,
    company: "Acme",
    title: `Platform Engineer ${id}`,
    job_post_text: `Platform Engineer ${id}\n\nBuild internal platform systems.`,
    url: `https://example.com/jobs/${id}`,
    source: "fixture",
    track_label: "technical",
  };
}

test("resolveVacancy creates a tracked vacancy and returns artifact flags from an injected data dir", () => {
  const root = tempVacanciesDir();
  const created = resolveVacancy({
    dataDir: root,
    company: "Acme",
    title: "Staff Engineer",
    postingText: "Staff Engineer\n\nBuild platform systems.",
    url: "https://example.com/jobs/staff",
    status: "tracked",
  });

  assert.equal(created.changed, true);
  assert.equal(created.context.record.status, "tracked");
  assert.equal(created.context.posting_text, "Staff Engineer\n\nBuild platform systems.");
  assert.equal(created.context.artifacts.posting, true);
  assert.equal(created.context.artifacts.targeting_plan, false);
  assert.ok(created.context.paths.record.startsWith(root));

  fs.writeFileSync(created.context.paths.targeting_plan, "# Targeting plan\n", "utf-8");
  const reread = readVacancyContext(created.context.slug, { dataDir: root });
  assert.equal(reread.artifacts.targeting_plan, true);

  const resolved = resolveVacancy({ dataDir: root, company: "Acme", title: "Staff Engineer" });
  assert.equal(resolved.changed, false);
  assert.equal(resolved.context.slug, created.context.slug);
});

test("recordScoutOutcome creates matched vacancies without duplicate seen rows", () => {
  const root = tempVacanciesDir();
  const result = recordScoutOutcome({
    dataDir: root,
    minFitScore: 4,
    candidate: candidate("matched"),
    fit: {
      score: 8,
      fit_category: "stretch_fit",
      reason: "Strong enough to track.",
      markdown: "## Match: 8/10\n",
      eligibility: { location: { status: "open_remote" } },
    },
  });

  assert.equal(result.outcome, "matched");
  assert.ok(result.slug);
  assert.equal(fs.existsSync(path.join(vacancyDir(result.slug!, { dataDir: root }), "fitment.md")), true);
  assert.equal(seenRows(root).length, 1);
  assert.equal(seenRows(root)[0]!.outcome, "matched");
});

test("recordScoutOutcome keeps rejected scout outcomes out of vacancy folders", () => {
  const root = tempVacanciesDir();
  const result = recordScoutOutcome({
    dataDir: root,
    minFitScore: 4,
    candidate: candidate("rejected"),
    fit: {
      score: 3,
      fit_category: "context_gap",
      reason: "Too thin.",
      markdown: "## Match: 3/10\n",
      eligibility: { location: { status: "open_remote" } },
    },
  });

  assert.equal(result.outcome, "rejected");
  assert.equal(result.slug, null);
  assert.equal(seenRows(root).length, 1);
  assert.deepEqual(
    fs.readdirSync(root).filter((entry) => entry !== "seen.jsonl"),
    []
  );
});

test("recordScoutOutcome applies deterministic match blockers and location exception rule", () => {
  const cases = [
    {
      id: "craft",
      fit: {
        score: 9,
        fit_category: "craft_mismatch",
        markdown: "## Match: 9/10\n",
        eligibility: { location: { status: "open_remote" as const } },
      },
      outcome: "rejected",
    },
    {
      id: "hard-location",
      fit: {
        score: 8,
        fit_category: "clean_fit",
        markdown: "## Match: 8/10\n",
        eligibility: { location: { status: "hard_location_block" as const } },
      },
      outcome: "rejected",
    },
    {
      id: "location-exception",
      fit: {
        score: 8,
        fit_category: "clean_fit",
        markdown: "## Match: 8/10\n",
        eligibility: { location: { status: "location_exception_candidate" as const } },
      },
      outcome: "matched",
    },
  ];

  for (const item of cases) {
    const root = tempVacanciesDir();
    const result = recordScoutOutcome({
      dataDir: root,
      minFitScore: 4,
      candidate: candidate(item.id),
      fit: item.fit,
    });
    assert.equal(result.outcome, item.outcome);
  }
});
