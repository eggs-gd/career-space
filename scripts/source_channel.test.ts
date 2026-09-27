import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSource } from "./source_channel";

test("normalizeSource keeps a bare channel name and aliases dou -> douua", () => {
  assert.deepEqual(normalizeSource("djinni"), { source: "djinni", detail: null });
  assert.deepEqual(normalizeSource("  Workable "), { source: "workable", detail: null });
  assert.deepEqual(normalizeSource("dou"), { source: "douua", detail: null });
  assert.deepEqual(normalizeSource(""), { source: "", detail: null });
  assert.deepEqual(normalizeSource(undefined), { source: "", detail: null });
});

test("normalizeSource maps free text to a canonical channel and keeps the original as detail", () => {
  const cases: Array<[string, string]> = [
    ["LinkedIn Job Alert / Djinni", "linkedin"],
    ["linkedin/oracle-ciklum", "linkedin"],
    ["LinkedIn outreach -> applied via Van Kaizen -> recruiters X, Y (WhatsApp)", "recruiter"],
    ["Jack-n-Jill / Workable via Built In fallback", "jack-n-jill"],
    ["manual:web-fallback", "manual"],
    ["manual-url", "manual"],
    ["ad-hoc: gitlab careers browse", "manual"],
    ["direct recruiter", "recruiter"],
    ["a friend told me", "other"],
  ];
  for (const [raw, channel] of cases) {
    assert.deepEqual(normalizeSource(raw), { source: channel, detail: raw }, raw);
  }
});
