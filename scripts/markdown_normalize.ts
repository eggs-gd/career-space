/**
 * Markdown post-processing: structural normalization + ASCII typography cleanup.
 *
 * Pure string/regex logic, no external dependencies -- safe to unit test anywhere, including
 * sandboxes with no network/package access.
 */

import { replaceDashes } from "./text_utils";

const FENCE_START_RE = /^\s{0,3}```/;
const ATX_HEADING_RE = /^\s{0,3}#{1,6}\s+/;
const BULLET_RE = /^(\s{0,7})([-*+])\s+/;
const BLOCKQUOTE_RE = /^\s{0,3}>\s?/;
const THEMATIC_BREAK_RE = /^\s{0,3}(\*{3,}|-{3,}|_{3,})\s*$/;

const CODE_FENCE_STRIP_RE = /^```(?:md|markdown)?\s*/i;
const TRAILING_FENCE_RE = /\n```$/;
const MULTI_BLANK_RE = /\n{3,}/g;

/** Strip a stray leading/trailing code fence some models wrap answers in. */
export function ensureCleanMarkdown(raw: string): string {
  let text = raw.replace(CODE_FENCE_STRIP_RE, "");
  text = text.replace(TRAILING_FENCE_RE, "");
  return text.trim();
}

function isBlank(line: string): boolean {
  return line.trim().length === 0;
}
function isFenceStart(line: string): boolean {
  return FENCE_START_RE.test(line);
}
function isAtxHeading(line: string): boolean {
  return ATX_HEADING_RE.test(line);
}
function isBullet(line: string): boolean {
  return BULLET_RE.test(line);
}
function isBlockquote(line: string): boolean {
  return BLOCKQUOTE_RE.test(line);
}
function isThematicBreak(line: string): boolean {
  return THEMATIC_BREAK_RE.test(line);
}

function pushHeading(out: string[], line: string, prevOut: string | null, nextLine: string | null): void {
  if (prevOut !== null && !isBlank(prevOut)) out.push("");
  out.push(line);
  if (needsBlankAfterHeading(nextLine)) out.push("");
}

function needsBlankAfterHeading(nextLine: string | null): boolean {
  return nextLine !== null && !isBlank(nextLine) && !isAtxHeading(nextLine) && !isFenceStart(nextLine) && !isThematicBreak(nextLine);
}

function needsBlankBeforeListOrQuote(line: string, prevOut: string | null): boolean {
  if (prevOut === null || isBlank(prevOut)) return false;
  if (isBullet(line)) return !isBullet(prevOut);
  if (isBlockquote(line)) return !isBlockquote(prevOut);
  return false;
}

/** Insert blank lines around headings/lists/blockquotes so renderers agree on structure --
 * a line-by-line state machine tracking fence/heading/list context as it goes. */
export function normalizeMarkdownStructure(markdown: string): string {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const out: string[] = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const nextLine = i + 1 < lines.length ? lines[i + 1]! : null;

    const fence = isFenceStart(line);
    if (fence) inFence = !inFence;
    if (fence || inFence) {
      out.push(line);
      continue;
    }

    const prevOut = out.at(-1) ?? null;
    if (isAtxHeading(line)) {
      pushHeading(out, line, prevOut, nextLine);
    } else {
      // Lists/blockquotes start after a blank line when preceded by non-blank text of another kind.
      if (needsBlankBeforeListOrQuote(line, prevOut)) out.push("");
      out.push(line);
    }
  }

  let joined = out.join("\n");
  joined = joined.replace(MULTI_BLANK_RE, "\n\n").trim();
  return `${joined}\n`;
}

/** Normalize punctuation that often comes from LLM output (smart quotes, dashes, nbsp...). */
export function applyAsciiTypographyToText(text: string): string {
  let result = text;
  result = result.replaceAll("\u00ad", ""); // soft hyphen
  result = result.replaceAll("\u2011", "-"); // non-breaking hyphen
  result = replaceDashes(result, " - "); // en dash / em dash -> always spaced hyphen
  result = result.replaceAll("\u2212", "-"); // minus sign
  result = result.replaceAll("\u00a0", " "); // nbsp
  result = result.replaceAll("\u202f", " "); // narrow nbsp
  result = result.replaceAll("…", "...");
  result = result.replaceAll("“", '"');
  result = result.replaceAll("”", '"');
  result = result.replaceAll("‘", "'");
  result = result.replaceAll("’", "'");
  return result;
}

export function normalizeAsciiTypographyOutsideFences(markdown: string): string {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const out: string[] = [];
  let inFence = false;

  for (const line of lines) {
    if (isFenceStart(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    out.push(inFence ? line : applyAsciiTypographyToText(line));
  }

  return out.join("\n") + "\n";
}

/** Structure normalization always applies; ASCII typography unless CV_MD_ASCII=0. */
export function formatCvMarkdown(markdown: string): string {
  const asciiOn = process.env.CV_MD_ASCII !== "0";
  const normalizedStructure = normalizeMarkdownStructure(markdown);
  return asciiOn ? normalizeAsciiTypographyOutsideFences(normalizedStructure) : normalizedStructure;
}
