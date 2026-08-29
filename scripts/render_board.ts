#!/usr/bin/env node
/**
 * Renders the current state of `data/vacancies/` as one static HTML dashboard -- grouped by
 * status, sorted by fit score, with a real clickable link to every file present in each
 * vacancy's folder (fitment, posting, CV, cover letter, targeting plan) plus the original
 * posting URL. No server: open the written file directly in a browser. Deterministic formatting
 * over `vacancy_store.listVacancies()`'s own data -- not something a playbook should
 * hand-summarize into a table itself (that means re-reading every record.yaml to do the same
 * thing this already does in one call, and produces plain text, not something with real
 * clickable links to the rest of what's in each vacancy's folder).
 *
 * Usage: node scripts/dist/render_board.js [--output data/board.html]
 *
 * Writes `data/board.html` by default -- right next to `data/vacancies/`, so its links to
 * `vacancies/<slug>/<file>` resolve without any path juggling.
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import * as rendering from "./rendering";
import * as vacancyStore from "./vacancy_store";
import { REPO_ROOT } from "./repo_paths";

const DEFAULT_OUTPUT_PATH = path.join(REPO_ROOT, "data", "board.html");

export function renderBoard(outputPath?: string): string {
  const vacancies = vacancyStore.listVacancies();
  const html = rendering.renderBoardHtml(vacancies);
  const resolvedOutput = outputPath ?? DEFAULT_OUTPUT_PATH;
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  fs.writeFileSync(resolvedOutput, html, "utf-8");
  return resolvedOutput;
}

function main(): void {
  const { values } = parseArgs({ options: { output: { type: "string" } } });
  const outPath = renderBoard(values.output ? path.resolve(values.output) : undefined);
  console.log(`Wrote ${outPath}`);
}

if (require.main === module) {
  main();
}
