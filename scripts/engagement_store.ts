#!/usr/bin/env node
/**
 * Storage for commercial engagements (a marketplace job, a client project) the candidate asked to
 * assess -- the sibling of `vacancy_store.ts` for the Engagement opportunity type. See
 * `_sb/concept.md`: an engagement is a distinct entity from a vacancy, so it gets its own `data/`
 * root (`data/engagements/<slug>/`), not folders mixed into `data/vacancies/`.
 *
 * Deliberately thin. The pipeline skeleton -- a per-engagement folder, `record.yaml` with
 * `status`/`status_history`/`archived`, a status lifecycle -- is identical to a vacancy's, so the
 * generic operations (`setStatus`, `setArchived`, `attachArtifact`) are re-exported from
 * `vacancy_store.ts` bound to the engagement data dir via its existing `scope: { dataDir }` seam,
 * and engagements share `VALID_STATUSES`. What's engagement-specific is small and lives here:
 * `upsertEngagement`'s record shape (client / fit / judged_at, not company / eligibility / track) and
 * `listEngagements`. Judgment fields beyond the ones below (budget, buyer quality, competition)
 * are provisional -- they grow as real runs show which are load-bearing, then a schema.
 *
 * Usage: node scripts/dist/engagement_store.js
 *   <upsert|set-status|set-archived|attach-artifact|list>  ...same flags as vacancy_store.js...
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { parseArgs } from "util";
import { REPO_ROOT } from "./repo_paths";
import * as postingIds from "./posting_ids";
import { VALID_STATUSES, VacancyStoreError, makeSlug, setStatus, setArchived, attachArtifact } from "./vacancy_store";

function isValidStatus(value: string): boolean {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

export const ENGAGEMENTS_DIR = path.join(REPO_ROOT, "data", "engagements");

type Rec = Record<string, any>;

function now(): string {
  return new Date().toISOString();
}

/** Every function takes an optional `dataDir` so tests can point at a throwaway directory, the
 * same seam `vacancy_store`'s `scope: { dataDir }` gives the vacancy side. Production callers omit
 * it and get `ENGAGEMENTS_DIR`. */
function baseDir(dataDir?: string): string {
  return dataDir ?? ENGAGEMENTS_DIR;
}
function engagementDir(slug: string, dataDir?: string): string {
  return path.join(baseDir(dataDir), slug);
}
function recordPath(slug: string, dataDir?: string): string {
  return path.join(engagementDir(slug, dataDir), "record.yaml");
}
function readRecord(rpath: string): Rec {
  return (yaml.load(fs.readFileSync(rpath, "utf-8")) ?? {}) as Rec;
}
function writeRecord(rpath: string, record: Rec): void {
  fs.writeFileSync(rpath, yaml.dump(record, { lineWidth: 100, sortKeys: false }), "utf-8");
}

/** Slug of an existing engagement whose record matches `client` + `title` (case-insensitive), or
 * null. The fallback identity when a re-upsert arrives without the URL or posting text. */
function findEngagementByClientTitle(client: string, title: string, dataDir?: string): string | null {
  const dir = baseDir(dataDir);
  if (!fs.existsSync(dir)) return null;
  const c = (client ?? "").trim().toLowerCase();
  const t = title.trim().toLowerCase();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const rpath = path.join(dir, entry.name, "record.yaml");
    if (!fs.existsSync(rpath)) continue;
    const record = readRecord(rpath);
    if (String(record.client ?? "").trim().toLowerCase() === c && String(record.title ?? "").trim().toLowerCase() === t) {
      return record.slug ?? entry.name;
    }
  }
  return null;
}

export interface UpsertEngagementOptions {
  client: string;
  title: string;
  url?: string;
  source?: string;
  postingText?: string;
  judgedAt?: string;
  fitScore?: number;
  fitCategory?: string;
  fitReason?: string;
  status?: string;
  dataDir?: string;
}

/** Create or update an engagement folder. The slug is `client-title-<hash>`, the hash from the
 * same `posting_ids` helper the vacancy manual-paste path uses -- so a re-judge of the same
 * posting lands on the same folder. Client may be empty on a marketplace posting; the title then
 * carries the slug alone. */
export function upsertEngagement(opts: UpsertEngagementOptions): Rec {
  if (!opts.title || !opts.title.trim()) {
    throw new VacancyStoreError("upsertEngagement requires a title");
  }
  if (opts.status !== undefined && !isValidStatus(opts.status)) {
    throw new VacancyStoreError(`status must be one of ${VALID_STATUSES.join(", ")}, got ${JSON.stringify(opts.status)}`);
  }
  // Re-judging an engagement (Step 4 of engagement-fitment.md) often re-calls this without the posting
  // text, so key off an existing client+title match first -- otherwise a text-less second call
  // computes a different content hash and forks a duplicate folder.
  const existingSlug = findEngagementByClientTitle(opts.client, opts.title, opts.dataDir);
  const [postingId] = postingIds.manualIds(opts.client, opts.title, opts.postingText ?? "", opts.url ?? "");
  const slug = existingSlug ?? makeSlug(opts.client || "engagement", opts.title, postingId);
  const dir = engagementDir(slug, opts.dataDir);
  const rpath = recordPath(slug, opts.dataDir);
  const nowStr = now();

  let record: Rec;
  if (fs.existsSync(rpath)) {
    record = readRecord(rpath);
  } else {
    const initialStatus = opts.status ?? "new";
    record = {
      slug,
      status: initialStatus,
      status_history: [{ status: initialStatus, at: nowStr }],
      created_at: nowStr,
    };
  }

  Object.assign(record, {
    client: opts.client ?? "",
    title: opts.title,
    url: opts.url ?? "",
    source: opts.source || record.source || "upwork",
    // Set once (first judgment) and preserved -- the board sorts and dates by it. `updated_at`
    // is the "last touched" field; a Step-4 re-upsert to add the fit must not bump judged_at.
    judged_at: opts.judgedAt || record.judged_at || nowStr,
    updated_at: nowStr,
  });
  if (opts.fitScore !== undefined || opts.fitCategory !== undefined || opts.fitReason !== undefined) {
    record.fit = { score: opts.fitScore ?? null, category: opts.fitCategory ?? null, reason: opts.fitReason ?? null };
  } else if (record.fit === undefined) {
    record.fit = { score: null, category: null, reason: null };
  }

  // `new` is an initial state, not an update target for an existing record -- same rule as
  // upsertVacancy.
  if (opts.status !== undefined && opts.status !== "new" && record.status !== opts.status) {
    record.status = opts.status;
    if (!Array.isArray(record.status_history)) record.status_history = [];
    record.status_history.push({ status: opts.status, at: nowStr });
  }
  if (record.status === undefined) record.status = "new";
  if (!Array.isArray(record.status_history)) record.status_history = [{ status: record.status, at: nowStr }];
  if (record.archived === undefined) record.archived = false;

  fs.mkdirSync(dir, { recursive: true });
  if (opts.postingText) fs.writeFileSync(path.join(dir, "posting.md"), opts.postingText, "utf-8");
  writeRecord(rpath, record);
  return record;
}

/** Every engagement folder's record, newest-judged first, for `render_engagement.ts`. Its own
 * scan rather than `vacancy_store.listVacancies` -- an engagement carries `client` / `fit.category`
 * / `judged_at`, not the vacancy summary's `company` / `track_label` / `eligibility`. */
export function listEngagements(opts: { includeArchived?: boolean; dataDir?: string } = {}): Rec[] {
  const dir = baseDir(opts.dataDir);
  if (!fs.existsSync(dir)) return [];
  const includeArchived = opts.includeArchived ?? false;
  const out: Rec[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const rpath = path.join(dir, entry.name, "record.yaml");
    if (!fs.existsSync(rpath)) continue;
    const record = readRecord(rpath);
    if (!includeArchived && record.archived) continue;
    const files = fs
      .readdirSync(path.join(dir, entry.name), { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .sort();
    const fit = record.fit ?? {};
    out.push({
      slug: record.slug ?? entry.name,
      status: record.status ?? "new",
      client: record.client ?? "",
      title: record.title ?? "",
      url: record.url ?? "",
      fit_score: fit.score ?? null,
      fit_category: fit.category ?? null,
      judged_at: record.judged_at ?? "",
      updated_at: record.updated_at ?? "",
      archived: record.archived ?? false,
      files,
    });
  }
  return out.sort((a, b) => String(b.judged_at).localeCompare(String(a.judged_at)));
}

/** An engagement's status lifecycle and archive flag work exactly like a vacancy's, so these are
 * `vacancy_store`'s own logic pointed at `data/engagements/` via its `scope: { dataDir }` seam. */
export const setEngagementStatus = (slug: string, status: string, note?: string, dataDir?: string): Rec =>
  setStatus(slug, status as (typeof VALID_STATUSES)[number], note, { dataDir: baseDir(dataDir) });
export const setEngagementArchived = (slug: string, archived: boolean, dataDir?: string): Rec =>
  setArchived(slug, archived, { dataDir: baseDir(dataDir) });
export const attachEngagementArtifact = (slug: string, kind: string, source: string, dataDir?: string): { path: string } =>
  attachArtifact(slug, kind, source, { dataDir: baseDir(dataDir) });

function renderEngagementFromCli(): void {
  const { renderEngagements } = require("./render_engagement") as typeof import("./render_engagement");
  renderEngagements();
}

function cli(): void {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      client: { type: "string", default: "" },
      title: { type: "string", default: "" },
      url: { type: "string", default: "" },
      source: { type: "string", default: "" },
      "posting-text": { type: "string", default: "" },
      "fit-score": { type: "string" },
      "fit-category": { type: "string" },
      "fit-reason": { type: "string" },
      "judged-at": { type: "string" },
      status: { type: "string" },
      slug: { type: "string" },
      note: { type: "string" },
      kind: { type: "string" },
      path: { type: "string" },
      archived: { type: "string" },
      "include-archived": { type: "boolean" },
    },
  });
  const command = positionals[0];
  let result: unknown;

  if (command === "upsert") {
    if (!values.title) throw new VacancyStoreError("upsert requires --title");
    result = upsertEngagement({
      client: values.client,
      title: values.title,
      url: values.url,
      source: values.source,
      postingText: values["posting-text"],
      judgedAt: values["judged-at"],
      fitScore: values["fit-score"] !== undefined ? Number(values["fit-score"]) : undefined,
      fitCategory: values["fit-category"],
      fitReason: values["fit-reason"],
      status: values.status,
    });
    renderEngagementFromCli();
  } else if (command === "set-status") {
    if (!values.slug || !values.status) throw new VacancyStoreError("set-status requires --slug and --status");
    result = setEngagementStatus(values.slug, values.status, values.note);
    renderEngagementFromCli();
  } else if (command === "set-archived") {
    if (!values.slug || (values.archived !== "true" && values.archived !== "false")) {
      throw new VacancyStoreError("set-archived requires --slug and --archived true|false");
    }
    result = setEngagementArchived(values.slug, values.archived === "true");
    renderEngagementFromCli();
  } else if (command === "attach-artifact") {
    if (!values.slug || !values.kind || !values.path) {
      throw new VacancyStoreError("attach-artifact requires --slug, --kind, --path");
    }
    // No re-render here -- matches `vacancy_store.js attach-artifact` and the `engagement_attach_artifact`
    // MCP tool, both of which leave the board to the next status/upsert call.
    result = attachEngagementArtifact(values.slug, values.kind, values.path);
  } else if (command === "list") {
    result = listEngagements({ includeArchived: values["include-archived"] });
  } else {
    throw new VacancyStoreError(
      `Unknown command ${JSON.stringify(command)} -- expected: upsert, set-status, set-archived, attach-artifact, list`
    );
  }
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  cli();
}
