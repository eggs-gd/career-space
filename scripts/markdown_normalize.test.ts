import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ensureCleanMarkdown,
  normalizeMarkdownStructure,
  applyAsciiTypographyToText,
} from "./markdown_normalize";

test("ensureCleanMarkdown strips a wrapping code fence", () => {
  assert.equal(ensureCleanMarkdown("```markdown\n# Hi\n```"), "# Hi");
  assert.equal(ensureCleanMarkdown("```\nplain\n```"), "plain");
  assert.equal(ensureCleanMarkdown("no fence here"), "no fence here");
});

test("normalizeMarkdownStructure adds blank lines around headings and lists", () => {
  // Note no blank line is inserted between the list and the trailing text: the per-line rules
  // only insert a blank line BEFORE a list/blockquote/heading, never after one.
  const input = "# Title\ntext right after\n- item one\n- item two\nmore text";
  const out = normalizeMarkdownStructure(input);
  assert.equal(out, "# Title\n\ntext right after\n\n- item one\n- item two\nmore text\n");
});

test("normalizeMarkdownStructure's final multi-blank collapse is NOT fence-aware", () => {
  // The final `\n{3,}` -> `\n\n` collapse runs on the whole joined string as a post-process step,
  // after the per-line fence-tracking loop -- so it collapses excess blank lines inside a fence
  // too. Deliberate, not a bug to "fix": a code fence with several blank lines in a row is rare
  // and cosmetic either way, and keeping this one pass unconditional is simpler than threading
  // fence-awareness through it as well.
  const input = "```js\nconst x=1\n\n\n\nconst y=2\n```";
  const out = normalizeMarkdownStructure(input);
  assert.equal(out, "```js\nconst x=1\n\nconst y=2\n```\n");
});

test("applyAsciiTypographyToText normalizes smart quotes/dashes/ellipsis", () => {
  const smartQuotes = String.fromCodePoint(0x201c) + "smart" + String.fromCodePoint(0x201d) +
    " and " + String.fromCodePoint(0x2018) + "quotes" + String.fromCodePoint(0x2019);
  assert.equal(applyAsciiTypographyToText(smartQuotes), "\"smart\" and 'quotes'");

  const dashes = "em" + String.fromCodePoint(0x2014) + "dash and en" + String.fromCodePoint(0x2013) + "dash";
  assert.equal(applyAsciiTypographyToText(dashes), "em - dash and en - dash");

  assert.equal(applyAsciiTypographyToText("ellipsis" + String.fromCodePoint(0x2026)), "ellipsis...");
});

test("applyAsciiTypographyToText normalizes nbsp/narrow-nbsp/soft-hyphen/minus by codepoint", () => {
  assert.equal(applyAsciiTypographyToText(`a${String.fromCodePoint(0x00a0)}b`), "a b");
  assert.equal(applyAsciiTypographyToText(`a${String.fromCodePoint(0x202f)}b`), "a b");
  assert.equal(applyAsciiTypographyToText(`soft${String.fromCodePoint(0x00ad)}hyphen`), "softhyphen");
  assert.equal(applyAsciiTypographyToText(`non${String.fromCodePoint(0x2011)}breaking`), "non-breaking");
  assert.equal(applyAsciiTypographyToText(`minus${String.fromCodePoint(0x2212)}sign`), "minus-sign");
});
