import { test } from "node:test";
import assert from "node:assert/strict";
import { compareText, oneLine, replaceDashes, trimChar, trimEndChar } from "./text_utils";

/** Deterministic pseudo-random strings over a small alphabet that holds every character the
 * replaced regexes treat specially, so the new helpers are compared with the old expressions. */
function samples(alphabet: string[], count = 3000, maxLength = 14): string[] {
  let seed = 12345;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  const out = ["", ...alphabet];
  for (let i = 0; i < count; i += 1) {
    const length = next() % (maxLength + 1);
    let text = "";
    for (let j = 0; j < length; j += 1) text += alphabet[next() % alphabet.length];
    out.push(text);
  }
  return out;
}

test("compareText orders like the default sort", () => {
  const words = ["b", "B", "a", "ä", "10", "9", "", "é", "e", "Z"];
  assert.deepEqual([...words].sort(compareText), [...words].sort());
  assert.equal(compareText("a", "a"), 0);
});

test("trimChar and trimEndChar equal the regexes they replace", () => {
  for (const text of samples(["_", "a", "-", " "])) {
    assert.equal(trimChar(text, "_"), text.replace(/^_+|_+$/g, ""), JSON.stringify(text));
    assert.equal(trimChar(text, "-"), text.replace(/^-+|-+$/g, ""), JSON.stringify(text));
    assert.equal(trimEndChar(text, "-"), text.replace(/-+$/, ""), JSON.stringify(text));
  }
  assert.equal(trimChar("____", "_"), "");
  assert.equal(trimEndChar("/", "/"), "");
});

test("oneLine equals the newline regex followed by trim", () => {
  for (const text of samples(["a", " ", "\n", "\r", "\t", "|", "b"])) {
    const expected = text.replace(/\s*\n\s*/g, " ").trim();
    assert.equal(oneLine(text), expected, JSON.stringify(text));
  }
  assert.equal(oneLine("a \n\n  b"), "a b");
  assert.equal(oneLine("  a  b  "), "a  b");
});

test("replaceDashes equals the dash regex it replaces", () => {
  for (const text of samples(["a", " ", "\n", "–", "—", "-", "b"])) {
    assert.equal(replaceDashes(text, " - "), text.replace(/\s*[–—]\s*/g, " - "), JSON.stringify(text));
  }
  assert.equal(replaceDashes("em—dash and en – dash", " - "), "em - dash and en - dash");
});

test("the helpers stay linear on long inputs", () => {
  const long = " ".repeat(200_000);
  const started = Date.now();
  replaceDashes(long + "a", " - ");
  oneLine(long + "\n" + long);
  trimChar("_".repeat(200_000) + "x" + "_".repeat(200_000), "_");
  assert.ok(Date.now() - started < 1000, "a quadratic helper would take far longer");
});
