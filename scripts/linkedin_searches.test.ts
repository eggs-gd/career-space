/**
 * Covers the People-search fix specifically: a track's job-search `titles` must never leak into
 * the People-search query (that was the bug -- searching for peers instead of hiring managers),
 * and a track with no `hiring_titles` configured gets no People link at all, not a wrong one.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMarkdown } from "./linkedin_searches";
import { ScoutConfig, TrackConfig } from "./scout_domain";

function configWithTracks(tracks: Record<string, TrackConfig>): ScoutConfig {
  return new ScoutConfig({
    tracks: new Map(Object.entries(tracks)),
    titleExclude: [],
    hardExclude: [],
    companies: [],
    feeds: [],
  });
}

test("People-search link uses hiringTitles, never the track's own job-search titles", () => {
  const config = configWithTracks({
    em: {
      label: "Engineering Manager",
      kind: "primary",
      titles: ["engineering manager"],
      hiringTitles: ["vp engineering", "director of engineering", "cto"],
      uaCategories: [],
    },
  });
  const md = buildMarkdown(config);
  const peopleLine = md.split("\n").find((line) => line.startsWith("- People"));
  assert.ok(peopleLine, "expected a People-search line for a track with hiringTitles set");
  assert.ok(peopleLine!.includes("vp%20engineering") || peopleLine!.includes("vp+engineering") || peopleLine!.includes("VP"), "sanity: line should reference the hiring titles somehow");
  // The actual bug check: the track's own job-search title must not appear in the People URL's
  // query string.
  assert.ok(
    !peopleLine!.toLowerCase().includes("engineering%20manager"),
    `People-search link must not search for the track's own title (peers, not hirers): ${peopleLine}`
  );
});

test("no People-search link when hiringTitles isn't configured -- omitted, not a wrong fallback", () => {
  const config = configWithTracks({
    em: {
      label: "Engineering Manager",
      kind: "primary",
      titles: ["engineering manager"],
      hiringTitles: [],
      uaCategories: [],
    },
  });
  const md = buildMarkdown(config);
  const peopleLine = md.split("\n").find((line) => line.startsWith("- People"));
  assert.equal(peopleLine, undefined, "must not fall back to job-search titles for the People link");
  assert.ok(md.includes("hiring_titles:"), "should explain how to fix it, once, at the bottom");
});
