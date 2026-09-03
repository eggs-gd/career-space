#!/usr/bin/env node
/**
 * Renders the current state of `data/vacancies/` as a static HTML dashboard -- grouped by
 * status, sorted by fit score, with a real clickable link to every file present in each
 * vacancy's folder (fitment, posting, CV, cover letter, targeting plan) plus the original
 * posting URL. No server: open the written file directly in a browser. Deterministic formatting
 * over `vacancy_store.listVacancies()`'s own data -- not something a playbook should
 * hand-summarize into a table itself (that means re-reading every record.yaml to do the same
 * thing this already does in one call, and produces plain text, not something with real
 * clickable links to the rest of what's in each vacancy's folder).
 *
 * Also writes a flat `board.md` twin next to it -- one table (status/fit/company/title/updated/
 * slug/url), no embedded document text -- for handing to another agent to reconcile statuses
 * against emails/correspondence.
 *
 * Usage: node scripts/dist/render_board.js [--output data/board.html] [--include-archived]
 *
 * Writes `data/board.html` (and `data/board.md`) by default -- right next to `data/vacancies/`,
 * so the HTML's links to `vacancies/<slug>/<file>` resolve without any path juggling.
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import * as rendering from "./rendering";
import * as vacancyStore from "./vacancy_store";
import { loadScoutConfig } from "./scout_domain";
import { REPO_ROOT } from "./repo_paths";

const DEFAULT_OUTPUT_PATH = path.join(REPO_ROOT, "data", "board.html");
const SOURCES_PATH = path.join(REPO_ROOT, "data", "sources.yaml");

/** `local_keywords` from `data/sources.yaml`, for highlighting local vacancies on the board --
 * see `rendering.renderBoardHtml`'s `localKeywords` option. `[]` (no highlighting, not an error)
 * when scouting hasn't been set up yet or the candidate never configured `local_keywords`; the
 * board is useful without either, so this is never a reason to fail the render. */
function loadLocalKeywords(): string[] {
  if (!fs.existsSync(SOURCES_PATH)) return [];
  try {
    return [...loadScoutConfig(SOURCES_PATH).localKeywords];
  } catch {
    return [];
  }
}

/** `includeArchived` defaults to false, matching `vacancyStore.listVacancies`'s own default --
 * an archived vacancy (see `vacancy_store.setArchived`) stays off the board unless explicitly
 * asked for. Writes both `board.html` and its flat `board.md` twin; `mdPath` is `htmlPath` with
 * a `.md` extension (so `--output foo.html` also writes `foo.md`). */
export function renderBoard(outputPath?: string, includeArchived = false): { htmlPath: string; mdPath: string } {
  const vacancies = vacancyStore.listVacancies(undefined, { includeArchived });
  const html = rendering.renderBoardHtml(vacancies, { localKeywords: loadLocalKeywords() });
  const md = rendering.renderBoardMd(vacancies);
  const htmlPath = outputPath ?? DEFAULT_OUTPUT_PATH;
  const mdPath = htmlPath.replace(/\.html?$/i, "") + ".md";
  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, html, "utf-8");
  fs.writeFileSync(mdPath, md, "utf-8");
  return { htmlPath, mdPath };
}

function main(): void {
  const { values } = parseArgs({ options: { output: { type: "string" }, "include-archived": { type: "boolean" } } });
  const { htmlPath, mdPath } = renderBoard(values.output ? path.resolve(values.output) : undefined, values["include-archived"]);
  console.log(`Wrote ${htmlPath} and ${mdPath}`);
}

if (require.main === module) {
  main();
}
