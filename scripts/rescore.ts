#!/usr/bin/env node
/**
 * Re-applies `score_fit`'s formula to every saved `fitment.json` under `data/vacancies/` and
 * `data/engagements/`, without re-running the model. Use after a scoring-formula change (a new cap,
 * a tier reweight): the agent's judgement (clusters / evidence levels) is preserved in
 * `fitment.json`, only the arithmetic changes.
 *
 * Dry run by default -- prints `<root>/<slug>: old/10 -> new/10 [old-cat -> new-cat]` for every
 * record whose score or category moved, and lists folders with a `record.yaml` but no
 * `fitment.json` (not replayable -- re-run `fitment.md` / `engagement-fitment.md` for those once
 * to make them replayable in future).
 *
 * With `--write`: updates `record.yaml`'s `fit.score` / `fit.category` (`fit.reason`, the agent's
 * prose, is kept), rewrites `fitment.md` from the same assessment, and re-renders the board.
 *
 * Usage: node scripts/dist/rescore.js [--write] [--data-dir <dir>]
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { parseArgs } from "util";
import { REPO_ROOT } from "./repo_paths";
import { Assessment, evaluate, persistFitment } from "./score_fit";
import { renderBoards } from "./render_boards";

export interface RescoreRow {
  root: string;
  slug: string;
  old_score: number | null;
  new_score: number;
  old_category: string | null;
  new_category: string;
  changed: boolean;
}

export interface RescoreResult {
  written: boolean;
  replayable: number;
  changed: RescoreRow[];
  skipped: string[];
}

function scanRoot(dir: string, write: boolean, rows: RescoreRow[], skipped: string[]): void {
  if (!fs.existsSync(dir)) return;
  const rootName = path.basename(dir);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const folder = path.join(dir, entry.name);
    const recordPath = path.join(folder, "record.yaml");
    if (!fs.existsSync(recordPath)) continue;
    const jsonPath = path.join(folder, "fitment.json");
    if (!fs.existsSync(jsonPath)) {
      skipped.push(path.relative(REPO_ROOT, folder));
      continue;
    }
    const assessment = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as Assessment;
    const result = evaluate(assessment);
    const record = (yaml.load(fs.readFileSync(recordPath, "utf-8")) ?? {}) as Record<string, any>;
    const fit = record.fit ?? {};
    const oldScore = fit.score ?? null;
    const oldCategory = fit.category ?? null;
    const changed = oldScore !== result.score || oldCategory !== result.fit_category;
    rows.push({
      root: rootName,
      slug: entry.name,
      old_score: oldScore,
      new_score: result.score,
      old_category: oldCategory,
      new_category: result.fit_category,
      changed,
    });
    if (write && changed) {
      record.fit = { ...fit, score: result.score, category: result.fit_category };
      record.updated_at = new Date().toISOString();
      fs.writeFileSync(recordPath, yaml.dump(record, { lineWidth: 100, sortKeys: false }), "utf-8");
      persistFitment(assessment, folder);
    }
  }
}

export function rescore(opts: { write?: boolean; dataDir?: string } = {}): RescoreResult {
  const write = opts.write ?? false;
  const base = opts.dataDir ?? path.join(REPO_ROOT, "data");
  const rows: RescoreRow[] = [];
  const skipped: string[] = [];
  scanRoot(path.join(base, "vacancies"), write, rows, skipped);
  scanRoot(path.join(base, "engagements"), write, rows, skipped);
  const changed = rows.filter((r) => r.changed);
  if (write && changed.length && !opts.dataDir) {
    renderBoards();
  }
  return { written: write, replayable: rows.length, changed, skipped };
}

function main(): void {
  const { values } = parseArgs({ options: { write: { type: "boolean" }, "data-dir": { type: "string" } } });
  const result = rescore({ write: values.write, dataDir: values["data-dir"] ? path.resolve(values["data-dir"]) : undefined });

  console.log(
    `${result.replayable} replayable record(s); ${result.changed.length} changed` +
      (result.written ? " (written)" : " (dry run -- pass --write to apply)")
  );
  for (const r of result.changed) {
    const cat = r.old_category !== r.new_category ? `  [${r.old_category ?? "-"} -> ${r.new_category}]` : "";
    console.log(`  ${r.root}/${r.slug}: ${r.old_score ?? "-"}/10 -> ${r.new_score}/10${cat}`);
  }
  if (result.skipped.length) {
    console.log(`\n${result.skipped.length} folder(s) without fitment.json (re-run fitment to make replayable):`);
    for (const s of result.skipped) console.log(`  ${s}`);
  }
  if (result.written && result.changed.length) console.log("\nBoards re-rendered.");
}

if (require.main === module) {
  main();
}
