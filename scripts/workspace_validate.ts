#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { parseArgs } from "util";
import { isLocationEligibilityStatus } from "./eligibility";
import { TRACK_KIND_FALLBACK, TRACK_KIND_PRIMARY, loadScoutConfig } from "./scout_domain";
import { FEED_FETCHERS, PER_COMPANY_FETCHERS } from "./scout_sources";
import { REPO_ROOT } from "./repo_paths";
import { VALID_STATUSES } from "./vacancy_store";

const DEFAULT_DATA_DIR = path.join(REPO_ROOT, "data");

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issue_count: number;
  issues: ValidationIssue[];
}

type Rec = Record<string, unknown>;

function issue(severity: ValidationSeverity, code: string, filePath: string, message: string): ValidationIssue {
  return { severity, code, path: filePath, message };
}

function loadYaml(filePath: string, issues: ValidationIssue[]): Rec | null {
  try {
    const parsed = yaml.load(fs.readFileSync(filePath, "utf-8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      issues.push(issue("error", "yaml_not_mapping", filePath, "YAML document must be a mapping."));
      return null;
    }
    return parsed as Rec;
  } catch (error) {
    issues.push(issue("error", "yaml_parse_failed", filePath, error instanceof Error ? error.message : String(error)));
    return null;
  }
}

function isRecord(value: unknown): value is Rec {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateConfig(dataDir: string, issues: ValidationIssue[]): void {
  const filePath = path.join(dataDir, "config.yaml");
  if (!fs.existsSync(filePath)) return;
  const config = loadYaml(filePath, issues);
  if (config === null) return;
  if (!isRecord(config.shared)) {
    issues.push(issue("error", "config_missing_shared", filePath, "config.yaml must contain a shared mapping."));
  }
  for (const key of Object.keys(config)) {
    if (key !== "shared") {
      issues.push(issue("error", "config_top_level_key", filePath, `config.yaml top-level key must be shared, got ${key}.`));
    }
  }
}

function validateSources(dataDir: string, issues: ValidationIssue[]): void {
  const filePath = path.join(dataDir, "sources.yaml");
  if (!fs.existsSync(filePath)) return;
  const raw = loadYaml(filePath, issues);
  if (raw === null) return;

  try {
    loadScoutConfig(filePath);
  } catch (error) {
    issues.push(issue("error", "sources_load_failed", filePath, error instanceof Error ? error.message : String(error)));
  }

  const tracks = raw.tracks;
  if (tracks !== undefined && !isRecord(tracks)) {
    issues.push(issue("error", "sources_tracks_shape", filePath, "tracks must be a mapping."));
  } else if (isRecord(tracks)) {
    for (const [key, value] of Object.entries(tracks)) {
      if (!isRecord(value)) {
        issues.push(issue("error", "sources_track_shape", filePath, `tracks.${key} must be a mapping.`));
        continue;
      }
      const kind = value.kind ?? TRACK_KIND_PRIMARY;
      if (kind !== TRACK_KIND_PRIMARY && kind !== TRACK_KIND_FALLBACK) {
        issues.push(issue("error", "sources_track_kind", filePath, `tracks.${key}.kind must be primary or fallback.`));
      }
      if (!Array.isArray(value.titles)) {
        issues.push(issue("warning", "sources_track_titles_missing", filePath, `tracks.${key}.titles is missing or not an array.`));
      }
    }
  }

  if (Array.isArray(raw.feeds)) {
    const allowedFeeds = new Set(Object.keys(FEED_FETCHERS));
    for (const feed of raw.feeds) {
      const normalized = String(feed).trim().toLowerCase();
      if (!allowedFeeds.has(normalized)) {
        issues.push(issue("error", "sources_unknown_feed", filePath, `Unknown feed ${JSON.stringify(feed)}.`));
      }
    }
  }

  if (Array.isArray(raw.companies)) {
    const allowedAts = new Set(Object.keys(PER_COMPANY_FETCHERS));
    raw.companies.forEach((entry, index) => {
      if (!isRecord(entry)) {
        issues.push(issue("error", "sources_company_shape", filePath, `companies[${index}] must be a mapping.`));
        return;
      }
      for (const required of ["name", "ats", "slug"]) {
        if (!(required in entry)) {
          issues.push(issue("error", "sources_company_required", filePath, `companies[${index}] missing ${required}.`));
        }
      }
      if (typeof entry.ats === "string" && !allowedAts.has(entry.ats)) {
        issues.push(issue("error", "sources_unknown_ats", filePath, `companies[${index}].ats is not supported.`));
      }
    });
  }

  if (raw.min_fit_score !== undefined && !Number.isFinite(Number(raw.min_fit_score))) {
    issues.push(issue("error", "sources_min_fit_score", filePath, "min_fit_score must be numeric."));
  }
}

function validateVacancyRecord(folder: string, filePath: string, issues: ValidationIssue[]): void {
  const record = loadYaml(filePath, issues);
  if (record === null) return;
  const slug = path.basename(folder);

  if (record.slug !== slug) {
    issues.push(issue("error", "vacancy_slug_mismatch", filePath, `record slug must match folder name ${slug}.`));
  }
  for (const required of ["posting_id", "content_id", "company", "title", "status", "status_history"]) {
    if (!(required in record)) {
      issues.push(issue("error", "vacancy_required_key", filePath, `record.yaml missing ${required}.`));
    }
  }
  if (typeof record.status === "string" && !(VALID_STATUSES as readonly string[]).includes(record.status)) {
    issues.push(issue("error", "vacancy_status", filePath, `Invalid status ${record.status}.`));
  }
  if (!Array.isArray(record.status_history)) {
    issues.push(issue("error", "vacancy_status_history", filePath, "status_history must be an array."));
  }

  const fit = record.fit;
  if (fit !== undefined) {
    if (!isRecord(fit)) {
      issues.push(issue("error", "vacancy_fit_shape", filePath, "fit must be a mapping."));
    } else if (fit.score !== undefined && fit.score !== null) {
      const score = Number(fit.score);
      if (!Number.isInteger(score) || score < 1 || score > 10) {
        issues.push(issue("error", "vacancy_fit_score", filePath, "fit.score must be an integer from 1 to 10."));
      }
    }
  }

  const eligibility = record.eligibility;
  if (isRecord(eligibility) && isRecord(eligibility.location)) {
    const status = eligibility.location.status;
    if (typeof status !== "string" || !isLocationEligibilityStatus(status)) {
      issues.push(issue("error", "vacancy_location_status", filePath, "eligibility.location.status is invalid."));
    }
  }

  if (!fs.existsSync(path.join(folder, "posting.md"))) {
    issues.push(issue("error", "vacancy_missing_posting", path.join(folder, "posting.md"), "Vacancy folder must contain posting.md."));
  }
}

function validateVacancies(dataDir: string, issues: ValidationIssue[]): void {
  const vacanciesDir = path.join(dataDir, "vacancies");
  if (!fs.existsSync(vacanciesDir)) return;
  for (const entry of fs.readdirSync(vacanciesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const folder = path.join(vacanciesDir, entry.name);
    const record = path.join(folder, "record.yaml");
    if (!fs.existsSync(record)) {
      issues.push(issue("error", "vacancy_missing_record", record, "Vacancy folder must contain record.yaml."));
      continue;
    }
    validateVacancyRecord(folder, record, issues);
  }
}

function validateCvDir(dataDir: string, issues: ValidationIssue[]): void {
  const cvDir = path.join(dataDir, "cv");
  if (!fs.existsSync(cvDir)) return;
  for (const entry of fs.readdirSync(cvDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    if (!entry.name.startsWith("universal-")) {
      issues.push(issue("warning", "cv_non_universal_file", path.join(cvDir, entry.name), "data/cv should contain universal role-profile CVs."));
    }
  }
}

function validateSurfaces(dataDir: string, issues: ValidationIssue[]): void {
  const surfacesDir = path.join(dataDir, "surfaces");
  if (!fs.existsSync(surfacesDir)) return;
  for (const entry of fs.readdirSync(surfacesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const contextPath = path.join(surfacesDir, entry.name, "context.md");
    if (!fs.existsSync(contextPath)) {
      issues.push(issue("error", "surface_missing_context", contextPath, "Surface folder must contain context.md."));
    }
  }
}

export function validateWorkspace(opts: { dataDir?: string } = {}): ValidationResult {
  const dataDir = opts.dataDir ?? DEFAULT_DATA_DIR;
  const issues: ValidationIssue[] = [];
  validateConfig(dataDir, issues);
  validateSources(dataDir, issues);
  validateVacancies(dataDir, issues);
  validateCvDir(dataDir, issues);
  validateSurfaces(dataDir, issues);
  return {
    ok: !issues.some((item) => item.severity === "error"),
    issue_count: issues.length,
    issues,
  };
}

function main(): void {
  const { values } = parseArgs({ options: { data: { type: "string" } } });
  const result = validateWorkspace({ dataDir: values.data ? path.resolve(values.data) : undefined });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

if (require.main === module) {
  main();
}
