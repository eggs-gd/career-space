#!/usr/bin/env node
/**
 * Resolves one vacancy URL (not a search) into a candidate shaped exactly like a `scout_fetch`
 * candidate -- same `Posting.toDict()` fields plus `track_label` -- so `playbooks/add-from-url.md`
 * can hand it to `playbooks/fitment.md` + `playbooks/scout-record-outcomes.md` unchanged, the same
 * two steps a scout-found candidate already goes through. Does no judgment itself and writes
 * nothing.
 *
 * Delegates the actual fetch to `scout_sources.ts`'s `resolvePostingFromUrl` -- see that
 * function's own docstring for which URL shapes it recognizes and why. `matched: false` here
 * means the URL isn't from a source this repo can fetch precisely; the caller falls back to its
 * own fetch/read capability for that case.
 *
 * CLI: `node scripts/dist/resolve_vacancy_url.js <url> [--sources data/sources.yaml]` prints a
 * JSON object to stdout. Prefer the `resolve_vacancy_url` MCP tool when the server is connected.
 */

import * as path from "path";
import { parseArgs } from "util";
import * as vacancyStore from "./vacancy_store";
import { loadScoutConfig } from "./scout_domain";
import { classifyTrackMatch, trackMatchLabel } from "./scout_prefilter";
import { resolvePostingFromUrl } from "./scout_sources";
import { REPO_ROOT } from "./repo_paths";

const DEFAULT_SOURCES_PATH = path.join(REPO_ROOT, "data", "sources.yaml");

export async function resolveVacancyFromUrl(url: string, sourcesPath?: string): Promise<Record<string, unknown>> {
  const result = await resolvePostingFromUrl(url);
  if (!result.matched) return { matched: false };
  if (!result.posting) return { matched: true, error: result.error };
  const posting = result.posting;

  const [seenPostingIds, seenContentIds] = vacancyStore.readSeenIds();
  const alreadySeen = seenPostingIds.has(posting.postingId()) || seenContentIds.has(posting.contentId());

  // `data/sources.yaml` might not exist yet (scouting never set up) -- track_label is purely
  // informational here (never gates anything the way it does in the scout's own prefilter), so a
  // missing/unloadable config just means "no opinion," not an error.
  let trackLabel: string | null = null;
  try {
    const config = loadScoutConfig(sourcesPath ?? DEFAULT_SOURCES_PATH);
    const [matchedTrack] = classifyTrackMatch(posting, config);
    trackLabel = trackMatchLabel(matchedTrack);
  } catch {
    trackLabel = null;
  }

  const candidate = posting.toDict();
  candidate.track_label = trackLabel;
  return { matched: true, already_seen: alreadySeen, candidate };
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { sources: { type: "string" } },
  });
  const url = positionals[0];
  if (!url) {
    console.error("Usage: node scripts/dist/resolve_vacancy_url.js <url> [--sources data/sources.yaml]");
    process.exit(1);
  }
  const result = await resolveVacancyFromUrl(url, values.sources ? path.resolve(values.sources) : undefined);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main();
}
