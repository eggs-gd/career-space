/**
 * One stable key per job listing, whatever the link around it looks like. The same Djinni job
 * arrives as `djinni.co/jobs/857012-cto-igaming-platformi/`, with a `?utm_source=` tail or without
 * the slug, and a conversation on Djinni only knows the number. Matching a thread, an alias or a
 * second sighting to a vacancy record goes through this key, never through string equality.
 */

import { compareText, trimEndChar } from "./text_utils";

/** `djinni:<id>`, `dou:<id>`, `linkedin:<id>`, otherwise `host/path` plus the query parameters that
 * may identify the job (tracking parameters, the hash, `www.` and a trailing slash are dropped). Empty string for an empty input. */
export function jobKey(rawUrl: string): string {
  const text = (rawUrl ?? "").trim();
  if (!text) return "";
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return text.toLowerCase();
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  let match: RegExpExecArray | null;
  if ((host === "djinni.co" || host.endsWith(".djinni.co")) && (match = /^\/jobs\/(\d+)/.exec(url.pathname))) {
    return `djinni:${match[1]}`;
  }
  if (host === "jobs.dou.ua" && (match = /\/vacancies\/(\d+)/.exec(url.pathname))) {
    return `dou:${match[1]}`;
  }
  if ((host === "linkedin.com" || host.endsWith(".linkedin.com")) && (match = /\/jobs\/view\/(?:[^/]*-)?(\d+)/.exec(url.pathname))) {
    return `linkedin:${match[1]}`;
  }
  // Any other site: host, path and the query parameters that may identify the job (`gh_jid`,
  // `jobId`, ...). Only tracking parameters are dropped, so two jobs on one careers page stay two.
  const kept = [...url.searchParams.entries()]
    .filter(([name]) => !isTrackingParam(name))
    .map(([name, value]) => `${name.toLowerCase()}=${value}`)
    .sort(compareText);
  return `${host}${trimEndChar(url.pathname, "/")}${kept.length > 0 ? `?${kept.join("&")}` : ""}`.toLowerCase();
}

const TRACKING_PARAMS = new Set([
  "gh_src", "trk", "trackingid", "refid", "ref", "referrer", "source", "src", "fbclid", "gclid", "msclkid",
  "mc_cid", "mc_eid", "lever-source", "lever-origin", "ss", "ccuid", "li_fat_id",
]);

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith("utm_") || TRACKING_PARAMS.has(lower);
}

/** The Djinni job id inside a Djinni job URL, or null. */
export function djinniJobId(rawUrl: string): number | null {
  const key = jobKey(rawUrl);
  return key.startsWith("djinni:") ? Number(key.slice("djinni:".length)) : null;
}
