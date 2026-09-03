import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as yaml from "js-yaml";
import { makeSlug } from "./vacancy_store";
import { validateWorkspace } from "./workspace_validate";

function tempDataDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "career-space-data-"));
}

function writeYaml(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, yaml.dump(value, { sortKeys: false }), "utf-8");
}

function writeValidVacancy(dataDir: string): string {
  const postingId = "posting-ok-1234567890";
  const slug = makeSlug("Acme", "Staff Engineer", postingId);
  const folder = path.join(dataDir, "vacancies", slug);
  fs.mkdirSync(folder, { recursive: true });
  writeYaml(path.join(folder, "record.yaml"), {
    slug,
    posting_id: postingId,
    content_id: "content-ok",
    company: "Acme",
    title: "Staff Engineer",
    status: "new",
    status_history: [{ status: "new", at: "2026-09-01T10:00:00.000Z" }],
    fit: { score: 8, category: "clean_fit", reason: "Strong overlap." },
    eligibility: { location: { status: "open_remote" } },
  });
  fs.writeFileSync(path.join(folder, "posting.md"), "Staff Engineer\n\nBuild platforms.", "utf-8");
  return slug;
}

test("validateWorkspace accepts a valid minimal data layout", () => {
  const dataDir = tempDataDir();
  writeYaml(path.join(dataDir, "config.yaml"), { shared: { languages: ["English"] } });
  writeYaml(path.join(dataDir, "sources.yaml"), {
    tracks: {
      technical: { kind: "primary", titles: ["staff engineer"] },
    },
    feeds: ["remoteok"],
    companies: [{ name: "Acme", ats: "greenhouse", slug: "acme" }],
    min_fit_score: 4,
  });
  writeValidVacancy(dataDir);
  fs.mkdirSync(path.join(dataDir, "surfaces", "linkedin"), { recursive: true });
  fs.writeFileSync(path.join(dataDir, "surfaces", "linkedin", "context.md"), "# LinkedIn\n", "utf-8");
  fs.mkdirSync(path.join(dataDir, "cv"), { recursive: true });
  fs.writeFileSync(path.join(dataDir, "cv", "universal-technical.md"), "# CV\n", "utf-8");

  const result = validateWorkspace({ dataDir });
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test("validateWorkspace reports deterministic layout and schema issues", () => {
  const dataDir = tempDataDir();
  writeYaml(path.join(dataDir, "config.yaml"), { shared: {}, linkedin: {} });
  writeYaml(path.join(dataDir, "sources.yaml"), {
    tracks: {
      broken: { kind: "sideways" },
    },
    feeds: ["unknownfeed"],
    companies: [{ name: "Acme", ats: "unknownats" }],
    min_fit_score: "not-a-number",
  });

  const folder = path.join(dataDir, "vacancies", "bad-slug");
  fs.mkdirSync(folder, { recursive: true });
  writeYaml(path.join(folder, "record.yaml"), {
    slug: "other-slug",
    posting_id: "posting-bad",
    content_id: "content-bad",
    company: "Acme",
    title: "Broken",
    status: "teleported",
    status_history: {},
    fit: { score: 12 },
    eligibility: { location: { status: "moon_base" } },
  });
  fs.mkdirSync(path.join(dataDir, "surfaces", "missing-context"), { recursive: true });
  fs.mkdirSync(path.join(dataDir, "cv"), { recursive: true });
  fs.writeFileSync(path.join(dataDir, "cv", "acme-specific.md"), "# Wrong place\n", "utf-8");

  const result = validateWorkspace({ dataDir });
  const codes = new Set(result.issues.map((item) => item.code));

  assert.equal(result.ok, false);
  for (const expected of [
    "config_top_level_key",
    "sources_track_kind",
    "sources_track_titles_missing",
    "sources_unknown_feed",
    "sources_company_required",
    "sources_unknown_ats",
    "sources_min_fit_score",
    "vacancy_slug_mismatch",
    "vacancy_status",
    "vacancy_status_history",
    "vacancy_fit_score",
    "vacancy_location_status",
    "vacancy_missing_posting",
    "surface_missing_context",
    "cv_non_universal_file",
  ]) {
    assert.equal(codes.has(expected), true, `expected ${expected}`);
  }
});
