#!/usr/bin/env node
/**
 * Generates ready-to-click LinkedIn Boolean search links -- feed posts, the job board, and
 * people search -- from `data/sources.yaml`'s `tracks`. Writes `data/linkedin-searches.md`.
 *
 * Two kinds of role hide on LinkedIn and never reach a public ATS/board feed: a founder's plain
 * "we're hiring" feed post, and a job-board listing a company only ever posts to LinkedIn
 * itself. This does NOT fetch or scrape LinkedIn -- doing that at any volume is against its
 * terms and gets accounts banned. It only builds deep-link URLs into LinkedIn's own search; a
 * human opens them in their own logged-in browser, one click, human pace. If you point a browser
 * assistant at these links, keep it to reading/triage only -- never let it connect, message, or
 * apply on your behalf.
 *
 * Usage: node scripts/dist/linkedin_searches.js [--sources data/sources.yaml] [--output PATH]
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import { ScoutConfig, ScoutConfigError, loadScoutConfig, TrackConfig } from "./scout_domain";
import { REPO_ROOT } from "./repo_paths";

const DEFAULT_SOURCES_PATH = path.join(REPO_ROOT, "data", "sources.yaml");
const DEFAULT_OUTPUT_PATH = path.join(REPO_ROOT, "data", "linkedin-searches.md");

// A bare "hiring" keyword tolerates a long title OR-list fine. A quoted multi-word intent phrase
// ("we're hiring") combined with that same long list sometimes silently returns 0 results on
// LinkedIn's content search. The fix is a shorter title list for those two intents specifically;
// SHORT_TITLE_LIMIT picks the shortest N titles per track automatically rather than requiring a
// hand-maintained second list.
const INTENT_WORDS = ["hiring", '"looking for"', '"we\'re hiring"'];
const SHORT_TITLE_LIMIT = 5;

/** RFC3986 percent-encoding with `/` left unescaped -- what LinkedIn's own search URLs expect --
 * NOT `encodeURIComponent` alone and NOT `URLSearchParams` (which encodes spaces as `+`, a
 * different convention entirely). `encodeURIComponent` also leaves `!*'()` unescaped (an older
 * RFC2396 exemption RFC3986 doesn't share) and escapes `/` (which needs to stay literal here) --
 * both corrected below. Equivalent to Python's `urllib.parse.quote(text, safe='/')`, if you want
 * a reference implementation to check this against. */
function rfc3986Quote(text: string): string {
  return encodeURIComponent(text)
    .replace(/%2F/g, "/")
    .replace(/[!*'()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function urlencode(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${rfc3986Quote(key)}=${rfc3986Quote(value)}`)
    .join("&");
}

function orGroup(phrases: readonly string[]): string {
  const parts = phrases.map((p) => (p.includes(" ") ? `"${p}"` : p));
  return "(" + parts.join(" OR ") + ")";
}

/** LinkedIn's feed/post search. NOTE: `datePosted`/`sortBy` aren't honoured via deep-link (they
 * silently no-op) -- only keywords travel in the URL; "Past week" + "Latest" is one click in the
 * UI's own filter bar after opening the link. */
function contentUrl(query: string): string {
  return "https://www.linkedin.com/search/results/content/?" + urlencode({ keywords: query });
}

/** Finds the hiring managers/founders themselves -- the warm-intro path. Deliberately takes a
 * `hiringTitles`-built query, never a track's own job-search `titles` -- searching by the track's
 * own titles finds peers/competitors for that role (other Engineering Managers), not the people
 * who hire for it (VP Engineering, Director of Engineering, CTO). */
function peopleUrl(query: string): string {
  return "https://www.linkedin.com/search/results/people/?" + urlencode({ keywords: query });
}

/** The LinkedIn job BOARD (not the feed) -- unlike content search, this one honours filter
 * params in the URL: f_TPR=r604800 = past 7 days, f_WT=2 = remote. */
function jobsUrl(query: string, remote = true, pastWeek = true): string {
  const params: Record<string, string> = { keywords: query };
  if (pastWeek) params.f_TPR = "r604800";
  if (remote) params.f_WT = "2";
  params.sortBy = "DD"; // date, newest first
  return "https://www.linkedin.com/jobs/search/?" + urlencode(params);
}

export function buildMarkdown(config: ScoutConfig): string {
  const lines: string[] = [
    "# LinkedIn search links",
    "",
    "Deep-links into LinkedIn's own search, built from `data/sources.yaml`'s `tracks` --",
    "nothing here fetches or scrapes anything. Open these yourself in your own logged-in",
    "browser, at your own pace; regenerate with `node scripts/dist/linkedin_searches.js`",
    "(or the `linkedin_searches` MCP tool) whenever the tracks change.",
    "",
  ];
  let anyTrack = false;
  let anyMissingHiringTitles = false;
  for (const track of config.tracks.values() as IterableIterator<TrackConfig>) {
    if (track.titles.length === 0) continue;
    anyTrack = true;
    const titles = [...track.titles];
    const shortTitles = [...titles].sort((a, b) => a.length - b.length).slice(0, SHORT_TITLE_LIMIT);
    const titlesGrp = orGroup(titles);
    const shortGrp = orGroup(shortTitles);

    lines.push(`## ${track.label}`);
    lines.push("");
    lines.push(`**Titles:** \`${titlesGrp}\``);
    lines.push(`- **Jobs board** (remote, past week): ${jobsUrl(titlesGrp)}`);
    for (const word of INTENT_WORDS) {
      const grp = word === "hiring" ? titlesGrp : shortGrp;
      const label = word.replace(/^"|"$/g, ""); // word itself carries the quotes the query
      // needs; the label shouldn't double them up ("intent ""looking for""" reads badly)
      lines.push(`- Feed posts — intent "${label}": ${contentUrl(`${grp} ${word}`)}`);
    }
    // Omitted, not falling back to `titles`, when `hiringTitles` isn't configured -- see
    // `peopleUrl`'s own docstring for why that fallback was the bug in the first place.
    if (track.hiringTitles.length > 0) {
      const hiringGrp = orGroup([...track.hiringTitles]);
      lines.push(`- People (find the hiring managers to reach out to): ${peopleUrl(hiringGrp)}`);
    } else {
      anyMissingHiringTitles = true;
    }
    lines.push("");
  }

  if (!anyTrack) {
    lines.push("_No track in `data/sources.yaml` has any titles configured -- nothing to build._");
    lines.push("");
  }

  lines.push("---");
  if (anyMissingHiringTitles) {
    lines.push(
      "_One or more tracks above have no People-search link -- add `hiring_titles:` to that " +
        "track in `data/sources.yaml` (who actually hires for this role -- e.g. an Engineering " +
        "Manager track's hiring titles are VP Engineering/Director of Engineering/CTO, never " +
        '"Engineering Manager" itself) and regenerate. Deliberately not falling back to the ' +
        "track's own job-search titles for this -- that would search for peers, not hirers._"
    );
    lines.push("");
  }
  lines.push(
    '_Tip: LinkedIn search supports OR and "quotes" -- edit a link\'s `keywords` param by ' +
      "hand to add `NOT intern` or similar and trim noise. If a feed-posts link for a track " +
      "with many titles comes back empty, that's the long-list-plus-quoted-intent limitation " +
      "noted above -- try the Jobs board link instead, or trim that track's titles in " +
      "`data/sources.yaml`._"
  );
  return lines.join("\n") + "\n";
}

export function generate(sourcesPath?: string, outputPath?: string): string {
  const config = loadScoutConfig(sourcesPath ?? DEFAULT_SOURCES_PATH);
  const resolvedOutput = outputPath ?? DEFAULT_OUTPUT_PATH;
  fs.writeFileSync(resolvedOutput, buildMarkdown(config), "utf-8");
  return resolvedOutput;
}

function main(): void {
  const { values } = parseArgs({ options: { sources: { type: "string" }, output: { type: "string" } } });
  try {
    const outPath = generate(
      values.sources ? path.resolve(values.sources) : undefined,
      values.output ? path.resolve(values.output) : undefined
    );
    console.log(`Wrote ${outPath}`);
  } catch (error) {
    if (error instanceof ScoutConfigError) {
      console.error(`error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  main();
}
