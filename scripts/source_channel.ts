/**
 * `record.source` is the discovery channel, one canonical value per channel so it can be grouped
 * on: a scout fetcher's own name (`djinni`, `douua`, `workable`, ...), or `linkedin`,
 * `jack-n-jill`, `recruiter` (they reached out to the candidate), `manual`, `other`; `""` when unknown. Anything richer someone typed
 * ("LinkedIn Job Alert / Djinni") is kept, untouched, in `source_detail` -- nothing is lost.
 */

export function normalizeSource(raw: string | null | undefined): { source: string; detail: string | null } {
  const text = (raw ?? "").trim();
  if (!text) return { source: "", detail: null };
  const lower = text.toLowerCase();
  let channel: string;
  if (lower === "dou") return { source: "douua", detail: null }; // just another spelling
  if (/^[a-z0-9]+$/.test(lower)) channel = lower; // already a bare channel name
  else if (lower.includes("recruiter")) channel = "recruiter"; // they reached out -- wins over "via LinkedIn"
  else if (lower.includes("linkedin")) channel = "linkedin";
  else if (/jack[- ]?n[- ]?jill/.test(lower)) channel = "jack-n-jill";
  else if (/^(manual|ad-hoc|web-fallback)/.test(lower)) channel = "manual";
  else channel = "other";
  return { source: channel, detail: channel === lower ? null : text };
}
