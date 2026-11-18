/**
 * One stable key per job listing, whatever the link around it looks like. The same Djinni job
 * arrives as `djinni.co/jobs/857012-cto-igaming-platformi/`, with a `?utm_source=` tail or without
 * the slug, and a conversation on Djinni only knows the number. Matching a thread, an alias or a
 * second sighting to a vacancy record goes through this key, never through string equality.
 */

/** `djinni:<id>`, `dou:<id>`, `linkedin:<id>`, otherwise `host/path` without query, hash, `www.`
 * or a trailing slash. Empty string for an empty input. */
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
  if (host.endsWith("linkedin.com") && (match = /\/jobs\/view\/(?:[^/]*-)?(\d+)/.exec(url.pathname))) {
    return `linkedin:${match[1]}`;
  }
  return `${host}${url.pathname.replace(/\/+$/, "")}`.toLowerCase();
}

/** The Djinni job id inside a Djinni job URL, or null. */
export function djinniJobId(rawUrl: string): number | null {
  const key = jobKey(rawUrl);
  return key.startsWith("djinni:") ? Number(key.slice("djinni:".length)) : null;
}
