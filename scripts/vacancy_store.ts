/**
 * Deterministic reads/writes for `data/vacancies/` -- the scout's dedup+audit ledger and every
 * tracked vacancy's own folder. No LLM judgment happens here; this module only ever does what
 * it's told (slugging, file I/O, status-history bookkeeping) so several different agents
 * touching the same `data/` never drift on how a record is shaped. See `playbooks/scout.md` for
 * the flow that calls these functions (via `scripts/mcp_server.ts`'s `vacancy_*` tools).
 *
 * Two things, two different jobs:
 *
 * - `seen.jsonl` -- one flat, append-only log, one line per posting the agent actually judged
 *   (regardless of outcome). Read at the start of every scout run to skip re-judging the same
 *   posting; a posting dropped earlier by the cheap prefilter never appears here, so it's picked
 *   up again on a later run rather than lost for good.
 * - `<slug>/` -- one folder per vacancy worth the candidate's attention: either the scout found it
 *   and it cleared the bar (`status` starts at `new` -- distinct from `seen.jsonl`'s `outcome`
 *   field, which only records whether a folder got created at all, not the vacancy's own pipeline
 *   stage), or the candidate pasted it by hand and asked for a document (`status` starts at
 *   `tracked` instead -- see `upsertVacancy`'s docstring, no reason to route a posting through
 *   `new` when the candidate already decided to act on it). A judged-and-rejected scout posting
 *   leaves its trace solely in `seen.jsonl` (score/category/reason) -- it never gets a folder
 *   here. Inside a vacancy's folder: `record.yaml` (status/status_history/fit/eligibility/
 *   track_label/metadata) and `posting.md` (the posting's own text, when known) always; whatever
 *   a playbook generates for it (a targeted CV, a cover letter, a deeper fitment writeup) belongs
 *   alongside them in the same folder -- a vacancy's folder IS its association with everything
 *   about it, not a separate pointer/dict to maintain.
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { parseArgs } from "util";
import { Eligibility, isLocationEligibilityStatus, normalizeEligibility } from "./eligibility";
import * as postingIds from "./posting_ids";
import { REPO_ROOT } from "./repo_paths";

export const DATA_DIR = path.join(REPO_ROOT, "data", "vacancies");

// A vacancy record's lifecycle -- see playbooks/scout.md for what triggers each transition.
// `new` -> just surfaced by the scout, not yet reviewed by the candidate.
// `tracked` -> candidate confirmed it's worth pursuing.
// `applied` / `interview` / `offer` -> normal pipeline progress.
// `rejected` -> declined, either by the candidate or the company.
// `skipped` -> candidate looked and passed, distinct from `rejected` (company said no).
export const VALID_STATUSES = [
  "new",
  "tracked",
  "applied",
  "interview",
  "offer",
  "rejected",
  "skipped",
] as const;
export type VacancyStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: string): value is VacancyStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

export class VacancyStoreError extends Error {}

type Rec = Record<string, any>;

function now(): string {
  return new Date().toISOString();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Deterministic, filesystem-safe vacancy slug -- company + title for readability, an
 * 8-char suffix from postingId (not re-hashed here -- postingId is already a stable per-URL
 * hash, see `scout_domain.Posting.postingId`) so two similarly-named postings never collide. */
export function makeSlug(company: string, title: string, postingId: string): string {
  const base = [slugify(company), slugify(title)].filter(Boolean).join("-") || "vacancy";
  return `${base.slice(0, 60)}-${postingId.slice(0, 8)}`;
}

export function vacancyDir(slug: string): string {
  return path.join(DATA_DIR, slug);
}
export function recordPath(slug: string): string {
  return path.join(vacancyDir(slug), "record.yaml");
}
export function postingPath(slug: string): string {
  return path.join(vacancyDir(slug), "posting.md");
}
export function seenPath(): string {
  return path.join(DATA_DIR, "seen.jsonl");
}

function readYamlRecord(filePath: string): Rec {
  const parsed = yaml.load(fs.readFileSync(filePath, "utf-8"));
  return (parsed ?? {}) as Rec;
}

function writeYamlRecord(filePath: string, record: Rec): void {
  fs.writeFileSync(filePath, yaml.dump(record, { sortKeys: false }), "utf-8");
}

/** Only sets `obj[key]` if the key is not already present -- mirrors Python's `dict.setdefault`,
 * which checks key PRESENCE, not truthiness/nullishness (a stored `null`/`""`/`false` value is
 * left alone, unlike `??=`). */
function setdefault(obj: Rec, key: string, value: unknown): void {
  if (!(key in obj)) obj[key] = value;
}

/** Returns [postingIds, contentIds] already judged. Tolerant of lines missing content_id
 * (an older or hand-edited entry) -- just skips it instead of throwing. */
export function readSeenIds(): [Set<string>, Set<string>] {
  const filePath = seenPath();
  if (!fs.existsSync(filePath)) return [new Set(), new Set()];
  const postingIdSet = new Set<string>();
  const contentIdSet = new Set<string>();
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const record = JSON.parse(line) as Rec;
    if (record.posting_id) postingIdSet.add(record.posting_id);
    if (record.content_id) contentIdSet.add(record.content_id);
  }
  return [postingIdSet, contentIdSet];
}

/** Append one judged posting to seen.jsonl. Call this for EVERY posting the agent actually
 * judges, whether it got a vacancy folder or not -- the point of this ledger is never
 * re-judging the same posting, not just remembering the ones that passed. `outcome` is
 * deliberately `matched`/`rejected`, not `tracked`/`rejected` -- `tracked` is a specific
 * VALID_STATUSES value a vacancy only reaches once the candidate confirms it, and a posting
 * that just cleared the scout's bar starts at `new`, not `tracked`; reusing that word here
 * would claim a pipeline stage that hasn't happened yet. `company`/`title` are stored purely so
 * a human skimming the raw file can tell what a line was about; they play no role in dedup
 * (posting_id/content_id do that). */
export function markSeen(
  postingId: string,
  contentId: string,
  opts: {
    outcome: "matched" | "rejected";
    company?: string;
    title?: string;
    fitScore?: number | null;
    fitCategory?: string | null;
    reason?: string | null;
  }
): void {
  if (opts.outcome !== "matched" && opts.outcome !== "rejected") {
    throw new VacancyStoreError(`outcome must be 'matched' or 'rejected', got ${JSON.stringify(opts.outcome)}`);
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const record: Rec = {
    posting_id: postingId,
    content_id: contentId,
    seen_at: now(),
    outcome: opts.outcome,
  };
  if (opts.company) record.company = opts.company;
  if (opts.title) record.title = opts.title;
  if (opts.fitScore !== undefined && opts.fitScore !== null) record.fit_score = opts.fitScore;
  if (opts.fitCategory !== undefined && opts.fitCategory !== null) record.fit_category = opts.fitCategory;
  if (opts.reason !== undefined && opts.reason !== null) record.reason = opts.reason;
  fs.appendFileSync(seenPath(), JSON.stringify(record) + "\n", "utf-8");
}

export interface VacancySummary {
  slug: string;
  status: string;
  company: string;
  title: string;
  fitScore: number | null;
  trackLabel: string | null;
  url: string;
  updatedAt: string;
  /** Free-text location as the scout's own fetcher (or the candidate, for a hand-pasted vacancy)
   * recorded it -- e.g. "Berlin, Germany", "Remote", "за кордоном, віддалено". Empty when never
   * set. Used by `render_board.ts`/`rendering.renderBoardHtml` to highlight a candidate's local
   * vacancies (via `scout_prefilter.matchesLocalKeywords` against `data/sources.yaml`'s
   * `local_keywords`) -- not shown as its own column, since most vacancies leave it empty and a
   * mostly-blank column would just be noise. */
  location: string;
  /** See `setArchived`. `listVacancies` already excludes an archived vacancy by default (its
   * `includeArchived` option), so this is mainly here for a caller that explicitly asked to see
   * archived ones too and still needs to tell them apart from active ones in the result. */
  archived: boolean;
  /** Operational eligibility flags from fitment judgment, stored so deterministic renderers can
   * show them without re-reading or re-judging fitment.md. */
  eligibility?: Eligibility;
  /** every file actually present in the vacancy's folder, sorted -- lets a caller (a dashboard
   * renderer, an agent deciding what to offer) know exactly what's openable without a second
   * lookup or guessing from record fields alone. */
  files: readonly string[];
}

function summaryToDict(s: VacancySummary): Rec {
  return {
    slug: s.slug,
    status: s.status,
    company: s.company,
    title: s.title,
    fit_score: s.fitScore,
    track_label: s.trackLabel,
    url: s.url,
    updated_at: s.updatedAt,
    location: s.location,
    archived: s.archived,
    eligibility: s.eligibility ?? null,
    files: [...s.files],
  };
}

/** One level of `<slug>` directories under DATA_DIR, each checked for a `record.yaml` --
 * deliberately not a recursive glob, matching the Python original's one-level `Path.glob`. */
function listRecordPaths(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(DATA_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const rpath = path.join(DATA_DIR, entry.name, "record.yaml");
    if (fs.existsSync(rpath)) out.push(rpath);
  }
  return out;
}

/** Returns the slug of an existing vacancy folder whose company+title match (normalized,
 * case-insensitive), or null. Used by `upsertVacancy` as a fallback for a manually-supplied
 * posting (no posting_id/content_id given) when a fresh hash computation wouldn't find the
 * existing folder -- e.g. a vacancy first created from a bare paste (no URL, no description)
 * later getting richer data, or the same posting reaching this repo once via the scout and
 * once via a candidate's paste with slightly different exact wording, so the content-hash
 * wouldn't match byte-for-byte. Deliberately loose (company+title only, not content) --
 * reasonable for a personal tool where two genuinely different openings at the same company
 * sharing the exact same title string are rare; NOT used for a scout-found posting, which
 * already has a reliable hash from a real URL and shouldn't be second-guessed this way. */
export function findByCompanyTitle(company: string, title: string): string | null {
  if (!fs.existsSync(DATA_DIR)) return null;
  const target = `${slugify(company)} ${slugify(title)}`;
  for (const rpath of listRecordPaths()) {
    const record = readYamlRecord(rpath);
    const key = `${slugify(record.company ?? "")} ${slugify(record.title ?? "")}`;
    if (key === target) return record.slug ?? path.basename(path.dirname(rpath));
  }
  return null;
}

export interface UpsertVacancyOptions {
  postingId?: string;
  contentId?: string;
  company: string;
  title: string;
  url?: string;
  applyUrl?: string;
  location?: string;
  remote?: boolean;
  source?: string;
  postedAt?: string;
  postingText?: string;
  status?: VacancyStatus;
  trackLabel?: string;
  fitScore?: number;
  fitCategory?: string;
  fitReason?: string;
  eligibility?: Eligibility;
}

/** Create a new vacancy folder, or update the existing one for this posting.
 *
 * `postingId`/`contentId` come from the scout (`scout_domain.Posting`) for a scout-found
 * posting -- pass them through as given. For a posting the candidate pasted by hand, omit both:
 * they're computed fresh from company/title/postingText/url via `posting_ids.manualIds`, the
 * same hash functions the scout uses, UNLESS an existing folder already has the same
 * company+title (see `findByCompanyTitle`), in which case its ids are reused instead so this
 * updates that folder rather than creating a duplicate. A bare paste with no URL at all is fine
 * -- leave `url` empty too.
 *
 * **The company+title reconciliation also runs when explicit ids ARE given, as a fallback only
 * -- never overriding an exact id match, only filling in for one that doesn't exist yet.** A
 * scout-found posting's own explicit ids take priority (an exact match on them always wins), but
 * if nothing on disk has that exact posting_id/content_id yet, an existing folder with the same
 * company+title is reused rather than minting a second folder for what's very likely the same
 * real vacancy discovered a second time through a different route -- most commonly, the
 * candidate tracked it by hand (`playbooks/vacancy-resolve.md`) before the scout ever found it,
 * so the scout's own hash (source+URL-based) never had a reason to match the earlier manual
 * one. Traded off deliberately: the same company genuinely reposting an identical title months
 * apart would now merge into the older folder too, overwriting its posting text -- rarer and
 * less costly for a single-candidate tool than the alternative (a silent duplicate board entry
 * for the exact same real vacancy, every time this crossover happens).
 *
 * Slug (and so the folder name) is always derived deterministically from company/title/
 * postingId -- never accepted as a free-form argument, so two different callers can never
 * invent two different slugs for the same posting.
 *
 * Writes `record.yaml` (metadata) and `posting.md` (the posting's own text, only overwritten
 * when `postingText` is non-empty -- an update call that only changes status/fit doesn't need
 * to re-pass the full text). Every enrichment field (`location`, `remote`, `source`,
 * `postedAt`, the `fit` block, `trackLabel`) works the same way: omitted on this call means
 * "I don't have an opinion," not "clear whatever's there" -- an existing value survives an
 * update call that doesn't mention it (a real, previously-real bug: `playbooks/
 * cover-letter.md`'s Step 0 calling this for an already scout-matched vacancy, with no fit
 * info of its own to pass, used to silently wipe out that vacancy's fit score). `company`/
 * `title`/`url`/`applyUrl` are the exception -- always written from what's passed, since
 * they're identity, not enrichment, and should always reflect the latest call's understanding
 * of them.
 *
 * `status` follows the same "omit means no opinion" rule as the enrichment fields above --
 * omitted on an update call, the vacancy's current status is left exactly as it was (defaults
 * to `"new"` only when creating a brand-new record, never as a side effect of an update). This
 * is deliberate, not incidental: a real bug here silently regressed several `applied`/
 * `rejected`/`tracked` vacancies back to `"new"` -- complete with a bogus status_history entry
 * -- because a bulk field-backfill script called this without re-passing each vacancy's own
 * current status, and the old unconditional `"new"` default did the rest.
 *
 * Returns the record dict (not the posting text -- read `posting.md` directly for that). */
export function upsertVacancy(opts: UpsertVacancyOptions): Rec {
  if (opts.status !== undefined && !isValidStatus(opts.status)) {
    throw new VacancyStoreError(`status must be one of ${VALID_STATUSES.join(", ")}, got ${JSON.stringify(opts.status)}`);
  }

  let pid = opts.postingId;
  let cid = opts.contentId;
  let idSource = "scout"; // overwritten below on either the omitted-ids or the reconciled path

  if (pid === undefined || cid === undefined) {
    idSource = "manual";
    const existingSlug = findByCompanyTitle(opts.company, opts.title);
    if (existingSlug !== null) {
      const existing = readYamlRecord(recordPath(existingSlug));
      pid = existing.posting_id ?? pid;
      cid = existing.content_id ?? cid;
    }
    if (pid === undefined || cid === undefined) {
      [pid, cid] = postingIds.manualIds(opts.company, opts.title, opts.postingText ?? "", opts.url ?? "");
    }
  } else if (!fs.existsSync(recordPath(makeSlug(opts.company, opts.title, pid)))) {
    // Explicit ids given (the scout's own path), but nothing on disk has this exact posting
    // yet -- fall back to an existing company+title match, but ONLY when that existing
    // record's own ids are NOT known to already be a trustworthy scout hash (idSource ===
    // "scout"): two genuinely different scout-found postings sharing a company+title (a real,
    // previously-verified case -- e.g. the same role reposted with a new req) must stay
    // separate, since their real posting_ids will always differ and there's no other signal
    // to tell them apart. A record with no id_source at all (anything created before this
    // field existed) defaults to eligible -- the crossover case below is common and active
    // right now, the false-merge case is rare, and an old record predates any of this
    // distinction anyway.
    const existingSlug = findByCompanyTitle(opts.company, opts.title);
    if (existingSlug !== null) {
      const existing = readYamlRecord(recordPath(existingSlug));
      if (existing.id_source !== "scout") {
        pid = existing.posting_id ?? pid;
        cid = existing.content_id ?? cid;
        idSource = existing.id_source ?? "manual";
      }
    }
  }

  if (pid === undefined || cid === undefined) {
    // Should be unreachable given the logic above -- every branch resolves both ids. Guards
    // against a future edit silently breaking that invariant rather than writing a corrupt slug.
    throw new VacancyStoreError("internal error: posting_id/content_id unresolved in upsertVacancy");
  }

  const slug = makeSlug(opts.company, opts.title, pid);
  const vdir = vacancyDir(slug);
  const rpath = recordPath(slug);
  const nowStr = now();

  let record: Rec;
  if (fs.existsSync(rpath)) {
    record = readYamlRecord(rpath);
    const existingPostingId = record.posting_id;
    if (existingPostingId && existingPostingId !== pid) {
      // makeSlug's 8-char postingId suffix isn't collision-proof -- catch a genuine
      // slug collision here rather than silently overwriting a different posting's record.
      throw new VacancyStoreError(
        `slug ${JSON.stringify(slug)} already belongs to posting_id ${JSON.stringify(existingPostingId)}, not ` +
          `${JSON.stringify(pid)} -- refusing to overwrite a different vacancy's record.`
      );
    }
  } else {
    const initialStatus = opts.status ?? "new";
    record = {
      slug,
      posting_id: pid,
      content_id: cid,
      // "scout" (explicit ids, a real source+URL/content hash) or "manual" (computed by
      // posting_ids.manualIds, or reused from an existing manual record via the
      // company+title fallback above) -- read by that same fallback logic to decide whether
      // a FUTURE explicit-id call is allowed to reconcile onto this record. Never load-
      // bearing for anything else; safe to ignore for any record predating this field.
      id_source: idSource,
      status: initialStatus,
      status_history: [{ status: initialStatus, at: nowStr }],
      created_at: nowStr,
    };
    // Every vacancy that gets a folder is, by definition, a posting that's been judged and
    // matched -- record that in the seen ledger here too, not just when a caller remembers to
    // call markSeen separately. Closes a real gap: playbooks/vacancy-resolve.md's
    // manual-paste path never called vacancy_mark_seen, so a posting tracked by hand had no
    // seen.jsonl entry at all -- a later scout run fetching the same real posting from a
    // public board would find no match there and spend a judgment turn re-analyzing it (the
    // company+title fallback above still prevents an actual duplicate folder, but this avoids
    // the wasted judgment call in the first place, and keeps the ledger honest either way).
    // Harmless if a caller (scout-record-outcomes.md) also calls markSeen explicitly for the
    // same posting -- readSeenIds() just dedups into a set, an extra line costs nothing but
    // a few bytes.
    markSeen(pid, cid, {
      outcome: "matched",
      company: opts.company,
      title: opts.title,
      fitScore: opts.fitScore,
      fitCategory: opts.fitCategory,
      reason: opts.fitReason,
    });
  }

  Object.assign(record, {
    company: opts.company,
    title: opts.title,
    url: opts.url ?? "",
    apply_url: opts.applyUrl || opts.url || "",
    updated_at: nowStr,
  });
  if (opts.location) record.location = opts.location;
  if (opts.remote !== undefined) record.remote = opts.remote;
  if (opts.source) record.source = opts.source;
  if (opts.postedAt) record.posted_at = opts.postedAt;
  if (opts.trackLabel) record.track_label = opts.trackLabel;
  if (opts.fitScore !== undefined || opts.fitCategory !== undefined || opts.fitReason !== undefined) {
    record.fit = { score: opts.fitScore ?? null, category: opts.fitCategory ?? null, reason: opts.fitReason ?? null };
  } else {
    setdefault(record, "fit", { score: null, category: null, reason: null });
  }
  const eligibility = normalizeEligibility(opts.eligibility);
  if (eligibility !== undefined) record.eligibility = eligibility;
  setdefault(record, "location", "");
  setdefault(record, "remote", false);
  setdefault(record, "source", "");
  setdefault(record, "posted_at", "");
  setdefault(record, "track_label", null);

  // "new" is only ever a legitimate status for a posting nobody has looked at yet -- never a
  // real transition an existing record should make. Guards a real second-order bug the
  // company+title reconciliation above (re)surfaced: a scout call that (correctly, for what it
  // believes is a first discovery) passes status="new" must NOT regress an existing record this
  // same posting just reconciled onto (e.g. one the candidate already tracked by hand) back to
  // "new" -- a brand-new record's own initialStatus handling above already covers the actual
  // "new" case, so this condition only ever suppresses an incorrect regression, never a real one.
  if (opts.status !== undefined && opts.status !== "new" && record.status !== opts.status) {
    record.status = opts.status;
    setdefault(record, "status_history", []);
    record.status_history.push({ status: opts.status, at: nowStr });
  }
  setdefault(record, "status", "new");
  setdefault(record, "status_history", [{ status: record.status, at: nowStr }]);
  // Never set from `opts` here, unlike the enrichment fields above -- "archived" isn't
  // something a scout/candidate re-discovery call should ever have an opinion on, only
  // `setArchived` (a deliberate candidate action) does. Defaulting false only at creation means
  // a repost of an already-archived vacancy reconciling onto this same record (see the
  // company+title fallback above) leaves the archive decision exactly as the candidate left it,
  // never silently un-archiving it just because the posting resurfaced.
  setdefault(record, "archived", false);

  fs.mkdirSync(vdir, { recursive: true });
  if (opts.postingText) fs.writeFileSync(postingPath(slug), opts.postingText, "utf-8");
  writeYamlRecord(rpath, record);
  return record;
}

/** `note`, when given, is stored on the `status_history` entry for this transition (`{status, at,
 * note}`) -- an **explicitly observed** reason or context for the move: what a rejection email
 * actually said, that an interview was scheduled, a recruiter's stated requirement. Not an
 * inferred cause ("probably too senior", "likely comp mismatch") -- omit inference entirely for
 * now rather than record a guess as if it were fact. Free text; omit `note` when there's no
 * stated reason. A no-op transition (status unchanged) records nothing, note or not. */
export function setStatus(slug: string, status: VacancyStatus, note?: string): Rec {
  if (!isValidStatus(status)) {
    throw new VacancyStoreError(`status must be one of ${VALID_STATUSES.join(", ")}, got ${JSON.stringify(status)}`);
  }
  const rpath = recordPath(slug);
  if (!fs.existsSync(rpath)) {
    throw new VacancyStoreError(`No vacancy record for slug ${JSON.stringify(slug)} at ${rpath}`);
  }
  const record = readYamlRecord(rpath);
  const nowStr = now();
  if (record.status !== status) {
    record.status = status;
    setdefault(record, "status_history", []);
    const entry: Rec = { status, at: nowStr };
    if (note && note.trim()) entry.note = note.trim();
    record.status_history.push(entry);
    record.updated_at = nowStr;
    writeYamlRecord(rpath, record);
  }
  return record;
}

/** Archives (or unarchives) a vacancy -- orthogonal to `status`, not a new pipeline stage.
 * `status` records where a vacancy is in the hiring process (several of which -- `rejected`,
 * `skipped`, an old `offer` -- are legitimately terminal but still worth keeping on record);
 * `archived` only controls whether it's still worth seeing on the board day to day. No
 * `status_history`-style log kept for this -- it's a visibility toggle, not a pipeline event.
 * `render_board.ts`/`vacancy_list` exclude an archived vacancy by default (see
 * `listVacancies`'s `includeArchived` option) but never delete anything; unarchiving (`archived:
 * false`) brings it straight back with its full history intact. */
export function setArchived(slug: string, archived: boolean): Rec {
  const rpath = recordPath(slug);
  if (!fs.existsSync(rpath)) {
    throw new VacancyStoreError(`No vacancy record for slug ${JSON.stringify(slug)} at ${rpath}`);
  }
  const record = readYamlRecord(rpath);
  if (record.archived !== archived) {
    record.archived = archived;
    record.updated_at = now();
    writeYamlRecord(rpath, record);
  }
  return record;
}

/** Copies an existing file into `data/vacancies/<slug>/` as `<kind><original suffix>` --
 * under this layout a vacancy folder's *contents* are its association with everything about
 * it, not a separate pointer field, so "attaching" means physically placing the file there.
 * For a playbook generating fresh output for an already-known vacancy, write directly into
 * `data/vacancies/<slug>/` in the first place rather than writing elsewhere and calling this;
 * this exists for a file that already lives somewhere else (a doc pulled in from outside, or
 * output written before the vacancy's slug was known). */
export function attachArtifact(slug: string, kind: string, sourcePathStr: string): { path: string } {
  if (!fs.existsSync(recordPath(slug))) {
    throw new VacancyStoreError(`No vacancy record for slug ${JSON.stringify(slug)}`);
  }
  const source = path.resolve(sourcePathStr.replace(/^~/, process.env.HOME ?? "~"));
  if (!fs.existsSync(source)) {
    throw new VacancyStoreError(`No file at ${source}`);
  }
  const dest = path.join(vacancyDir(slug), `${kind}${path.extname(source)}`);
  fs.copyFileSync(source, dest);
  const record = readYamlRecord(recordPath(slug));
  record.updated_at = now();
  writeYamlRecord(recordPath(slug), record);
  return { path: dest };
}

/** `includeArchived` defaults to false -- an archived vacancy (see `setArchived`) is left out of
 * every normal listing/board render unless a caller explicitly asks to see it too. This is the
 * one place that default lives; `render_board.ts` relies on it rather than filtering again
 * itself. */
export function listVacancies(status?: string, opts: { includeArchived?: boolean } = {}): Rec[] {
  if (status !== undefined && !isValidStatus(status)) {
    throw new VacancyStoreError(`status must be one of ${VALID_STATUSES.join(", ")}, got ${JSON.stringify(status)}`);
  }
  const includeArchived = opts.includeArchived ?? false;
  if (!fs.existsSync(DATA_DIR)) return [];
  const summaries: VacancySummary[] = [];
  for (const rpath of listRecordPaths().sort()) {
    const record = readYamlRecord(rpath);
    if (status !== undefined && record.status !== status) continue;
    if (!includeArchived && record.archived) continue;
    const fit = record.fit ?? {};
    const dir = path.dirname(rpath);
    const files = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .sort();
    summaries.push({
      slug: record.slug ?? path.basename(dir),
      status: record.status ?? "new",
      company: record.company ?? "",
      title: record.title ?? "",
      fitScore: fit.score ?? null,
      trackLabel: record.track_label ?? null,
      url: record.url ?? "",
      updatedAt: record.updated_at ?? "",
      location: record.location ?? "",
      archived: record.archived ?? false,
      eligibility: normalizeEligibility(record.eligibility),
      files,
    });
  }
  return summaries.map(summaryToDict);
}

/** CLI fallback for an agent without MCP support -- one subcommand per MCP tool in
 * `scripts/mcp_server.ts`, same arguments, same behavior. Prefer the MCP tools when connected;
 * see AGENTS.md's "Scripts and the MCP server" section. */
function cli(): void {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      "posting-id": { type: "string" },
      "content-id": { type: "string" },
      outcome: { type: "string" },
      company: { type: "string", default: "" },
      title: { type: "string", default: "" },
      "fit-score": { type: "string" },
      "fit-category": { type: "string" },
      reason: { type: "string" },
      url: { type: "string", default: "" },
      "apply-url": { type: "string", default: "" },
      location: { type: "string", default: "" },
      remote: { type: "boolean" },
      source: { type: "string", default: "" },
      "posted-at": { type: "string", default: "" },
      "posting-text": { type: "string", default: "" },
      status: { type: "string" },
      "track-label": { type: "string" },
      "fit-reason": { type: "string" },
      "eligibility-location-status": { type: "string" },
      "eligibility-location-reason": { type: "string" },
      slug: { type: "string" },
      note: { type: "string" },
      kind: { type: "string" },
      path: { type: "string" },
      // string, not boolean -- parseArgs's boolean type is presence-only (no way to pass
      // `false` explicitly), and un-archiving needs that just as much as archiving does.
      archived: { type: "string" },
      "include-archived": { type: "boolean" },
    },
  });

  const command = positionals[0];
  let result: unknown;

  if (command === "mark-seen") {
    if (!values["posting-id"] || !values["content-id"] || !values.outcome) {
      throw new VacancyStoreError("mark-seen requires --posting-id, --content-id, --outcome");
    }
    markSeen(values["posting-id"], values["content-id"], {
      outcome: values.outcome as "matched" | "rejected",
      company: values.company,
      title: values.title,
      fitScore: values["fit-score"] !== undefined ? Number(values["fit-score"]) : undefined,
      fitCategory: values["fit-category"],
      reason: values.reason,
    });
    result = { ok: true };
  } else if (command === "upsert") {
    if (!values.company || !values.title) {
      throw new VacancyStoreError("upsert requires --company and --title");
    }
    const status = values.status;
    if (status !== undefined && !isValidStatus(status)) {
      throw new VacancyStoreError(`--status must be one of ${VALID_STATUSES.join(", ")}`);
    }
    const eligibilityStatus = values["eligibility-location-status"];
    if (eligibilityStatus !== undefined && !isLocationEligibilityStatus(eligibilityStatus)) {
      throw new VacancyStoreError(
        "--eligibility-location-status must be one of open_remote, local, location_exception_candidate, hard_location_block, unclear"
      );
    }
    result = upsertVacancy({
      postingId: values["posting-id"],
      contentId: values["content-id"],
      company: values.company,
      title: values.title,
      url: values.url,
      applyUrl: values["apply-url"],
      location: values.location,
      remote: values.remote,
      source: values.source,
      postedAt: values["posted-at"],
      postingText: values["posting-text"],
      status,
      trackLabel: values["track-label"],
      fitScore: values["fit-score"] !== undefined ? Number(values["fit-score"]) : undefined,
      fitCategory: values["fit-category"],
      fitReason: values["fit-reason"],
      eligibility: eligibilityStatus
        ? { location: { status: eligibilityStatus, reason: values["eligibility-location-reason"] } }
        : undefined,
    });
  } else if (command === "set-status") {
    if (!values.slug || !values.status || !isValidStatus(values.status)) {
      throw new VacancyStoreError(`set-status requires --slug and --status (one of ${VALID_STATUSES.join(", ")})`);
    }
    result = setStatus(values.slug, values.status, values.note);
  } else if (command === "set-archived") {
    if (!values.slug || (values.archived !== "true" && values.archived !== "false")) {
      throw new VacancyStoreError("set-archived requires --slug and --archived true|false");
    }
    result = setArchived(values.slug, values.archived === "true");
  } else if (command === "attach-artifact") {
    if (!values.slug || !values.kind || !values.path) {
      throw new VacancyStoreError("attach-artifact requires --slug, --kind, --path");
    }
    result = attachArtifact(values.slug, values.kind, values.path);
  } else if (command === "list") {
    result = listVacancies(values.status, { includeArchived: values["include-archived"] });
  } else {
    throw new VacancyStoreError(
      `Unknown command ${JSON.stringify(command)} -- expected one of: mark-seen, upsert, set-status, set-archived, attach-artifact, list`
    );
  }

  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  cli();
}
