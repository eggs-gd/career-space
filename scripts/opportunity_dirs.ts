/**
 * Where an opportunity folder lives -- `data/vacancies/<slug>/` and `data/engagements/<slug>/`
 * while active, `<root>/_archive/<slug>/` once archived (`record.yaml`'s `archived: true`), so the
 * active list stays short enough to browse for files to attach. Every path to one goes through
 * `opportunityDir`, never `path.join(root, slug)`, so an archived folder is found wherever it is.
 * `_`-prefixed names under a root are reserved (slugs are `[a-z0-9-]`, never start with one).
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

export const ARCHIVE_DIRNAME = "_archive";

/** The folder for `slug`: its active location, else its archived one, else the active location
 * (where a new one would be created). */
export function opportunityDir(root: string, slug: string): string {
  const active = path.join(root, slug);
  if (fs.existsSync(active)) return active;
  const archived = path.join(root, ARCHIVE_DIRNAME, slug);
  return fs.existsSync(archived) ? archived : active;
}

/** Every opportunity folder under `root`, active then archived (absolute paths). */
export function listOpportunityDirs(root: string): string[] {
  const out: string[] = [];
  for (const base of [root, path.join(root, ARCHIVE_DIRNAME)]) {
    if (!fs.existsSync(base)) continue;
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (base === root && entry.name.startsWith("_")) continue;
      out.push(path.join(base, entry.name));
    }
  }
  return out;
}

function homeDir(root: string, slug: string, archived: boolean): string {
  return path.join(archived ? path.join(root, ARCHIVE_DIRNAME) : root, slug);
}

/** Moves `slug`'s folder to where `archived` says it belongs, if it isn't already there. Returns
 * the folder's final path. Throws (moving nothing) if the destination already exists. */
export function moveToHome(root: string, slug: string, archived: boolean): string {
  const current = opportunityDir(root, slug);
  const home = homeDir(root, slug, archived);
  if (current === home || !fs.existsSync(current)) return home;
  if (fs.existsSync(home)) {
    throw new Error(`cannot move ${current} to ${home}: destination already exists`);
  }
  fs.mkdirSync(path.dirname(home), { recursive: true });
  fs.renameSync(current, home);
  return home;
}

export interface Relocation {
  slug: string;
  from: string;
  to: string;
}

/** Finds every folder whose location disagrees with its record's `archived` flag and, with
 * `write`, moves it. Also how existing archived folders get into `_archive/` after the layout
 * change. A destination that already exists is reported as a conflict, never overwritten. */
export function relocateArchived(root: string, write: boolean): { moved: Relocation[]; conflicts: Relocation[] } {
  const moved: Relocation[] = [];
  const conflicts: Relocation[] = [];
  for (const dir of listOpportunityDirs(root)) {
    const recordPath = path.join(dir, "record.yaml");
    if (!fs.existsSync(recordPath)) continue;
    const record = (yaml.load(fs.readFileSync(recordPath, "utf-8")) ?? {}) as Record<string, unknown>;
    const slug = path.basename(dir);
    const home = homeDir(root, slug, record.archived === true);
    if (dir === home) continue;
    if (fs.existsSync(home)) {
      conflicts.push({ slug, from: dir, to: home });
      continue;
    }
    if (write) moveToHome(root, slug, record.archived === true);
    moved.push({ slug, from: dir, to: home });
  }
  return { moved, conflicts };
}
