/**
 * Shared shapes for the scout fetch/prefilter pipeline -- pure data, no I/O and no network here.
 *
 * `Posting` is the normalized shape every fetcher in `scout_sources.ts` returns. `ScoutConfig` is
 * loaded from `data/sources.yaml` by `loadScoutConfig` below -- the candidate's own tracks,
 * exclusions, company list, and feed selection, personal to whoever's `data/` this is.
 */

import * as fs from "fs";
import * as yaml from "js-yaml";
import * as postingIds from "./posting_ids";

/** One normalized job posting from any source. `description` is plain text (HTML already
 * stripped by the fetcher that produced this) -- the only shape a fitment judgment needs to
 * see. */
export class Posting {
  readonly source: string;
  readonly company: string;
  readonly title: string;
  readonly location: string;
  readonly remote: boolean;
  readonly url: string;
  readonly applyUrl: string;
  readonly description: string;
  /** raw string from the source -- kept as-is, never parsed into a real date */
  readonly postedAt: string;

  constructor(fields: {
    source: string;
    company: string;
    title: string;
    location: string;
    remote: boolean;
    url: string;
    applyUrl: string;
    description: string;
    postedAt: string;
  }) {
    this.source = fields.source;
    this.company = fields.company;
    this.title = fields.title;
    this.location = fields.location;
    this.remote = fields.remote;
    this.url = fields.url;
    this.applyUrl = fields.applyUrl;
    this.description = fields.description;
    this.postedAt = fields.postedAt;
  }

  /** Immutable field-level update, since `Posting` is otherwise treated as frozen -- mirrors
   * Python's `dataclasses.replace(posting, ...)` used by scout_prefilter's repost-collapsing. */
  withFields(overrides: Partial<{
    source: string;
    company: string;
    title: string;
    location: string;
    remote: boolean;
    url: string;
    applyUrl: string;
    description: string;
    postedAt: string;
  }>): Posting {
    return new Posting({
      source: overrides.source ?? this.source,
      company: overrides.company ?? this.company,
      title: overrides.title ?? this.title,
      location: overrides.location ?? this.location,
      remote: overrides.remote ?? this.remote,
      url: overrides.url ?? this.url,
      applyUrl: overrides.applyUrl ?? this.applyUrl,
      description: overrides.description ?? this.description,
      postedAt: overrides.postedAt ?? this.postedAt,
    });
  }

  /** Stable per-URL dedup key. NOT enough on its own to catch the same role republished
   * under several URLs -- see `contentId()`. See `posting_ids.postingId`'s own docstring
   * for the full reasoning; shared with `vacancy_store`'s manual-paste path so a posting
   * pasted by hand and the same posting found by the scout hash identically. */
  postingId(): string {
    return postingIds.postingId(this.source, this.url);
  }

  /** Dedup key for "is this the same role, regardless of URL/location" -- catches a
   * posting republished under several different URLs (one per country/region for a remote
   * role is the common case) with identical or near-identical copy. See
   * `posting_ids.contentId`'s own docstring for the full reasoning. */
  contentId(): string {
    return postingIds.contentId(this.company, this.title, this.description);
  }

  /** What gets handed to the agent's own fitment judgment -- the same shape a candidate
   * pasting this posting by hand into `playbooks/fitment.md` would produce, so nothing
   * downstream needs to know a posting can also arrive via the scout instead of a paste. */
  asJobPostText(): string {
    let loc: string;
    if (this.remote && !this.location.toLowerCase().includes("remote")) {
      loc = this.location ? `${this.location} (remote)`.trim() : "Remote";
    } else {
      loc = this.location;
    }
    const headerLines = [`${this.title} at ${this.company}`];
    if (loc) headerLines.push(`Location: ${loc}`);
    headerLines.push(`Source: ${this.url}`);
    return headerLines.join("\n") + "\n\n" + this.description.trim();
  }

  toDict(): Record<string, unknown> {
    return {
      posting_id: this.postingId(),
      content_id: this.contentId(),
      source: this.source,
      company: this.company,
      title: this.title,
      location: this.location,
      remote: this.remote,
      url: this.url,
      apply_url: this.applyUrl,
      posted_at: this.postedAt,
      job_post_text: this.asJobPostText(),
    };
  }
}

export const TRACK_KIND_PRIMARY = "primary";
export const TRACK_KIND_FALLBACK = "fallback";

/** One kind of role the candidate is hunting.
 *
 * `kind` is the candidate's own priority split, not a market-title distinction: `primary` is
 * what the candidate actually wants next -- matching it is enough to pass the prefilter on its
 * own, a `strategic_signals` hit is extra color, never required. `fallback` is proven-but-not-
 * the-goal work -- worth pursuing only alongside a genuine strategic signal (a bare
 * fallback-title match with no signal is a downgrade not worth the agent's judgment turn).
 * Defaults to `primary` for a track with no `kind` in its yaml. */
export interface TrackConfig {
  readonly label: string;
  readonly kind: string;
  readonly titles: readonly string[];
  /** Titles of the people who actually HIRE for this track, not people who already hold it --
   * e.g. for an "Engineering Manager" track, the hiring titles are VP Engineering/Director of
   * Engineering/CTO, never "Engineering Manager" itself. Domain judgment about that role's own
   * reporting hierarchy, deliberately left for the candidate to fill in (`hiring_titles:` in
   * `sources.yaml`) rather than inferred generically -- there's no reliable rule from a track's
   * own `titles` alone. Empty when not configured; `linkedin_searches.ts`'s People-search link
   * is omitted for a track with no `hiringTitles` rather than falling back to `titles` (that
   * fallback is the exact bug this field exists to fix -- it searched for peers, not hirers). */
  readonly hiringTitles: readonly string[];

  /** Exact category values on dou.ua (`?category=`) and/or Djinni (`?primary_keyword=`) --
   * `scout_sources.ts`'s `fetchDouUa`/`fetchDjinni` filter server-side on these, since neither
   * platform accepts arbitrary title text: dou.ua and Djinni each expose only a small, fixed
   * taxonomy (~59 and ~123 values respectively -- see `docs/reference/ua-scout-categories.md`,
   * both lists verified live, not guessed), and a value outside it is either ignored outright
   * (Djinni silently falls back to its unfiltered "latest" feed for anything that isn't an exact
   * match) or matches nothing (dou.ua). This repo used to derive dou.ua/Djinni queries from a
   * track's own `titles` the same way Workable/SmartRecruiters do -- that never actually
   * filtered anything on either platform (a real, previously-shipped bug; see `_sb/roadmap.md`).
   * Same spirit as `hiringTitles` above: the candidate picks from the real, stored list during
   * `playbooks/scout.md`'s Step 0, never invented by whoever's filling in `sources.yaml`. Empty
   * when not configured -- `fetchDouUa`/`fetchDjinni` then fetch nothing for that candidate
   * rather than falling back to an unfiltered pull. */
  readonly uaCategories: readonly string[];
}

/** One per-company board entry. `ats` must be one of `scout_sources.ts`'s
 * `PER_COMPANY_FETCHERS`'s keys (greenhouse, lever, ashby, recruitee). */
export interface CompanyConfig {
  readonly name: string;
  readonly ats: string;
  readonly slug: string;
}

export class ScoutConfigError extends Error {}

/** Loaded from `data/sources.yaml` by `loadScoutConfig`. */
export class ScoutConfig {
  readonly tracks: ReadonlyMap<string, TrackConfig>;
  readonly titleExclude: readonly string[];
  readonly hardExclude: readonly string[];
  readonly companies: readonly CompanyConfig[];
  readonly feeds: readonly string[];

  // Role/mandate-shaped phrases -- "founding engineer," "startup cto," "zero to one." Unlike
  // strategicSignals below, these alone can open the recall lane for a posting whose TITLE
  // matches no configured track at all: the phrase itself already implies a leadership/founding
  // -shaped role, just not one of the candidate's classic market title phrases.
  readonly roleSignals: readonly string[];

  // Tech/domain proof phrases -- "llm," "agentic," "golang," "platform engineering." These
  // deliberately do NOT open the recall lane on their own -- a bare tech-buzzword hit says
  // nothing about a role's SHAPE, only its stack; real signal for that is a track-title match.
  // strategicSignals only ever gates a `fallback` track match (required to pass at all) -- a
  // `primary` track match doesn't need it, it's extra color at most.
  readonly strategicSignals: readonly string[];

  // Candidate's own location phrases (city/country) -- checked against the posting's combined
  // title+location+description text (see scout_prefilter's passesLocationGate), not staged by
  // field: a phrase matching anywhere in that combined text passes.
  readonly localKeywords: readonly string[];

  // Discovery floor -- score_fit's score, once the agent judges a survivor, must clear this
  // to become a tracked vacancy. Below it, the posting still gets a seen.jsonl entry (never
  // re-judged) but no data/vacancies/<slug>/ folder.
  readonly minFitScore: number;

  // Caps how many prefiltered, not-yet-seen survivors one scoutFetch call hands back for the
  // agent to judge -- keeps a single scout run from turning into dozens of judgment turns.
  // Anything past the cap simply isn't returned this run (never marked seen, since it was never
  // judged), so it's picked up again on a later run rather than being lost.
  readonly maxJudgmentsPerRun: number;

  constructor(fields: {
    tracks: ReadonlyMap<string, TrackConfig>;
    titleExclude: readonly string[];
    hardExclude: readonly string[];
    companies: readonly CompanyConfig[];
    feeds: readonly string[];
    roleSignals?: readonly string[];
    strategicSignals?: readonly string[];
    localKeywords?: readonly string[];
    minFitScore?: number;
    maxJudgmentsPerRun?: number;
  }) {
    this.tracks = fields.tracks;
    this.titleExclude = fields.titleExclude;
    this.hardExclude = fields.hardExclude;
    this.companies = fields.companies;
    this.feeds = fields.feeds;
    this.roleSignals = fields.roleSignals ?? [];
    this.strategicSignals = fields.strategicSignals ?? [];
    this.localKeywords = fields.localKeywords ?? [];
    this.minFitScore = fields.minFitScore ?? 4;
    this.maxJudgmentsPerRun = fields.maxJudgmentsPerRun ?? 25;
  }

  /** Flattened, de-duplicated title phrases across every track regardless of `kind` -- the
   * query-driven fetchers (Workable/SmartRecruiters search by these phrases) want every
   * track's titles in the query even though whether a fallback match is actually worth
   * judging is the prefilter's job, decided per-posting after fetch. */
  allTrackTitles(): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const track of this.tracks.values()) {
      for (const title of track.titles) {
        const normalized = title.trim().toLowerCase();
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          out.push(normalized);
        }
      }
    }
    return out;
  }

  /** Flattened, de-duplicated `ua_categories` across every track -- `fetchDouUa`/`fetchDjinni`
   * aren't per-track fetches (unlike Workable/SmartRecruiters, dou.ua's and Djinni's own APIs
   * have no per-request budget worth rationing per track), so like `allTrackTitles` above, every
   * track's configured categories go into one shared query list; case is preserved (not
   * lowercased the way `allTrackTitles` normalizes titles) because Djinni's `primary_keyword`
   * match is case-sensitive for anything that isn't already lowercase -- see
   * `docs/reference/ua-scout-categories.md`. */
  allUaCategories(): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const track of this.tracks.values()) {
      for (const category of track.uaCategories) {
        const trimmed = category.trim();
        const key = trimmed.toLowerCase();
        if (trimmed && !seen.has(key)) {
          seen.add(key);
          out.push(trimmed);
        }
      }
    }
    return out;
  }

  /** The track whose own title phrases match `titleLower` first, primary tracks checked
   * before fallback ones. Primary-first means a title phrase that happens to appear in both
   * a primary and a fallback track resolves to the more generous (primary) classification.
   * `titleLower` must already be lowercased by the caller. */
  matchingTrack(titleLower: string): TrackConfig | null {
    let fallbackMatch: TrackConfig | null = null;
    for (const track of this.tracks.values()) {
      if (!track.titles.some((phrase) => titleLower.includes(phrase))) continue;
      if (track.kind === TRACK_KIND_FALLBACK) {
        if (fallbackMatch === null) fallbackMatch = track;
        continue;
      }
      return track;
    }
    return fallbackMatch;
  }
}

function asStringTuple(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim().toLowerCase());
}

/** Same as `asStringTuple` but keeps original casing -- only for `ua_categories`, whose values
 * get sent verbatim as dou.ua/Djinni query params rather than compared as free text. Lowercasing
 * is harmless for dou.ua (confirmed case-insensitive) but breaks Djinni's `primary_keyword`
 * match for anything that isn't already all-lowercase -- see `docs/reference/
 * ua-scout-categories.md`. */
function asStringTuplePreserveCase(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim());
}

/** Reads `data/sources.yaml`. See `playbooks/scout.md` for the exact shape and how a
 * candidate fills it in (onboarding doesn't create this file automatically -- scouting is an
 * opt-in, separate step). */
export function loadScoutConfig(path: string): ScoutConfig {
  if (!fs.existsSync(path)) {
    throw new ScoutConfigError(`${path} doesn't exist yet -- run playbooks/scout.md's setup step first.`);
  }
  const parsed = (yaml.load(fs.readFileSync(path, "utf-8")) ?? {}) as Record<string, unknown>;

  const tracksRaw = (parsed.tracks ?? {}) as Record<string, unknown>;
  const tracks = new Map<string, TrackConfig>();
  for (const [key, rawSpec] of Object.entries(tracksRaw)) {
    // A track key with nothing under it in the yaml (`sometrack:`) is a blank track, not an
    // error -- `rawSpec` is `null`/`undefined` in that case, treat it as `{}`.
    const spec = (rawSpec ?? {}) as Record<string, unknown>;
    if (typeof spec !== "object" || Array.isArray(spec)) {
      throw new ScoutConfigError(`tracks.${key} in data/sources.yaml must be a mapping, got ${JSON.stringify(spec)}`);
    }
    tracks.set(key, {
      label: String(spec.label ?? key),
      kind: String(spec.kind ?? TRACK_KIND_PRIMARY),
      titles: asStringTuple(spec.titles),
      hiringTitles: asStringTuple(spec.hiring_titles),
      uaCategories: asStringTuplePreserveCase(spec.ua_categories),
    });
  }

  const companiesRaw = (parsed.companies ?? []) as unknown[];
  const companies: CompanyConfig[] = [];
  for (const entry of companiesRaw) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      throw new ScoutConfigError(`Company entry in data/sources.yaml must be a mapping, got ${JSON.stringify(entry)}`);
    }
    const record = entry as Record<string, unknown>;
    for (const requiredKey of ["name", "ats", "slug"] as const) {
      if (!(requiredKey in record)) {
        throw new ScoutConfigError(`Company entry in data/sources.yaml missing required key: '${requiredKey}'`);
      }
    }
    companies.push({ name: String(record.name), ats: String(record.ats), slug: String(record.slug) });
  }

  return new ScoutConfig({
    tracks,
    titleExclude: asStringTuple(parsed.title_exclude),
    hardExclude: asStringTuple(parsed.hard_exclude),
    companies,
    feeds: asStringTuple(parsed.feeds),
    roleSignals: asStringTuple(parsed.role_signals),
    strategicSignals: asStringTuple(parsed.strategic_signals),
    localKeywords: asStringTuple(parsed.local_keywords),
    minFitScore: parsed.min_fit_score !== undefined ? Number(parsed.min_fit_score) : 4,
    maxJudgmentsPerRun: parsed.max_judgments_per_run !== undefined ? Number(parsed.max_judgments_per_run) : 25,
  });
}
