#!/usr/bin/env node
/**
 * Renders `data/engagements/` as a static HTML dashboard -- the engagement sibling of
 * `render_board.ts`. Grouped by status, sorted by fit, with clickable links to every file in each
 * order's folder. No server: open the written file directly. Deterministic formatting over
 * `engagement_store.listEngagements()` -- not something a playbook should hand-summarize into a table.
 *
 * Also writes a flat `data/engagements.md` twin (one table, no embedded text) for handing an order
 * list to another agent.
 *
 * Usage: node scripts/dist/render_engagement.js [--output data/engagements.html] [--include-archived]
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import * as rendering from "./rendering";
import { listEngagements } from "./engagement_store";
import { REPO_ROOT } from "./repo_paths";

const DEFAULT_OUTPUT_PATH = path.join(REPO_ROOT, "data", "engagements.html");

export function renderEngagements(outputPath?: string, includeArchived = false): { htmlPath: string; mdPath: string } {
  const orders = listEngagements({ includeArchived });
  const html = rendering.renderEngagementsHtml(orders);
  const md = rendering.renderEngagementsMd(orders);
  const htmlPath = outputPath ?? DEFAULT_OUTPUT_PATH;
  const mdPath = htmlPath.replace(/\.html?$/i, "") + ".md";
  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, html, "utf-8");
  fs.writeFileSync(mdPath, md, "utf-8");
  return { htmlPath, mdPath };
}

function main(): void {
  const { values } = parseArgs({ options: { output: { type: "string" }, "include-archived": { type: "boolean" } } });
  const { htmlPath, mdPath } = renderEngagements(values.output ? path.resolve(values.output) : undefined, values["include-archived"]);
  console.log(`Wrote ${htmlPath} and ${mdPath}`);
}

if (require.main === module) {
  main();
}
