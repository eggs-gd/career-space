#!/usr/bin/env node
/**
 * Markdown -> HTML -> PDF, for a resume produced by playbooks/cv-universal.md or
 * playbooks/cv-targeted.md. Thin CLI over rendering.ts -- see that module's docstring for why
 * this stays real code, not something a playbook asks an agent to improvise. Rendering is
 * deterministic formatting: same input always produces the same styled output.
 *
 * Usage: node scripts/dist/render_resume.js <input.md> [--style default|compact|whitepaper]
 *
 * Writes <Full Name>_Resume[_<Role>].html next to the input (always) and the matching .pdf too
 * (via Puppeteer, unless the PDF step fails -- prints a note and leaves just the HTML, open it
 * and print-to-PDF from a browser as a fallback) -- see rendering.resumeOutputStem for exactly
 * how the name/role are derived, not the source file's own name (identical across every vacancy
 * folder, a real pain to hand-rename before attaching one to an application).
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import * as rendering from "./rendering";

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      style: { type: "string", default: "default" },
      title: { type: "string" },
    },
  });

  const inputArg = positionals[0];
  if (!inputArg) {
    console.error("Usage: node scripts/dist/render_resume.js <input.md> [--style default|compact|whitepaper] [--title ...]");
    process.exit(1);
  }
  const inputPath = path.resolve(inputArg);
  const style = values.style as rendering.ResumeStyle;
  if (!rendering.RESUME_STYLES.includes(style)) {
    console.error(`--style must be one of: ${rendering.RESUME_STYLES.join(", ")}`);
    process.exit(1);
  }

  const markdownText = fs.readFileSync(inputPath, "utf-8");
  const title = values.title || path.basename(inputPath, path.extname(inputPath));
  const html = rendering.renderHtml(markdownText, title, style);

  const stem = rendering.resumeOutputStem(inputPath);
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
