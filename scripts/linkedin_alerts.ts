#!/usr/bin/env node
/**
 * Deterministic front of `playbooks/scout.md` Step 0.6: LinkedIn Job Alert emails (plain-text
 * bodies the host's email capability read) -> unique job links -> not already known -> prefilter
 * on what the alert shows (title, company, location) -> a short list of jobs whose public page the
 * agent reads next, as in `playbooks/add-from-url.md`. Judges nothing and writes nothing.
 *
 * CLI: `node scripts/dist/linkedin_alerts.js <email-body.txt>... [--sources data/sources.yaml]
 * [--prefilter light|full|off] [--out-file result.json]`. Prefer the `linkedin_alert_intake` MCP tool.
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import * as vacancyStore from "./vacancy_store";
import { Posting, ScoutConfig, loadScoutConfig } from "./scout_domain";
import { collapseDuplicates, filterPostings } from "./scout_prefilter";
import { postingId } from "./posting_ids";
import { REPO_ROOT } from "./repo_paths";

const DEFAULT_SOURCES_PATH = path.join(REPO_ROOT, "data", "sources.yaml");
const DEFAULT_CAP = 25;

export interface AlertJob {
  job_id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  badges: string[];
}

export interface ParsedAlert {
  alert_name: string | null;
  jobs: AlertJob[];
  /** ids in the email's own "See all jobs" link -- a cross-check on the parse, not a source */
  listed_ids: string[];
}

const SEPARATOR = /^-{20,}$/;
const BADGE = [
  /^\d+\s+(?:connections?|school alumni|alumni|company alumni)\b/i,
  /^This company is actively hiring$/i,
  /^Apply with resume & profile$/i,
  /^Easy Apply$/i,
  /^Be an early applicant$/i,
  /^\d+\s+applicants?\b/i,
  /^Actively (?:recruiting|hiring)$/i,
];

export function canonicalJobUrl(jobId: string): string {
  return `https://www.linkedin.com/jobs/view/${jobId}/`;
}

function jobIdFromUrl(url: string): string | null {
  return /\/jobs\/view\/(\d+)/.exec(url)?.[1] ?? /jobid_(\d+)/.exec(url)?.[1] ?? null;
}

/** One alert email's plain-text body. Every job card is `title / company / location / badges... /
 * View job: <url>`, cards separated by a dashed line; the header and footer carry no `View job:`. */
export function parseAlertEmail(body: string): ParsedAlert {
  const text = body.replace(/\r\n?/g, "\n");
  const alertName = /Your job alert for (.+?)Manage your job alerts:/s.exec(text)?.[1]?.trim() ?? null;
  const listed = /originToLandingJobPostings=([\d,]+)/.exec(text)?.[1];
  const jobs: AlertJob[] = [];
  let card: string[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (SEPARATOR.test(line)) {
      card = [];
      continue;
    }
    const view = /^View job:\s*(\S+)/.exec(line);
    if (!view) {
      if (line && !line.startsWith("Your job alert for")) card.push(line);
      continue;
    }
    const jobId = jobIdFromUrl(view[1]!);
    const [title = "", company = "", third = ""] = card;
    if (jobId && title) {
      const hasLocation = third !== "" && !BADGE.some((re) => re.test(third));
      jobs.push({
        job_id: jobId,
        title,
        company,
        location: hasLocation ? third : "",
        url: canonicalJobUrl(jobId),
        badges: card.slice(hasLocation ? 3 : 2),
      });
    }
    card = [];
  }
  return { alert_name: alertName, jobs, listed_ids: listed ? listed.split(",").filter(Boolean) : [] };
}

export interface IntakeJob extends AlertJob {
  alerts: string[];
  emails: number;
}

export interface IntakeResult {
  jobs_to_read: IntakeJob[];
  emails_parsed: number;
  emails_without_jobs: number;
  jobs_listed: number;
  unique_jobs: number;
  /** ids an email's "See all jobs" link names that no card in that email produced */
  unparsed_ids: number;
  already_known: number;
  survived_prefilter: number;
  collapsed: number;
  returned: number;
  capped: number;
  prefilter: string;
}

/** `light` (default): title/hard excludes and the location gate -- LinkedIn already matched the
 * candidate's profile. `full`: also the scout's track/role-signal rule. `off`: nothing. */
export type PrefilterMode = "light" | "full" | "off";

export interface TriageOptions {
  config?: ScoutConfig | null;
  isKnown?: (jobId: string) => boolean;
  prefilter?: PrefilterMode;
}

/** Pure core: merges parsed alerts, drops known jobs, applies the scout's prefilter to what the
 * alert shows (no description yet), collapses same-role repeats, caps at `maxJudgmentsPerRun`. */
export function triage(alerts: ParsedAlert[], opts: TriageOptions = {}): IntakeResult {
  const unique = new Map<string, IntakeJob>();
  let listed = 0;
  let unparsed = 0;
  for (const alert of alerts) {
    listed += alert.jobs.length;
    const parsedIds = new Set(alert.jobs.map((j) => j.job_id));
    unparsed += alert.listed_ids.filter((id) => !parsedIds.has(id)).length;
    for (const job of alert.jobs) {
      const merged = unique.get(job.job_id);
      if (merged) {
        merged.emails += 1;
        if (alert.alert_name && !merged.alerts.includes(alert.alert_name)) merged.alerts.push(alert.alert_name);
      } else {
        unique.set(job.job_id, { ...job, alerts: alert.alert_name ? [alert.alert_name] : [], emails: 1 });
      }
    }
  }

  const isKnown = opts.isKnown ?? (() => false);
  const fresh = [...unique.values()].filter((job) => !isKnown(job.job_id));
  const alreadyKnown = unique.size - fresh.length;

  const config = opts.config ?? null;
  const mode = opts.prefilter ?? "light";
  const applyPrefilter = mode !== "off" && config !== null;
  const byUrl = new Map(fresh.map((job) => [job.url, job]));
  let postings = fresh.map(
    (job) =>
      new Posting({
        source: "linkedin",
        company: job.company,
        title: job.title,
        location: job.location,
        remote: /\bremote\b/i.test(job.location),
        url: job.url,
        applyUrl: job.url,
        description: "",
        postedAt: "",
      })
  );
  if (applyPrefilter) postings = filterPostings(postings, config!, { trackRule: mode === "full" });
  const survived = postings.length;
  const deduped = collapseDuplicates(postings);
  const cap = config?.maxJudgmentsPerRun ?? DEFAULT_CAP;
  const returned = deduped.slice(0, cap).map((p) => byUrl.get(p.url)!);

  return {
    jobs_to_read: returned,
    emails_parsed: alerts.length,
    emails_without_jobs: alerts.filter((a) => a.jobs.length === 0).length,
    jobs_listed: listed,
    unique_jobs: unique.size,
    unparsed_ids: unparsed,
    already_known: alreadyKnown,
    survived_prefilter: survived,
    collapsed: survived - deduped.length,
    returned: returned.length,
    capped: deduped.length - returned.length,
    prefilter: mode === "off" ? "off (asked)" : config === null ? "off (no sources.yaml)" : mode,
  };
}

/** Known = already in the seen ledger under any URL spelling a past flow used, or already a
 * vacancy record (archived included) whose url mentions the job id. */
function loadKnown(): (jobId: string) => boolean {
  const [seenPostingIds] = vacancyStore.readSeenIds();
  const recorded = new Set<string>();
  for (const record of vacancyStore.listVacancies(undefined, { includeArchived: true })) {
    for (const field of [record.url, record.apply_url]) {
      const id = typeof field === "string" ? /\/jobs\/view\/(\d+)/.exec(field)?.[1] : undefined;
      if (id) recorded.add(id);
    }
  }
  return (jobId) => {
    if (recorded.has(jobId)) return true;
    const bare = `linkedin.com/jobs/view/${jobId}`;
    return ["https://www.", "https://", "http://www."].some((prefix) =>
      ["", "/"].some((tail) =>
        ["linkedin", "manual"].some((source) => seenPostingIds.has(postingId(source, `${prefix}${bare}${tail}`)))
      )
    );
  };
}

export function runAlertIntake(bodies: string[], opts: { sourcesPath?: string; prefilter?: PrefilterMode } = {}): IntakeResult {
  let config: ScoutConfig | null = null;
  try {
    config = loadScoutConfig(opts.sourcesPath ?? DEFAULT_SOURCES_PATH);
  } catch {
    config = null;
  }
  return triage(bodies.map(parseAlertEmail), { config, isKnown: loadKnown(), prefilter: opts.prefilter });
}

function main(): void {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { sources: { type: "string" }, prefilter: { type: "string" }, "out-file": { type: "string" } },
  });
  if (positionals.length === 0) {
    console.error("Usage: node scripts/dist/linkedin_alerts.js <email-body.txt>... [--sources ...] [--prefilter light|full|off]");
    process.exit(1);
  }
  if (values.prefilter && !["light", "full", "off"].includes(values.prefilter)) {
    console.error("--prefilter must be light, full or off");
    process.exit(1);
  }
  const bodies = positionals.map((file) => fs.readFileSync(path.resolve(file), "utf-8"));
  const result = runAlertIntake(bodies, {
    sourcesPath: values.sources ? path.resolve(values.sources) : undefined,
    prefilter: values.prefilter as PrefilterMode | undefined,
  });
  const json = JSON.stringify(result, null, 2);
  if (values["out-file"]) {
    const outPath = path.resolve(values["out-file"]);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json + "\n", "utf-8");
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(json);
  }
}

if (require.main === module) {
  main();
}
