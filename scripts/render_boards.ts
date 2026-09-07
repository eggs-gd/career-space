#!/usr/bin/env node
/**
 * Renders the board (`render_board.ts` + `render_engagement.ts`), no options. Every auto-render
 * path calls this. `render_board.js` / `render_engagement.js` take `--output` / `--include-archived`.
 *
 * Usage: node scripts/dist/render_boards.js
 */

import { renderBoard } from "./render_board";
import { renderEngagements } from "./render_engagement";

export interface BoardPaths {
  html: string;
  md: string;
}

export function renderBoards(): { vacancies: BoardPaths; engagements: BoardPaths } {
  const v = renderBoard();
  const e = renderEngagements();
  return {
    vacancies: { html: v.htmlPath, md: v.mdPath },
    engagements: { html: e.htmlPath, md: e.mdPath },
  };
}

function main(): void {
  const { vacancies, engagements } = renderBoards();
  console.log(`Wrote ${vacancies.html}, ${vacancies.md}, ${engagements.html}, ${engagements.md}`);
}

if (require.main === module) {
  main();
}
