import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as yaml from "js-yaml";
import { rescore } from "./rescore";

function seed(): { base: string; slug: string; recordPath: string } {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "career-space-rescore-"));
  const slug = "acme-backend-eng-11112222";
  const dir = path.join(base, "vacancies", slug);
  fs.mkdirSync(dir, { recursive: true });

  // A `critical` cluster with zero evidence -> the current formula caps at 5. The stored score is
  // a stale 8 (as if judged before the cap existed).
  const assessment = {
    job_summary: "Backend role.",
    clusters: [
      { cluster: "Core stack", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "none" }] },
      { cluster: "Delivery", importance: "critical", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
      { cluster: "Bonus", importance: "important", blocking: false, requirements: [{ primary: true, evidence: "direct_strong" }] },
    ],
    fit_category: "context_gap",
  };
  fs.writeFileSync(path.join(dir, "fitment.json"), JSON.stringify(assessment, null, 2));
  fs.writeFileSync(path.join(dir, "fitment.md"), "## Match: 8/10 — stale\n");
  const recordPath = path.join(dir, "record.yaml");
  fs.writeFileSync(recordPath, yaml.dump({ slug, status: "tracked", fit: { score: 8, category: "context_gap", reason: "keep me" } }));

  // A second folder with a record but no fitment.json -> not replayable.
  const other = path.join(base, "vacancies", "no-json-33334444");
  fs.mkdirSync(other, { recursive: true });
  fs.writeFileSync(path.join(other, "record.yaml"), yaml.dump({ slug: "no-json-33334444", fit: { score: 7 } }));

  return { base, slug, recordPath };
}

test("rescore dry run reports which records moved and which aren't replayable, writes nothing", () => {
  const { base, slug, recordPath } = seed();
  const result = rescore({ dataDir: base });

  assert.equal(result.written, false);
  assert.equal(result.replayable, 1);
  assert.equal(result.changed.length, 1);
  assert.equal(result.changed[0]!.slug, slug);
  assert.equal(result.changed[0]!.old_score, 8);
  assert.ok(result.changed[0]!.new_score <= 5, `expected the critical-gap cap to lower it, got ${result.changed[0]!.new_score}`);
  assert.deepEqual(result.skipped.map((s) => path.basename(s)), ["no-json-33334444"]);

  const record = yaml.load(fs.readFileSync(recordPath, "utf-8")) as any;
  assert.equal(record.fit.score, 8, "dry run must not touch record.yaml");
});

test("rescore --write updates fit.score/category, keeps fit.reason, rewrites fitment.md", () => {
  const { base, slug } = seed();
  const result = rescore({ write: true, dataDir: base });
  assert.equal(result.written, true);

  const dir = path.join(base, "vacancies", slug);
  const record = yaml.load(fs.readFileSync(path.join(dir, "record.yaml"), "utf-8")) as any;
  assert.ok(record.fit.score <= 5);
  assert.equal(record.fit.reason, "keep me", "the agent's prose reason is preserved");
  assert.match(fs.readFileSync(path.join(dir, "fitment.md"), "utf-8"), /## Match: [1-5]\/10/);

  // Idempotent: a second write finds nothing changed.
  assert.equal(rescore({ write: true, dataDir: base }).changed.length, 0);
});
