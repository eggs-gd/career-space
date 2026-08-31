/**
 * Cheap, deliberately minimal pre-filter -- runs before the agent's own fitment judgment, not
 * instead of it. Every check here is a plain substring/word-boundary test, no scoring, no
 * weights: its only job is cutting obvious noise before spending a judgment turn on it. Real fit
 * assessment stays the agent's job (`playbooks/fitment.md` + `score_fit.ts`'s formula) -- this
 * filter only decides whether a posting is even worth reading that closely.
 */

import { TRACK_KIND_FALLBACK, Posting, ScoutConfig, TrackConfig } from "./scout_domain";

// Punctuation-to-space normalizer for wordBoundaryMatch below: a short bare token ("rag", "mcp",
// "sdr") checked with plain space-padding alone would still fail to match right before a period,
// comma, or parenthesis ("...entirely Golang.", "(SDR)") since real job-listing text ends a word
// that way at least as often as with a trailing space. Letters stay contiguous (this only ever
// inserts spaces, never removes characters), so it can't introduce a new false match the way
// stripping punctuation outright could. `\p{L}\p{N}_` (Unicode letters/digits/underscore, `u`
// flag) matches Python's `\w` on a `str` pattern, which is Unicode-aware by default -- plain
// ASCII `\w` in JS would treat any accented character as punctuation.
const PUNCTUATION_PATTERN = /[^\p{L}\p{N}_\s]/gu;

// Collapses a run of whitespace (including a line break inside a longer description) to one
// space, applied after punctuation normalization -- a multi-word phrase ("security clearance")
// would otherwise fail to match if the source text happens to wrap or double-space between the
// two words, which stripped-HTML job descriptions do often enough to matter.
const WHITESPACE_PATTERN = /\s+/g;

/** True if any of `phrases` appears in `haystack` as a complete, space-bounded unit -- never a
 * plain substring containment test, which lets a short phrase match inside an unrelated word
 * (bare "sdr" matching inside "absurdity") or an unrelated number range (bare "0 to 1" matching
 * inside "10 to 15 engineers", a real collision this exact fix already closed for
 * role_signals/strategic_signals before this function existed as a shared helper). Punctuation
 * is normalized to spaces and whitespace runs are collapsed first, so a phrase still matches
 * across a sentence-ending period, a parenthetical, or an odd line wrap in the source text. */
function wordBoundaryMatch(haystack: string, phrases: readonly string[]): boolean {
  const normalized = ` ${haystack} `
    .toLowerCase()
    .replace(PUNCTUATION_PATTERN, " ")
    .replace(WHITESPACE_PATTERN, " ");
  return phrases.some((phrase) => normalized.includes(` ${phrase} `));
}

// Checked against the FULL combined title+location+description text, not just Posting.remote --
// a fetcher decides `remote` from the location field first and only falls back to the
// description when location is empty, so a posting with location="London, UK" and "fully
// remote, work from anywhere" buried in the description would otherwise read as on-site.
// Re-checking the combined text here, independent of Posting.remote, closes that gap.
//
// Deliberately does NOT include "distributed" -- that word shows up constantly in plain
// engineering-architecture phrasing ("distributed systems", "distributed squads") on postings
// that are strictly on-site, so against a multi-thousand-char description it's too generic to be
// a reliable location signal.
//
// Also NOT a bare "anywhere" -- a real, observed bug from a live scout run: an on-site London
// role (location field said so) passed this gate anyway because its description said "sell
// anywhere" (product marketing copy, about the product's reach, nothing to do with where the
// candidate can be based). `"work anywhere"`/`"from anywhere"` still catch the genuine phrasing
// this whole check exists for (the "work from anywhere" example right above) without matching
// that shape of false positive. Keep in sync with `scout_sources.ts`'s `REMOTE_WORDS` -- same
// false-positive risk, checked independently by each.
const REMOTE_SIGNAL_WORDS = ["remote", "work anywhere", "from anywhere", "work from home", "wfh"];

// A bare "hybrid" mention with no remote language elsewhere is treated as a reject, not a soft
// pass -- "hybrid" alone is at least as likely to mean a specific non-local city (no value to a
// candidate who isn't there) as it is to mean "hybrid, but remote candidates considered." The
// second case is already caught by REMOTE_SIGNAL_WORDS above regardless of whether "hybrid"
// appears at all, so a separate hybrid-only pass lane would only add false positives.

/** Plain (non-word-boundary) substring match against `localKeywords` -- the candidate's own
 * city/country phrases, checked case-insensitively against whatever text is passed in. Shared by
 * `passesLocationGate` below (against the full title+location+description text, at fetch time)
 * and `render_board.ts` (against a tracked vacancy's stored `location` + `posting.md`, to decide
 * whether to highlight it -- see `rendering.ts`'s `renderBoardHtml`). Deliberately NOT
 * `wordBoundaryMatch`: a city name is specific enough on its own that requiring exact word
 * boundaries would only risk false negatives (a location field's own punctuation/formatting
 * varies more than a job title's does), not false positives worth guarding against. */
export function matchesLocalKeywords(text: string, localKeywords: readonly string[]): boolean {
  if (localKeywords.length === 0) return false;
  const textL = text.toLowerCase();
  return localKeywords.some((phrase) => textL.includes(phrase));
}

/** Cheap, deterministic remote/location check -- runs before the agent ever reads a posting
 * that's strictly on-site somewhere the candidate isn't. No-op (passes everything) when
 * `localKeywords` isn't configured, since "local" can't be judged without knowing what that
 * means for this candidate.
 *
 * Binary: fully remote (`Posting.remote` OR a remote word anywhere in title/location/
 * description) or explicitly local passes outright. Everything else -- including a bare
 * "hybrid" mention with no remote language -- gets rejected here, before spending a judgment
 * turn to find out. */
function passesLocationGate(posting: Posting, config: ScoutConfig): boolean {
  if (config.localKeywords.length === 0) return true;
  const combinedL = `${posting.title} ${posting.location} ${posting.description}`.toLowerCase();
  if (posting.remote || REMOTE_SIGNAL_WORDS.some((word) => combinedL.includes(word))) return true;
  if (matchesLocalKeywords(combinedL, config.localKeywords)) return true;
  return false;
}

/** A short acronym like "rag" checked with a plain containment test would match inside ordinary
 * words ("sto*rag*e", "p*rag*matism"), letting generic postings pass a fallback track's gate off
 * a false hit rather than a genuine RAG mention -- see `wordBoundaryMatch`. */
function strategicSignalMatch(posting: Posting, config: ScoutConfig): boolean {
  return wordBoundaryMatch(`${posting.title} ${posting.description}`, config.strategicSignals);
}

/** A bare "0 to 1" checked with a plain containment test would collide with unrelated number
 * ranges ("10 to 15 engineers" contains "0 to 1" as a substring) -- see `wordBoundaryMatch`. */
function roleSignalMatch(posting: Posting, config: ScoutConfig): boolean {
  return wordBoundaryMatch(`${posting.title} ${posting.description}`, config.roleSignals);
}

/** Returns [matchedTrack, strategicSignalMatched] -- the two independent facts
 * `passesPrefilter`'s step 4 (see its own docstring) is built from. Split out so a caller can
 * compute the same gate outcome the filter used, without re-deriving it differently. */
export function classifyTrackMatch(posting: Posting, config: ScoutConfig): [TrackConfig | null, boolean] {
  const titleL = posting.title.toLowerCase();
  return [config.matchingTrack(titleL), strategicSignalMatch(posting, config)];
}

/** Human-facing tag for a match -- just the matched track's own configured `label`, or null
 * when nothing to show (the posting only cleared step 4 via the role_signals-only recall lane,
 * which isn't tied to any one named track). */
export function trackMatchLabel(matchedTrack: TrackConfig | null): string | null {
  return matchedTrack !== null ? matchedTrack.label : null;
}

/** True if `posting` is worth spending a judgment turn on. All checks are cheap substring
 * tests -- no regex weighting, no scoring, just obvious-noise removal:
 *
 * 1. Title doesn't contain a hard title_exclude phrase (e.g. "intern", "support engineer") as a
 *    complete word/phrase (see `wordBoundaryMatch` -- a short exclude token like "sdr" needs
 *    this, or it would match inside an unrelated word).
 * 2. Title+description doesn't contain a hard_exclude phrase (e.g. "security clearance", "must
 *    be a citizen of X") -- description-level, since these rarely show up in a title.
 * 3. Location gate (see `passesLocationGate`): remote or local -- otherwise rejected.
 * 4. Track/strategic-signal rule:
 *    - Title matches a `primary`-kind track -> passes outright. A strategicSignals match is
 *      extra color, never required.
 *    - Title matches a `fallback`-kind track -> passes ONLY alongside a strategicSignals match.
 *      A bare fallback-title match with no signal is a downgrade the candidate doesn't want a
 *      judgment turn spent on.
 *    - Title matches no track at all -> falls back to the role_signals-only recall lane: passes
 *      if the text matches a roleSignals phrase, for roles whose titles don't use any of the
 *      candidate's classic track phrases. Deliberately does NOT accept a bare strategicSignals
 *      hit here -- a tech/domain buzzword proves the JD mentions a technology, not that the role
 *      has any leadership/architecture shape (a "Jr Software Engineer" needing LLM API
 *      familiarity is not a leadership role just because it mentions LLMs). No-op (passes) only
 *      when neither `tracks` nor `roleSignals` is configured at all. */
export function passesPrefilter(posting: Posting, config: ScoutConfig): boolean {
  if (wordBoundaryMatch(posting.title, config.titleExclude)) return false;

  if (wordBoundaryMatch(`${posting.title} ${posting.description}`, config.hardExclude)) return false;

  if (!passesLocationGate(posting, config)) return false;

  const [matchedTrack, strategicMatch] = classifyTrackMatch(posting, config);
  if (matchedTrack !== null) {
    if (matchedTrack.kind === TRACK_KIND_FALLBACK && !strategicMatch) return false;
    return true;
  }

  if ((config.tracks.size > 0 || config.roleSignals.length > 0) && !roleSignalMatch(posting, config)) {
    return false;
  }

  return true;
}

export function filterPostings(postings: Posting[], config: ScoutConfig): Posting[] {
  return postings.filter((posting) => passesPrefilter(posting, config));
}

/** Collapses the same role republished under several different URLs into one posting -- the
 * common case is a single remote listing reposted once per country/region to widen reach, with
 * a fully copy-pasted description and only `location` differing. Without this, each republished
 * copy would separately survive the prefilter and separately burn a judgment turn -- one real
 * vacancy becoming several judgments in a single scout run.
 *
 * Keeps one representative `Posting` per contentId (the first one encountered), folding every
 * other copy's `location` into the kept posting's `location` so a "Remote, Germany / Poland /
 * UK" role still reads as one wide-reach remote listing, not just "Remote, Germany" with the
 * other copies silently discarded. Everything else (url, applyUrl, description, ...) is kept
 * from the first copy encountered -- fetch order, not a meaningful priority. */
export function collapseDuplicates(postings: Posting[]): Posting[] {
  const kept = new Map<string, Posting>();
  const locations = new Map<string, string[]>();
  const order: string[] = [];

  for (const posting of postings) {
    const cid = posting.contentId();
    if (!kept.has(cid)) {
      kept.set(cid, posting);
      locations.set(cid, posting.location ? [posting.location] : []);
      order.push(cid);
    } else {
      const locs = locations.get(cid)!;
      if (posting.location && !locs.includes(posting.location)) {
        locs.push(posting.location);
      }
    }
  }

  const result: Posting[] = [];
  for (const cid of order) {
    let posting = kept.get(cid)!;
    const merged = locations.get(cid)!;
    if (merged.length > 1) {
      posting = posting.withFields({ location: merged.join(" / ") });
    }
    result.push(posting);
  }
  return result;
}
