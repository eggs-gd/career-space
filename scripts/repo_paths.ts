/** Shared repo-root resolution. Every script here is compiled from `scripts/*.ts` to
 * `scripts/dist/*.js` (see tsconfig.json), so `__dirname` at runtime is always `scripts/dist` --
 * two levels up from `__dirname` is the repo root, regardless of which script runs. */
import * as path from "path";

export const REPO_ROOT = path.resolve(__dirname, "..", "..");
