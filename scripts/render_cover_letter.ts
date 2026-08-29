#!/usr/bin/env node
/**
 * Plain .txt + styled HTML/PDF for a cover letter produced by playbooks/cover-letter.md.
 *
 * Why this exists specifically: some application forms have a file-upload field for the cover
 * letter instead of a text box, so chat text alone isn't enough -- the candidate needs an actual
 * file to attach. Three outputs cover every form shape: `.txt` for a plain-text upload field,
 * `.pdf` for one that wants a document, `.html` as a human-readable in-between (and the PDF's
 * own source). Thin CLI over rendering.ts -- see that module's docstring for why this stays
 * real code.
 *
 * Usage: node scripts/dist/render_cover_letter.js <input.md> [--title "Company — Role"]
 *
 * Writes <Full Name>_Cover_Letter[_<Company>].txt/.html (always), and the matching .pdf too
 * (via Puppeteer, unless the PDF step fails -- prints a note and leaves the other two, open the
 * HTML and print-to-PDF from a browser as a fallback) -- see rendering.coverLetterOutputStem for
 * exactly how the name/company are derived, not the source file's own name (identical across
 * every vacancy folder, a real pain to hand-rename before attaching one to an application).
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import * as rendering from "./rendering";

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      title: { type: "string" },
    },
  });

  const inputArg = positionals[0];
  if (!inputArg) {
    console.error("Usage: node scripts/dist/render_cover_letter.js <input.md> [--title ...]");
    process.exit(1);
  }
  const inputPath = path.resolve(inputArg);

  const draftText = fs.readFileSync(inputPath, "utf-8");
  const title = values.title || path.basename(inputPath, path.extname(inputPath));
  const stem = rendering.coverLetterOutputStem(inputPath);

  const txtPath = path.join(path.dirname(inputPath), `${stem}.txt`);
  rendering.writeTxt(draftText, txtPath);
  console.log(`Wrote ${txtPath}`);

  const html = rendering.renderCoverLetterHtml(draftText, title);
  const htmlPath = path.join(path.dirname(inputPath), `${stem}.html`);
  fs.writeFileSync(htmlPath, html, "utf-8");
  console.log(`Wrote ${htmlPath}`);

  const pdfPath = path.join(path.dirname(inputPath), `${stem}.pdf`);
  if (await rendering.writePdf(html, pdfPath)) {
    console.log(`Wrote ${pdfPath}`);
  }
}

if (require.main === module) {
  main();
}
