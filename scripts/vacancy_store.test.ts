/**
 * Two kinds of coverage here, deliberately kept separate:
 *
 * - Against `scripts/fixtures/legacy-record.yaml` (synthetic, committed, always present) --
 *   a record can carry a microsecond-precision timestamp with an explicit `+00:00` offset (not
 *   every writer of `record.yaml` uses the same timestamp format), so this confirms that shape
 *   parses without throwing. Runs on every clone, including a clean OSS one with no `data/` at
 *   all.
 * - Against the real `data/vacancies/` (gitignored, personal, only present on a maintainer's own
 *   machine) -- generic structural checks only (parses, every entry has the expected shape) so
 *   this file never needs a real company/vacancy name baked into committed source to stay useful
 *   -- skipped entirely when `data/` doesn't exist, same as a fresh clone/CI would see.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { DATA_DIR, listVacancies } from "./vacancy_store";
import { REPO_ROOT } from "./repo_paths";

// Not `__dirname` -- at runtime that's `scripts/dist` (where this test itself compiles to), but
// the fixture lives in source (`scripts/fixtures/`), never copied into `dist/` by `tsc`.
const FIXTURE_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "legacy-record.yaml");

test("reads a microsecond-precision '+00:00'-offset timestamp record without throwing", () => {
  const record = yaml.load(fs.readFileSync(FIXTURE_PATH, "utf-8")) as Record<string, any>;
  assert.equal(record.slug, "acme-staff-engineer-a1b2c3d4");
  assert.equal(record.status, "new");
  assert.match(record.updated_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+00:00$/);
  // The actual point: parsing that exact timestamp shape as a JS Date must not throw/NaN --
  // this is what every timestamp-reading code path (rendering.ts's boardUpdatedShort, for one)
  // needs to survive against any record carrying this shape.
  const parsed = new Date(record.updated_at);
  assert.ok(!Number.isNaN(parsed.getTime()), `expected a parseable date, got ${record.updated_at}`);
});

test("listVacancies reads real on-disk data without throwing, when present", { skip: !fs.existsSync(DATA_DIR) }, () => {
  const all = listVacancies();
  assert.ok(Array.isArray(all));
  for (const v of all) {
    assert.equal(typeof v.slug, "string");
    assert.equal(typeof v.status, "string");
    // Same blanket timestamp-shape check as the synthetic fixture above, just against whatever
    // real records actually exist on this machine.
    if (v.updated_at) assert.match(v.updated_at, /^\d{4}-\d{2}-\d{2}T/);
  }
});
