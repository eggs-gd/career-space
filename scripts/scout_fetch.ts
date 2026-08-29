#!/usr/bin/env node
/**
 * Deterministic fetch -> prefilter -> dedup -> not-already-seen step of the scout. Produces a
 * short list of candidate postings worth the agent's own fitment judgment; does no judgment
 * itself and writes nothing -- `playbooks/scout.md` is what calls this, judges each candidate
 * the same way a pasted posting is judged (`playbooks/fitment.md` + `score_fit.ts`), and then
 * records the outcome via `vacancy_store`'s functions (`markSeen` always, `upsertVacancy` only
 * for a posting worth tracking).
 *
 * CLI: `node scripts/dist/scout_fetch.js [--sources data/sources.yaml]` prints a JSON object to
 * stdout. Prefer the `scout_fetch` MCP tool when the server is connected -- same function, typed
 * return, no shell-escaping a JSON blob.
 */

import * as path from "path";
import { parseArgs } from "util";
import * as vacancyStore from "./vacancy_store";
import { ScoutConfigError, loadScoutConfig } from "./scout_domain";
import { classifyTrackMatch, collapseDuplicates, filterPostings, trackMatchLabel } from "./scout_prefilter";
import { fetchAll } from "./scout_sources";
import { REPO_ROOT } from "./repo_paths";

const DEFAULT_SOURCES_PATH = path.join(REPO_ROOT, "data", "sources.yaml");

export async function runScout(sourcesPath?: string): Promise<Record<string, unknown>> {
  const config = loadScoutConfig(sourcesPath ?? DEFAULT_SOURCES_PATH);

  const [postings, fetchErrors] = await fetchAll({
    companies: [...config.companies],
    feeds: [...config.feeds],
    trackTitles: config.allTrackTitles(),
    roleSignals: [...config.roleSignals],
  });

  const survivors = filterPostings(postings, config);

  // Collapse same-role-different-URL reposts into one representative before the seen-log check
  // -- see collapseDuplicates's docstring. Must happen first: within one run, every country
  // copy of a repost is "new" by posting_id alone, so without this collapse each copy would
  // count separately against the considered/max_judgments accounting below too.
  const deduped = collapseDuplicates(survivors);
  const collapsedCount = survivors.length - deduped.length;

  const [seenPostingIds, seenContentIds] = vacancyStore.readSeenIds();
  const unseen = deduped.filter((p) => !seenPostingIds.has(p.postingId()) && !seenContentIds.has(p.contentId()));

  // Hard ceiling on how many candidates one call hands back -- see ScoutConfig.
  // maxJudgmentsPerRun's docstring. Arbitrary (fetch) order, not priority-ordered: postedAt is a
  // raw per-source string, never parsed into a real date. Anything past the cap simply isn't
  // returned, so it's never marked seen either -- it's picked up (and re-counted) on a later run
  // rather than being lost.
  const toJudge = unseen.slice(0, config.maxJudgmentsPerRun);
  const cappedCount = unseen.length - toJudge.length;

  const candidates = toJudge.map((posting) => {
    const candidate = posting.toDict();
    const [matchedTrack] = classifyTrackMatch(posting, config);
    // Which of the candidate's own tracks (data/sources.yaml's `tracks:`) this posting matched
    // on title -- null when it only cleared the prefilter via the role_signals-only recall lane
    // (no track title matched at all). Worth keeping on the record: it's cheap to compute here
    // (classifyTrackMatch already ran once inside the prefilter step above; this is a second,
    // identical call, not a second judgment).
    candidate.track_label = trackMatchLabel(matchedTrack);
    return candidate;
  });

  return {
    candidates,
    fetched_count: postings.length,
    survived_prefilter_count: survivors.length,
    collapsed_count: collapsedCount,
    considered_count: unseen.length,
    returned_count: toJudge.length,
    capped_count: cappedCount,
    fetch_errors: fetchErrors,
  };
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { sources: { type: "string" } } });
  let result: Record<string, unknown>;
  try {
    result = await runScout(values.sources ? path.resolve(values.sources) : undefined);
  } catch (error) {
    if (error instanceof ScoutConfigError) {
      console.error(`error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main();
}
