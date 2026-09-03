/**
 * Deterministic storage for `data/vacancies/`.
 *
 * - `seen.jsonl`: append-only ledger for judged postings, matched or rejected.
 * - `<slug>/`: one tracked vacancy folder with `record.yaml`, `posting.md`, and generated
 *   artifacts for that vacancy.
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { parseArgs } from "util";
import { Eligibility, isLocationEligibilityStatus, normalizeEligibility } from "./eligibility";
import * as postingIds from "./posting_ids";
import { REPO_ROOT } from "./repo_paths";

export const DATA_DIR = path.join(REPO_ROOT, "data", "vacancies");

export interface VacancyStoreScope {
  dataDir?: string;
}

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

function dataDir(scope: VacancyStoreScope = {}): string {
  return scope.dataDir ?? DATA_DIR;
}

export function vacancyDir(slug: string, scope: VacancyStoreScope = {}): string {
  return path.join(dataDir(scope), slug);
}
export function recordPath(slug: string, scope: VacancyStoreScope = {}): string {
  return path.join(vacancyDir(slug, scope), "record.yaml");
}
export function postingPath(slug: string, scope: VacancyStoreScope = {}): string {
  return path.join(vacancyDir(slug, scope), "posting.md");
}
export function seenPath(scope: VacancyStoreScope = {}): string {
  return path.join(dataDir(scope), "seen.jsonl");
}

function readYamlRecord(filePath: string): Rec {
  const parsed = yaml.load(fs.readFileSync(filePath, "utf-8"));
  return (parsed ?? {}) as Rec;
}

function writeYamlRecord(filePath: string, record: Rec): void {
  fs.writeFileSync(filePath, yaml.dump(record, { sortKeys: false }), "utf-8");
}

/** Set only when the key is absent; existing `null`/`""`/`false` values are preserved. */
function setdefault(obj: Rec, key: string, value: unknown): void {
  if (!(key in obj)) obj[key] = value;
}

/** Returns [postingIds, contentIds] already judged. Missing ids are skipped. */
export function readSeenIds(scope: VacancyStoreScope = {}): [Set<string>, Set<string>] {
  const filePath = seenPath(scope);
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

/** Append one judged posting to seen.jsonl. `outcome` is scout outcome, not vacancy status. */
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
  },
  scope: VacancyStoreScope = {}
): void {
  if (opts.outcome !== "matched" && opts.outcome !== "rejected") {
    throw new VacancyStoreError(`outcome must be 'matched' or 'rejected', got ${JSON.stringify(opts.outcome)}`);
  }
  fs.mkdirSync(dataDir(scope), { recursive: true });
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
  fs.appendFileSync(seenPath(scope), JSON.stringify(record) + "\n", "utf-8");
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

/** One level of `<slug>` directories under DATA_DIR, each checked for a `record.yaml`. */
function listRecordPaths(scope: VacancyStoreScope = {}): string[] {
  const root = dataDir(scope);
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const rpath = path.join(root, entry.name, "record.yaml");
    if (fs.existsSync(rpath)) out.push(rpath);
  }
  return out;
}

/** Find an existing vacancy by normalized company+title. Used only as an upsert fallback. */
export function findByCompanyTitle(company: string, title: string, scope: VacancyStoreScope = {}): string | null {
  if (!fs.existsSync(dataDir(scope))) return null;
  const target = `${slugify(company)}\0${slugify(title)}`;
  for (const rpath of listRecordPaths(scope)) {
    const record = readYamlRecord(rpath);
    const key = `${slugify(record.company ?? "")}\0${slugify(record.title ?? "")}`;
    if (key === target) return record.slug ?? path.basename(path.dirname(rpath));
  }
  return null;
}

export interface UpsertVacancyOptions {
  dataDir?: string;
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
  markSeenOnCreate?: boolean;
}

export interface ScoutOutcomeCandidate {
  posting_id: string;
  content_id: string;
  company: string;
  title: string;
  job_post_text: string;
  url?: string;
  apply_url?: string;
  location?: string;
  remote?: boolean;
  source?: string;
  posted_at?: string;
  track_label?: string | null;
}

export interface ScoutOutcomeFit {
  score: number;
  fit_category: string;
  reason?: string;
  markdown: string;
  eligibility?: Eligibility;
}

export interface RecordScoutOutcomeOptions {
  dataDir?: string;
  candidate: ScoutOutcomeCandidate;
  fit: ScoutOutcomeFit;
  minFitScore: number;
}

export interface RecordedScoutOutcome {
  outcome: "matched" | "rejected";
  slug: string | null;
  company: string;
  title: string;
  score: number;
  fit_category: string;
  reason: string;
  fitment_path: string | null;
}

export interface VacancyArtifacts {
  posting: boolean;
  targeting_plan: boolean;
  cv: boolean;
  cover_letter: boolean;
  fitment: boolean;
}

export interface VacancyPaths {
  dir: string;
  record: string;
  posting: string;
  targeting_plan: string;
  cv: string;
  cover_letter: string;
  fitment: string;
}

export interface VacancyContext {
  slug: string;
  record: Rec;
  posting_text: string | null;
  paths: VacancyPaths;
  artifacts: VacancyArtifacts;
}

export interface ResolveVacancyOptions {
  dataDir?: string;
  slug?: string;
  postingId?: string;
  contentId?: string;
  company?: string;
  title?: string;
  url?: string;
  applyUrl?: string;
  location?: string;
  remote?: boolean;
  source?: string;
  postedAt?: string;
  postingText?: string;
  status?: VacancyStatus;
  trackLabel?: string;
}

export interface ResolveVacancyResult {
  context: VacancyContext;
  changed: boolean;
}

/** Create or update a vacancy folder. Omitted enrichment fields mean "no opinion"; existing
 * values are preserved. `status: "new"` only applies to a new record. */
export function upsertVacancy(opts: UpsertVacancyOptions): Rec {
  const scope: VacancyStoreScope = { dataDir: opts.dataDir };
  if (opts.status !== undefined && !isValidStatus(opts.status)) {
    throw new VacancyStoreError(`status must be one of ${VALID_STATUSES.join(", ")}, got ${JSON.stringify(opts.status)}`);
  }

  let pid = opts.postingId;
  let cid = opts.contentId;
  let idSource = "scout";

  if (pid === undefined || cid === undefined) {
    idSource = "manual";
    const existingSlug = findByCompanyTitle(opts.company, opts.title, scope);
    if (existingSlug !== null) {
      const existing = readYamlRecord(recordPath(existingSlug, scope));
      pid = existing.posting_id ?? pid;
      cid = existing.content_id ?? cid;
    }
    if (pid === undefined || cid === undefined) {
      [pid, cid] = postingIds.manualIds(opts.company, opts.title, opts.postingText ?? "", opts.url ?? "");
    }
  } else if (!fs.existsSync(recordPath(makeSlug(opts.company, opts.title, pid), scope))) {
    // Explicit ids do not merge onto records already known to be scout-created.
    const existingSlug = findByCompanyTitle(opts.company, opts.title, scope);
    if (existingSlug !== null) {
      const existing = readYamlRecord(recordPath(existingSlug, scope));
      if (existing.id_source !== "scout") {
        pid = existing.posting_id ?? pid;
        cid = existing.content_id ?? cid;
        idSource = existing.id_source ?? "manual";
      }
    }
  }

  if (pid === undefined || cid === undefined) {
    throw new VacancyStoreError("internal error: posting_id/content_id unresolved in upsertVacancy");
  }

  const slug = makeSlug(opts.company, opts.title, pid);
  const vdir = vacancyDir(slug, scope);
  const rpath = recordPath(slug, scope);
  const nowStr = now();

  let record: Rec;
  if (fs.existsSync(rpath)) {
    record = readYamlRecord(rpath);
    const existingPostingId = record.posting_id;
    if (existingPostingId && existingPostingId !== pid) {
      // makeSlug uses a short hash suffix; guard against a real collision.
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
      id_source: idSource,
      status: initialStatus,
      status_history: [{ status: initialStatus, at: nowStr }],
      created_at: nowStr,
    };
    // New tracked vacancies are also scout-seen for future dedup.
    if (opts.markSeenOnCreate ?? true) {
      markSeen(
        pid,
        cid,
        {
          outcome: "matched",
          company: opts.company,
          title: opts.title,
          fitScore: opts.fitScore,
          fitCategory: opts.fitCategory,
          reason: opts.fitReason,
        },
        scope
      );
    }
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

  // `new` is an initial state, not an update target for existing records.
  if (opts.status !== undefined && opts.status !== "new" && record.status !== opts.status) {
    record.status = opts.status;
    setdefault(record, "status_history", []);
    record.status_history.push({ status: opts.status, at: nowStr });
  }
  setdefault(record, "status", "new");
  setdefault(record, "status_history", [{ status: record.status, at: nowStr }]);
  // Upsert never changes archive visibility; only setArchived does.
  setdefault(record, "archived", false);

  fs.mkdirSync(vdir, { recursive: true });
  if (opts.postingText) fs.writeFileSync(postingPath(slug, scope), opts.postingText, "utf-8");
  writeYamlRecord(rpath, record);
  return record;
}

function scoutOutcomeMatched(fit: ScoutOutcomeFit, minFitScore: number): boolean {
  const locationStatus = normalizeEligibility(fit.eligibility)?.location?.status;
  return fit.score >= minFitScore && fit.fit_category !== "craft_mismatch" && locationStatus !== "hard_location_block";
}

export function recordScoutOutcome(opts: RecordScoutOutcomeOptions): RecordedScoutOutcome {
  const scope: VacancyStoreScope = { dataDir: opts.dataDir };
  const candidate = opts.candidate;
  const fit = opts.fit;
  const reason = fit.reason ?? "";
  const outcome = scoutOutcomeMatched(fit, opts.minFitScore) ? "matched" : "rejected";

  markSeen(
    candidate.posting_id,
    candidate.content_id,
    {
      outcome,
      company: candidate.company,
      title: candidate.title,
      fitScore: fit.score,
      fitCategory: fit.fit_category,
      reason,
    },
    scope
  );

  if (outcome === "rejected") {
    return {
      outcome,
      slug: null,
      company: candidate.company,
      title: candidate.title,
      score: fit.score,
      fit_category: fit.fit_category,
      reason,
      fitment_path: null,
    };
  }

  const record = upsertVacancy({
    postingId: candidate.posting_id,
    contentId: candidate.content_id,
    company: candidate.company,
    title: candidate.title,
    url: candidate.url ?? "",
    applyUrl: candidate.apply_url ?? "",
    location: candidate.location ?? "",
    remote: candidate.remote,
    source: candidate.source ?? "",
    postedAt: candidate.posted_at ?? "",
    postingText: candidate.job_post_text,
    status: "new",
    trackLabel: candidate.track_label ?? undefined,
    fitScore: fit.score,
    fitCategory: fit.fit_category,
    fitReason: reason,
    eligibility: fit.eligibility,
    markSeenOnCreate: false,
    dataDir: opts.dataDir,
  });
  const slug = String(record.slug);
  const fitmentPath = path.join(vacancyDir(slug, scope), "fitment.md");
  fs.writeFileSync(fitmentPath, fit.markdown, "utf-8");

  return {
    outcome,
    slug,
    company: candidate.company,
    title: candidate.title,
    score: fit.score,
    fit_category: fit.fit_category,
    reason,
    fitment_path: fitmentPath,
  };
}

function vacancyPaths(slug: string, scope: VacancyStoreScope = {}): VacancyPaths {
  const dir = vacancyDir(slug, scope);
  return {
    dir,
    record: recordPath(slug, scope),
    posting: postingPath(slug, scope),
    targeting_plan: path.join(dir, "targeting-plan.md"),
    cv: path.join(dir, "cv.md"),
    cover_letter: path.join(dir, "cover-letter.md"),
    fitment: path.join(dir, "fitment.md"),
  };
}

export function readVacancyContext(slug: string, scope: VacancyStoreScope = {}): VacancyContext {
  const paths = vacancyPaths(slug, scope);
  if (!fs.existsSync(paths.record)) {
    throw new VacancyStoreError(`No vacancy record for slug ${JSON.stringify(slug)} at ${paths.record}`);
  }
  const record = readYamlRecord(paths.record);
  return {
    slug,
    record,
    posting_text: fs.existsSync(paths.posting) ? fs.readFileSync(paths.posting, "utf-8") : null,
    paths,
    artifacts: {
      posting: fs.existsSync(paths.posting),
      targeting_plan: fs.existsSync(paths.targeting_plan),
      cv: fs.existsSync(paths.cv),
      cover_letter: fs.existsSync(paths.cover_letter),
      fitment: fs.existsSync(paths.fitment),
    },
  };
}

export function resolveVacancy(opts: ResolveVacancyOptions): ResolveVacancyResult {
  const scope: VacancyStoreScope = { dataDir: opts.dataDir };
  let slug = opts.slug;
  let existing: Rec | null = null;
  if (slug !== undefined) {
    existing = readYamlRecord(recordPath(slug, scope));
  } else if (opts.company && opts.title) {
    slug = findByCompanyTitle(opts.company, opts.title, scope) ?? undefined;
    if (slug !== undefined) existing = readYamlRecord(recordPath(slug, scope));
  }

  let changed = false;
  const hasUpdate =
    opts.postingText !== undefined ||
    opts.url !== undefined ||
    opts.applyUrl !== undefined ||
    opts.location !== undefined ||
    opts.remote !== undefined ||
    opts.source !== undefined ||
    opts.postedAt !== undefined ||
    opts.trackLabel !== undefined;

  if (slug !== undefined && existing !== null) {
    if (hasUpdate) {
      const record = upsertVacancy({
        postingId: existing.posting_id,
        contentId: existing.content_id,
        company: opts.company ?? existing.company ?? "",
        title: opts.title ?? existing.title ?? "",
        url: opts.url ?? existing.url ?? "",
        applyUrl: opts.applyUrl ?? existing.apply_url ?? "",
        location: opts.location ?? existing.location ?? "",
        remote: opts.remote ?? existing.remote,
        source: opts.source ?? existing.source ?? "",
        postedAt: opts.postedAt ?? existing.posted_at ?? "",
        postingText: opts.postingText ?? "",
        status: opts.status,
        trackLabel: opts.trackLabel ?? existing.track_label ?? undefined,
        dataDir: opts.dataDir,
      });
      slug = String(record.slug);
      changed = true;
    } else if (opts.status !== undefined && opts.status !== "new" && existing.status !== opts.status) {
      setStatus(slug, opts.status, undefined, scope);
      changed = true;
    }
    return { context: readVacancyContext(slug, scope), changed };
  }

  if (!opts.company || !opts.title || !opts.postingText) {
    throw new VacancyStoreError("resolveVacancy requires slug, an existing company/title, or company/title/postingText");
  }

  const record = upsertVacancy({
    postingId: opts.postingId,
    contentId: opts.contentId,
    company: opts.company,
    title: opts.title,
    url: opts.url ?? "",
    applyUrl: opts.applyUrl ?? "",
    location: opts.location ?? "",
    remote: opts.remote,
    source: opts.source ?? "",
    postedAt: opts.postedAt ?? "",
    postingText: opts.postingText,
    status: opts.status,
    trackLabel: opts.trackLabel,
    dataDir: opts.dataDir,
  });
  return { context: readVacancyContext(String(record.slug), scope), changed: true };
}

/** `note` is stored only on a real status transition, and only for an explicitly observed reason. */
export function setStatus(slug: string, status: VacancyStatus, note?: string, scope: VacancyStoreScope = {}): Rec {
  if (!isValidStatus(status)) {
    throw new VacancyStoreError(`status must be one of ${VALID_STATUSES.join(", ")}, got ${JSON.stringify(status)}`);
  }
  const rpath = recordPath(slug, scope);
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

/** Archive visibility is orthogonal to pipeline status. */
export function setArchived(slug: string, archived: boolean, scope: VacancyStoreScope = {}): Rec {
  const rpath = recordPath(slug, scope);
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

/** Copy an existing artifact into a vacancy folder. Fresh generated artifacts should be written there directly. */
export function attachArtifact(slug: string, kind: string, sourcePathStr: string, scope: VacancyStoreScope = {}): { path: string } {
  if (!fs.existsSync(recordPath(slug, scope))) {
    throw new VacancyStoreError(`No vacancy record for slug ${JSON.stringify(slug)}`);
  }
  const source = path.resolve(sourcePathStr.replace(/^~/, process.env.HOME ?? "~"));
  if (!fs.existsSync(source)) {
    throw new VacancyStoreError(`No file at ${source}`);
  }
  const dest = path.join(vacancyDir(slug, scope), `${kind}${path.extname(source)}`);
  fs.copyFileSync(source, dest);
  const record = readYamlRecord(recordPath(slug, scope));
  record.updated_at = now();
  writeYamlRecord(recordPath(slug, scope), record);
  return { path: dest };
}

/** `includeArchived` defaults to false -- an archived vacancy (see `setArchived`) is left out of
 * every normal listing/board render unless a caller explicitly asks to see it too. This is the
 * one place that default lives; `render_board.ts` relies on it rather than filtering again
 * itself. */
export function listVacancies(status?: string, opts: { includeArchived?: boolean; dataDir?: string } = {}): Rec[] {
  if (status !== undefined && !isValidStatus(status)) {
    throw new VacancyStoreError(`status must be one of ${VALID_STATUSES.join(", ")}, got ${JSON.stringify(status)}`);
  }
  const includeArchived = opts.includeArchived ?? false;
  const scope: VacancyStoreScope = { dataDir: opts.dataDir };
  if (!fs.existsSync(dataDir(scope))) return [];
  const summaries: VacancySummary[] = [];
  for (const rpath of listRecordPaths(scope).sort()) {
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

/** CLI fallback for agents without MCP support. Prefer the MCP tools when connected. */
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
      input: { type: "string" },
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
  } else if (command === "record-scout-outcomes") {
    if (!values.input) {
      throw new VacancyStoreError("record-scout-outcomes requires --input <json>");
    }
    const payload = JSON.parse(fs.readFileSync(values.input, "utf-8")) as {
      min_fit_score?: number;
      items?: { candidate: ScoutOutcomeCandidate; fit: ScoutOutcomeFit }[];
    };
    result = (payload.items ?? []).map((item) =>
      recordScoutOutcome({
        candidate: item.candidate,
        fit: item.fit,
        minFitScore: payload.min_fit_score ?? 4,
      })
    );
  } else if (command === "resolve") {
    const status = values.status;
    if (status !== undefined && !isValidStatus(status)) {
      throw new VacancyStoreError(`--status must be one of ${VALID_STATUSES.join(", ")}`);
    }
    const presentString = (value: string | undefined): string | undefined => (value && value.length > 0 ? value : undefined);
    result = resolveVacancy({
      slug: values.slug,
      postingId: values["posting-id"],
      contentId: values["content-id"],
      company: presentString(values.company),
      title: presentString(values.title),
      url: presentString(values.url),
      applyUrl: presentString(values["apply-url"]),
      location: presentString(values.location),
      remote: values.remote,
      source: presentString(values.source),
      postedAt: presentString(values["posted-at"]),
      postingText: presentString(values["posting-text"]),
      status,
      trackLabel: presentString(values["track-label"]),
    });
  } else {
    throw new VacancyStoreError(
      `Unknown command ${JSON.stringify(command)} -- expected one of: mark-seen, upsert, set-status, set-archived, attach-artifact, list, record-scout-outcomes, resolve`
    );
  }

  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  cli();
}
