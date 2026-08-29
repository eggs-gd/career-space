/**
 * Markdown post-processing: structural normalization + ASCII typography cleanup.
 *
 * Faithful port of the same-named functions in the retired scripts/build-cv.js (by way of the
 * later Python port, scripts/markdown_normalize.py -- this restores the original language).
 * Pure string/regex logic, no external dependencies -- safe to unit test anywhere, including
 * sandboxes with no network/package access.
 */

const FENCE_START_RE = /^\s{0,3}```/;
const ATX_HEADING_RE = /^\s{0,3}#{1,6}\s+/;
const BULLET_RE = /^(\s{0,7})([-*+])\s+/;
const BLOCKQUOTE_RE = /^\s{0,3}>\s?/;
const THEMATIC_BREAK_RE = /^\s{0,3}(\*{3,}|-{3,}|_{3,})\s*$/;

const CODE_FENCE_STRIP_RE = /^```(?:md|markdown)?\s*/i;
const TRAILING_FENCE_RE = /\n```$/;
const DASH_RE = /\s*[–—]\s*/g; // en dash / em dash
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

/** Insert blank lines around headings/lists/blockquotes so renderers agree on structure.
 *
 * Direct port of `normalizeMarkdownStructure` in the retired build-cv.js -- same line-by-line
 * state machine and rules. */
export function normalizeMarkdownStructure(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const nextLine = i + 1 < lines.length ? lines[i + 1]! : null;

    if (isFenceStart(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    const prevOut = out.length > 0 ? out[out.length - 1]! : null;

    if (isAtxHeading(line)) {
      if (prevOut !== null && !isBlank(prevOut)) {
        out.push("");
      }
      out.push(line);

      if (
        nextLine !== null &&
        !isBlank(nextLine) &&
        !isAtxHeading(nextLine) &&
        !isFenceStart(nextLine) &&
        !isThematicBreak(nextLine)
      ) {
        out.push("");
      }

      continue;
    }

    // Ensure lists/blockquotes start after a blank line when preceded by non-blank text.
    if (prevOut !== null && !isBlank(prevOut)) {
      if (isBullet(line) && !isAtxHeading(prevOut) && !isBullet(prevOut)) {
        out.push("");
      }
      if (isBlockquote(line) && !isAtxHeading(prevOut) && !isBlockquote(prevOut)) {
        out.push("");
      }
    }

    if ((isBullet(line) || isBlockquote(line)) && out.length > 0) {
      const last = out[out.length - 1]!;
      if (isAtxHeading(last)) {
        out.push("");
      }
    }

    out.push(line);
  }

  let joined = out.join("\n");
  joined = joined.replace(MULTI_BLANK_RE, "\n\n").trim();
  return `${joined}\n`;
}

/** Normalize punctuation that often comes from LLM output (smart quotes, dashes, nbsp...). */
export function applyAsciiTypographyToText(text: string): string {
  let result = text;
  result = result.replace(/­/g, ""); // soft hyphen
  result = result.replace(/‑/g, "-"); // non-breaking hyphen
  result = result.replace(DASH_RE, " - "); // en dash / em dash -> always spaced hyphen
  result = result.replace(/−/g, "-"); // minus sign
  result = result.replace(/ /g, " "); // nbsp
  result = result.replace(/ /g, " "); // narrow nbsp
  result = result.replace(/…/g, "...");
  result = result.replace(/“/g, '"');
  result = result.replace(/”/g, '"');
  result = result.replace(/‘/g, "'");
  result = result.replace(/’/g, "'");
  return result;
}

export function normalizeAsciiTypographyOutsideFences(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
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
