/**
 * Shared posting-identity hashes. Used by both `scout_domain.ts`'s `Posting` (the scout's fetch
 * pipeline) and `vacancy_store.ts`'s manual-paste path (`manualIds`, for a posting a candidate
 * pastes by hand rather than the scout finding), so the SAME posting hashes identically no matter
 * which one computed it -- a candidate manually pasting a posting the scout already saw (or a
 * scout run later finding one the candidate already pasted and tracked) is recognized as the same
 * posting via a matching `contentId`, not silently duplicated.
 *
 * Lives in its own module rather than in `scout_domain.ts` or `vacancy_store.ts` directly: neither
 * should depend on the other (`scout_domain` is the fetch/prefilter layer, `vacancy_store` is the
 * storage layer -- storage depending on fetch, or vice versa, would be backwards either way), and
 * this is the one thing both genuinely need to agree on bit-for-bit.
 *
 * Ported from Python's `hashlib.blake2s(..., digest_size=8)`. This exact digest algorithm and
 * 8-byte length is load-bearing: every id already persisted in `data/vacancies/<slug>/record.yaml`
 * and `seen.jsonl` was computed this way, and a mismatch would silently make every previously-seen
 * posting look new again. See `posting_ids.test.ts` for the fixture check against real on-disk
 * ids, run before this ever replaces the Python original.
 */

// Pinned to @noble/hashes v1 (not the current v2) deliberately: v2 dropped CommonJS entirely
// (ESM-only exports), which this CommonJS project can't `require()`. Making it work would mean
// migrating the whole project to ESM -- among other things, `__dirname` (repo_paths.ts) would
// need `import.meta.dirname`, which needs Node 20.11+, silently raising the minimum Node version
// this bootstrap chain promises to work on ("assume nothing about the target machine" was the
// whole point of the earlier bootstrap-hardening work). Not worth that tradeoff for a minor-
// version dependency bump; v1's blake2s output is what's verified byte-identical against the
// real on-disk ids anyway (see posting_ids.test.ts) -- v2's hash algorithm itself didn't change,
// only its module format, so there's no correctness reason to move off v1 here.
// "/blake2s" itself is deprecated within v1 (re-exports from "/blake2", the consolidated
// blake2b+blake2s module its own d.ts tells you to use instead) -- importing from "/blake2"
// directly silences that without changing anything about the actual algorithm/output.
import { blake2s } from "@noble/hashes/blake2";
import { utf8ToBytes } from "@noble/hashes/utils";

function hex8(input: string): string {
  return Buffer.from(blake2s(utf8ToBytes(input), { dkLen: 8 })).toString("hex");
}

/** Stable per-URL dedup key -- (source, url) is unique enough to identify *one listing*.
 * Hashed rather than used raw as a dict/file key: short, filesystem/YAML-key friendly, and
 * never leaks the raw URL into a saved record.
 *
 * NOT enough on its own to catch the same role republished under several URLs -- e.g. one
 * remote listing reposted once per country to widen reach, fully copy-pasted description, only
 * location differing. See `contentId()` for the dedup key that catches that. */
export function postingId(source: string, url: string): string {
  return hex8(`${source}:${url}`);
}

/** Dedup key for "is this the same role, regardless of URL/location" -- catches a posting
 * republished under several different URLs (one per country/region for a remote role is the
 * common case), or the same posting arriving once via the scout and once via a candidate's
 * paste, with identical or near-identical copy. `company` + `title` + `description`,
 * whitespace-collapsed and lowercased, is specific enough for a personal single-user tool
 * without needing fuzzy matching. */
export function contentId(company: string, title: string, description: string): string {
  const normalized = `${company}|${title}|${description}`
    .split(/\s+/)
    .filter((piece) => piece.length > 0)
    .join(" ")
    .toLowerCase();
  return hex8(normalized);
}

/** [postingId, contentId] for a posting pasted by hand, not fetched by the scout. Always
 * uses `contentId()` for the content_id half, same as a scout-fetched posting. For
 * posting_id: if a URL was given, hashes it under source "manual" (a manually-pasted posting
 * from a URL the scout also fetched won't share its exact posting_id, since the scout uses the
 * real source name -- but `contentId` still matches on the shared company/title/description,
 * which is what dedup actually checks first); with no URL at all, posting_id falls back to the
 * same content-based hash, since there's nothing more stable to key on for a bare paste. */
export function manualIds(
  company: string,
  title: string,
  description: string,
  url = ""
): [postingId: string, contentId: string] {
  const cid = contentId(company, title, description);
  const pid = url ? postingId("manual", url) : cid;
  return [pid, cid];
}
