/**
 * Fetchers for public ATS/job-board feeds. Only public, unauthenticated JSON/RSS APIs -- no
 * scraping, no headless browser, no login. Network/HTTP errors for a single source are
 * swallowed and reported, never fatal to the rest of the run -- one dead company slug or one
 * flaky aggregator should never blank out every other source's results.
 *
 * `fetchAll` runs every configured company board and feed through a bounded worker pool (see
 * `runWithConcurrency`), using Node's built-in `fetch` -- a bad source (dead slug, flaky
 * endpoint) is caught and reported per-task, never stopping the rest.
 */

import { decode as decodeHtmlEntities } from "he";
import { CompanyConfig, Posting, titleHasPhrase } from "./scout_domain";

const TAG_RE = /<[^<>]+>/g;
const WS_RE = /[ \t]+/g;
// "віддалено"/"дистанційно" (Ukrainian for "remotely") added alongside the English words once
// dou.ua/Djinni -- both predominantly Ukrainian-language -- were added as sources; every English
// fetcher's text just never contains these, so no collision risk from keeping the list shared.
//
// Deliberately NOT a bare "distributed" or "anywhere" -- a real, observed false positive from a
// live scout run: an on-site London role (`location` field said so) got mislabeled remote
// because its description happened to say "distributed systems" (plain engineering-architecture
// phrasing, present in most backend JDs regardless of work arrangement) and, separately, "sell
// anywhere" (product marketing copy, describing the product's reach, not the candidate's own
// location). `"work anywhere"`/`"from anywhere"` cover the genuine phrasings ("work from
// anywhere", "we hire from anywhere") without matching either false-positive shape. This mirrors
// `scout_prefilter.ts`'s `REMOTE_SIGNAL_WORDS`, which already excluded bare "distributed" for the
// same reason -- keep the two lists in sync; the same false-positive class can leak through
// either one independently (see that file's own comment for why passesLocationGate checks BOTH
// `Posting.remote`, decided here, and its own separate re-scan of the full text).
const REMOTE_WORDS = ["remote", "work anywhere", "from anywhere", "work from home", "wfh", "віддалено", "дистанційно"];

// Identify honestly.
const HEADERS: Record<string, string> = { "User-Agent": "Mozilla/5.0 (career-space scout; personal job-search tool)" };

export type FetchResult = [postings: Posting[], error: string | null];

export function stripHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  let text = decodeHtmlEntities(raw).replace(TAG_RE, " ");
  text = text.replace(WS_RE, " ");
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

/** Remote is decided by the LOCATION field (what a viewer sees) first; falls back to the
 * description only when there's no location, so a stray "remote" in boilerplate text can't
 * mislabel an on-site role (e.g. "London" or "McLean, VA"). */
function isRemote(location: string | null | undefined, description: string | null | undefined): boolean {
  const loc = (location ?? "").toLowerCase().trim();
  if (loc) return REMOTE_WORDS.some((word) => loc.includes(word));
  return REMOTE_WORDS.some((word) => (description ?? "").toLowerCase().includes(word));
}

/** One retry, after a short fixed backoff, on a transient failure -- a 5xx, or the fetch call
 * itself throwing (timeout/abort, DNS hiccup, connection reset). Not for 4xx: a bad request/auth/
 * not-found is deterministic, retrying just wastes a second. This is the single fetch choke point
 * every source (Greenhouse, JustJoin, ...) goes through, so one retry here covers a feed's whole
 * flaky-endpoint problem without each fetcher needing its own retry logic. */
export async function fetchWithTimeout(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  retryDelayMs = 1_000 // overridden to 0 in tests only; real callers keep the backoff
): Promise<Response> {
  const attempt = async (): Promise<Response> => {
    const response = await fetch(url, {
      headers: { ...HEADERS, ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    }
    return response;
  };
  try {
    return await attempt();
  } catch (error) {
    const httpStatus = error instanceof Error ? Number(/^HTTP (\d{3})/.exec(error.message)?.[1]) : Number.NaN;
    if (httpStatus >= 400 && httpStatus < 500) throw error; // deterministic client error, no retry
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    return attempt();
  }
}

async function getJson(url: string, headers: Record<string, string> = {}, timeoutMs = 20_000): Promise<any> {
  const response = await fetchWithTimeout(url, headers, timeoutMs);
  return response.json();
}

async function getText(url: string, headers: Record<string, string> = {}, timeoutMs = 30_000): Promise<string> {
  const response = await fetchWithTimeout(url, headers, timeoutMs);
  return response.text();
}

interface PostingFields {
  source: string;
  company: string;
  title: string;
  location: string;
  url: string;
  description: string;
  postedAt: string;
  applyUrl?: string;
  remoteOverride?: boolean | null;
}

function makePosting(fields: PostingFields): Posting {
  const remote = fields.remoteOverride ?? isRemote(fields.location, fields.description);
  return new Posting({
    source: fields.source,
    company: fields.company,
    title: (fields.title ?? "").trim(),
    location: (fields.location ?? "").trim(),
    remote,
    url: fields.url || "",
    applyUrl: fields.applyUrl || fields.url || "",
    description: fields.description || "",
    postedAt: fields.postedAt || "",
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ------------------------------------------------------------------ per-company boards

/** Builders shared by a platform's board fetch and its single-posting URL resolver: both read the
 * same payload shape, only the fallback for a missing link differs. */

function leverPosting(job: any, company: string, fallbackUrl: string): Posting {
  const cats = job.categories ?? {};
  const parts = [job.descriptionPlain ?? ""];
  for (const lst of job.lists ?? []) parts.push(stripHtml(lst.content ?? ""));
  parts.push(job.additionalPlain ?? "");
  return makePosting({
    source: "lever",
    company,
    title: job.text ?? "",
    location: [cats.location ?? "", cats.team ?? "", cats.commitment ?? ""].filter(Boolean).join(", "),
    url: job.hostedUrl ?? fallbackUrl,
    description: parts.filter(Boolean).join("\n"),
    postedAt: String(job.createdAt ?? ""),
  });
}

function ashbyPosting(job: any, company: string, fallbackUrl: string): Posting {
  const secondary = (job.secondaryLocations ?? [])
    .map((s: any) => s.location ?? "")
    .filter(Boolean)
    .join(", ");
  return makePosting({
    source: "ashby",
    company,
    title: job.title ?? "",
    location: [job.location ?? "", secondary].filter(Boolean).join(", "),
    url: job.jobUrl ?? fallbackUrl,
    applyUrl: job.applyUrl ?? "",
    description: job.descriptionPlain || stripHtml(job.descriptionHtml ?? ""),
    postedAt: job.publishedAt ?? "",
    remoteOverride: Boolean(job.isRemote || job.workplaceType === "Remote") || null,
  });
}

function recruiteePosting(offer: any, company: string, fallbackUrl: string): Posting {
  return makePosting({
    source: "recruitee",
    company,
    title: offer.title ?? "",
    location: [offer.city, offer.country].filter(Boolean).map(String).join(", "),
    url: offer.careers_url || offer.careers_apply_url || fallbackUrl,
    description: stripHtml(`${offer.description ?? ""} ${offer.requirements ?? ""}`),
    postedAt: String(offer.published_at ?? ""),
    remoteOverride: ["true", "1", "yes"].includes(String(offer.remote ?? "").toLowerCase()) || null,
  });
}

function workablePosting(job: any, fallbackUrl: string): Posting {
  const loc = job.location ?? {};
  const place = [loc.city, loc.subregion, loc.countryName].filter(Boolean).map(String).join(", ");
  const remote = String(job.workplace ?? "").toLowerCase() === "remote";
  const location = remote ? (place ? `Remote, ${place}` : "Remote") : place;
  return makePosting({
    source: "workable",
    company: job.company?.title ?? "?",
    title: job.title ?? "",
    location,
    url: job.url ?? fallbackUrl,
    description: stripHtml([job.description, job.requirementsSection, job.benefitsSection].filter(Boolean).join(" ")),
    postedAt: String(job.published ?? job.created ?? ""),
    remoteOverride: remote ? true : null,
  });
}

function jobicoPosting(job: any, description: string, fallbackUrl: string): Posting {
  const place = [job.city, job.country].filter(Boolean).join(", ");
  const remote = job.locationType === "remote";
  return makePosting({
    source: "jobico",
    company: job.company?.name ?? "?",
    title: job.title ?? "",
    location: remote ? (place ? `Remote, ${place}` : "Remote") : place,
    url: job.url ?? fallbackUrl,
    description,
    postedAt: job.postedAt ?? "",
    remoteOverride: remote,
  });
}

function jobicoDescription(detail: any, techStack: string): string {
  return [detail.description, detail.requirements, detail.niceToHave, detail.responsibilities, techStack]
    .filter(Boolean)
    .join("\n\n");
}

async function fetchGreenhouse(company: CompanyConfig): Promise<FetchResult> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`;
  let data: any;
  try {
    data = await getJson(url);
  } catch (error) {
    return [[], `${company.name} (greenhouse/${company.slug}): ${errorMessage(error)}`];
  }
  const postings = (data.jobs ?? []).map((job: any) =>
    makePosting({
      source: "greenhouse",
      company: company.name,
      title: job.title ?? "",
      location: job.location?.name ?? "",
      url: job.absolute_url ?? "",
      description: stripHtml(job.content ?? ""),
      postedAt: job.updated_at ?? "",
    })
  );
  return [postings, null];
}

async function fetchLever(company: CompanyConfig): Promise<FetchResult> {
  const url = `https://api.lever.co/v0/postings/${company.slug}?mode=json`;
  let data: any;
  try {
    data = await getJson(url);
  } catch (error) {
    return [[], `${company.name} (lever/${company.slug}): ${errorMessage(error)}`];
  }
  const postings = (data as any[]).map((job) => leverPosting(job, company.name, ""));
  return [postings, null];
}

async function fetchAshby(company: CompanyConfig): Promise<FetchResult> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${company.slug}?includeCompensation=true`;
  let data: any;
  try {
    data = await getJson(url);
  } catch (error) {
    return [[], `${company.name} (ashby/${company.slug}): ${errorMessage(error)}`];
  }
  const postings = (data.jobs ?? [])
    .filter((job: any) => job.isListed !== false)
    .map((job: any) => ashbyPosting(job, company.name, ""));
  return [postings, null];
}

async function fetchRecruitee(company: CompanyConfig): Promise<FetchResult> {
  const url = `https://${company.slug}.recruitee.com/api/offers/`;
  let data: any;
  try {
    data = await getJson(url);
  } catch (error) {
    return [[], `${company.name} (recruitee/${company.slug}): ${errorMessage(error)}`];
  }
  const postings = (data.offers ?? []).map((offer: any) => recruiteePosting(offer, company.name, ""));
  return [postings, null];
}

export const PER_COMPANY_FETCHERS: Record<string, (company: CompanyConfig) => Promise<FetchResult>> = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  recruitee: fetchRecruitee,
};

// ------------------------------------------------------------- global, query-driven ATS search
// Workable and SmartRecruiters both expose a public search endpoint spanning every company on
// the platform -- one fetcher covers thousands of employers with no company list to maintain,
// driven by the candidate's own track titles rather than pulled wholesale.

export interface FeedFetchOpts {
  trackTitles: string[];
  roleSignals: string[];
  /** `ScoutConfig.allUaCategories()` -- exact dou.ua/Djinni category values, case preserved. See
   * `fetchDouUa`/`fetchDjinni` and `reference/ua-scout-categories.md`. Defaults to `[]` for
   * every other fetcher, which simply ignores it. */
  uaCategories: string[];
}
type FeedFetcher = (opts: FeedFetchOpts) => Promise<FetchResult>;

function trackQueries(trackTitles: string[], limit = 8): string[] {
  return [...trackTitles].sort((a, b) => b.length - a.length).slice(0, limit);
}

/** Whether a title-only listing is worth an extra detail-fetch call for its real description
 * text -- used by every fetcher (SmartRecruiters, JustJoin, NoFluffJobs) that only gets
 * title+tags from its list endpoint and has to spend a second request per posting for the rest.
 *
 * Checked against BOTH trackTitles and roleSignals, not just trackTitles: the prefilter lets a
 * posting through two independent ways (a track-title match, OR the role_signals-only recall
 * lane for postings like "Founding Engineer" whose title matches no track phrase at all). A
 * detail-fetch gate that only checked trackTitles would correctly skip the extra fetch for
 * postings that never clear the prefilter at all, but would ALSO skip it for a posting that only
 * reaches the prefilter via roleSignals -- degrading it to a title-only stub. Checking both
 * lists is a harmless superset (detail-fetch budgets/page caps still apply) rather than trying
 * to exactly replicate the prefilter's fuller track/strategic-signal logic here, which would
 * need the whole ScoutConfig, not just two string lists. */
function worthDetailFetch(title: string, trackTitles: string[], roleSignals: string[]): boolean {
  const titleL = title.toLowerCase();
  return trackTitles.some((t) => titleHasPhrase(titleL, t)) || roleSignals.some((t) => titleL.includes(t));
}

async function workableQuery(query: string): Promise<FetchResult> {
  const postings: Posting[] = [];
  let token: string | undefined;
  for (let pageNum = 0; pageNum < 2; pageNum++) {
    // 20 postings/page -- 2 pages is plenty for a track query
    let url = "https://jobs.workable.com/api/v1/jobs?query=" + encodeURIComponent(query);
    if (token) url += `&pageToken=${token}`;
    let data: any;
    try {
      data = await getJson(url);
    } catch (fetchError) {
      return [postings, `Workable (${query}): ${errorMessage(fetchError)}`];
    }
    for (const job of data.jobs ?? []) postings.push(workablePosting(job, ""));
    token = data.nextPageToken;
    if (!token) break;
  }
  return [postings, null];
}

async function fetchWorkable({ trackTitles }: FeedFetchOpts): Promise<FetchResult> {
  const queries = trackQueries(trackTitles);
  if (queries.length === 0) return [[], "Workable: no track titles to search with"];
  const postings: Posting[] = [];
  let error: string | null = null;
  for (const query of queries) {
    const [found, queryError] = await workableQuery(query);
    postings.push(...found);
    error = queryError ?? error;
  }
  return [postings, error];
}

/** How many detail fetches a run may still spend. */
interface DetailBudget {
  left: number;
}

async function smartrecruitersJob(job: any, opts: FeedFetchOpts, budget: DetailBudget): Promise<[Posting, string | null]> {
  const company = job.company ?? {};
  const loc = job.location ?? {};
  const locStr = [loc.city, loc.region, (loc.country ?? "").toUpperCase()].filter(Boolean).join(", ");
  const title = job.name ?? "";
  let description = "";
  let error: string | null = null;
  // Relevance gate via worthDetailFetch (trackTitles + roleSignals), not `queries` (the
  // top-8-longest subset trackQueries truncates the search step itself to): a posting's
  // title only needs to contain ONE track title to be worth a detail fetch, but short,
  // common titles ("engineering manager", "head of engineering") are exactly the ones
  // length-truncation drops in favor of longer compound ones -- so a plainly titled posting
  // could be found by search yet never get its real description fetched, silently degrading
  // to a title-only stub downstream.
  const detailUrl = job.actions?.details;
  if (detailUrl && budget.left > 0 && worthDetailFetch(title, opts.trackTitles, opts.roleSignals)) {
    budget.left -= 1;
    try {
      const detail = await getJson(detailUrl);
      const sections = detail.jobAd?.sections ?? {};
      description = stripHtml(
        Object.values(sections)
          .filter((s: any) => s && typeof s === "object")
          .map((s: any) => String(s.text ?? ""))
          .join(" ")
      );
    } catch (detailError) {
      error = `SmartRecruiters detail (${title}): ${errorMessage(detailError)}`;
    }
  }
  const posting = makePosting({
    source: "smartrecruiters",
    company: company.name ?? "?",
    title,
    location: locStr,
    url: job.applyUrl ?? "",
    applyUrl: job.applyUrl ?? "",
    description: description || title,
    postedAt: String(job.releasedDate ?? ""),
    remoteOverride: loc.remote ? true : null,
  });
  return [posting, error];
}

async function fetchSmartrecruiters(opts: FeedFetchOpts): Promise<FetchResult> {
  const queries = trackQueries(opts.trackTitles);
  if (queries.length === 0) return [[], "SmartRecruiters: no track titles to search with"];
  const postings: Posting[] = [];
  let error: string | null = null;
  const budget: DetailBudget = { left: 60 };
  for (const query of queries) {
    const url =
      "https://jobs.smartrecruiters.com/sr-jobs/search?keyword=" + encodeURIComponent(query) + "&limit=100&offset=0";
    let data: any;
    try {
      data = await getJson(url);
    } catch (fetchError) {
      error = `SmartRecruiters (${query}): ${errorMessage(fetchError)}`;
      continue;
    }
    for (const job of data.content ?? []) {
      const [posting, detailError] = await smartrecruitersJob(job, opts, budget);
      postings.push(posting);
      error = detailError ?? error;
    }
  }
  return [postings, error];
}

/** POST helper for jobico.io's endpoint, technically an "MCP server" (`/api/mcp`) but really just
 * JSON-RPC 2.0 over plain HTTP -- confirmed live that `tools/call` works standalone with no prior
 * `initialize` handshake or session, so this needs nothing beyond one POST with `fetch`, the same
 * as every other fetcher here. Scoped to `fetchJobico` below rather than folded into `getJson`
 * above -- every other source is a plain GET, this is the only POST. */
async function postJobicoTool(toolName: string, args: Record<string, unknown>): Promise<any> {
  const response = await fetch("https://jobico.io/api/mcp", {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: toolName, arguments: args } }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText} for jobico ${toolName}`);
  const data: any = await response.json();
  if (data.error) throw new Error(`jobico ${toolName}: ${data.error.message ?? JSON.stringify(data.error)}`);
  return data.result?.structuredContent;
}

/** jobico.io -- Ukrainian IT job platform. Its own docs call `/api/mcp` an "MCP server," but
 * confirmed live it's a plain JSON-RPC-over-HTTP endpoint (see `postJobicoTool` above) -- no MCP
 * SDK, no session, no reason to wire this in as an actual connected MCP server the way its own
 * marketing suggests ("just give the agent a link"). That framing fits an ad-hoc chat search,
 * not this repo's own deterministic fetch/prefilter/dedup/score pipeline, and would just be a
 * second, disconnected way to reach the same data this fetcher already reaches directly --
 * exactly the reasoning that already ruled out adding Djinni's own official MCP server on top of
 * its existing REST fetcher here.
 *
 * `search_jobs`'s `query` param is genuine free-text server-side search -- confirmed by diffing a
 * real query against a nonsense one and getting 0 results back for the latter (unlike Djinni's
 * `primary_keyword`, which silently fell back to an unfiltered feed for anything that wasn't an
 * exact taxonomy match; see that fetcher's own docstring). So this is query-driven by track
 * titles like `fetchWorkable`/`fetchSmartrecruiters`, not category-driven like `fetchDouUa`/
 * `fetchDjinni` -- no `ua_categories` needed, no fixed taxonomy to pick from.
 *
 * `search_jobs` only returns metadata (no description) -- `get_job(slug)` is a second call for
 * the real JD text, gated by `worthDetailFetch` like `fetchJustjoin`/`fetchSmartrecruiters`
 * above, plus a budget cap for the same reason. `locationType` (`"remote"|"hybrid"|"office"`) is
 * a clean, always-present structured field -- used directly as `remoteOverride` in both
 * directions rather than inferred from text, unlike most other sources here. */
async function jobicoJob(job: any, opts: FeedFetchOpts, budget: DetailBudget): Promise<[Posting, string | null]> {
  const title = job.title ?? "";
  const techStack = (job.techStack ?? []).join(" ");
  let description = techStack;
  let error: string | null = null;
  if (budget.left > 0 && worthDetailFetch(title, opts.trackTitles, opts.roleSignals)) {
    budget.left -= 1;
    try {
      description = jobicoDescription(await postJobicoTool("get_job", { slug: job.slug }), techStack);
    } catch (detailError) {
      error = `Jobico detail (${title}): ${errorMessage(detailError)}`;
    }
  }
  return [jobicoPosting(job, description, ""), error];
}

async function fetchJobico(opts: FeedFetchOpts): Promise<FetchResult> {
  const queries = trackQueries(opts.trackTitles);
  if (queries.length === 0) return [[], "Jobico: no track titles to search with"];
  const postings: Posting[] = [];
  let error: string | null = null;
  const budget: DetailBudget = { left: 60 };
  for (const query of queries) {
    let list: any;
    try {
      list = await postJobicoTool("search_jobs", { query, limit: 20 });
    } catch (fetchError) {
      error = `Jobico (${query}): ${errorMessage(fetchError)}`;
      continue;
    }
    for (const job of list.jobs ?? []) {
      const [posting, detailError] = await jobicoJob(job, opts, budget);
      postings.push(posting);
      error = detailError ?? error;
    }
  }
  return [postings, error];
}

export const QUERY_DRIVEN_FETCHERS: Record<string, FeedFetcher> = {
  workable: fetchWorkable,
  smartrecruiters: fetchSmartrecruiters,
  jobico: fetchJobico,
};

// ------------------------------------------------------------------------ aggregator boards

async function fetchRemoteok(): Promise<FetchResult> {
  let data: any;
  try {
    data = await getJson("https://remoteok.com/api");
  } catch (error) {
    return [[], `RemoteOK: ${errorMessage(error)}`];
  }
  const jobs = Array.isArray(data) && data.length > 0 ? data.slice(1) : []; // first item is metadata
  const postings = jobs.map((job: any) =>
    makePosting({
      source: "remoteok",
      company: job.company ?? "?",
      title: job.position ?? "",
      location: job.location || "Remote",
      url: job.url ?? "",
      applyUrl: job.apply_url ?? "",
      description: stripHtml(job.description ?? ""),
      postedAt: String(job.date ?? ""),
      remoteOverride: true,
    })
  );
  return [postings, null];
}

async function fetchRemotive(): Promise<FetchResult> {
  let data: any;
  try {
    data = await getJson("https://remotive.com/api/remote-jobs");
  } catch (error) {
    return [[], `Remotive: ${errorMessage(error)}`];
  }
  const postings = (data.jobs ?? []).map((job: any) =>
    makePosting({
      source: "remotive",
      company: job.company_name ?? "?",
      title: job.title ?? "",
      location: job.candidate_required_location || "Remote",
      url: job.url ?? "",
      description: stripHtml(job.description ?? ""),
      postedAt: String(job.publication_date ?? ""),
      remoteOverride: true,
    })
  );
  return [postings, null];
}

async function fetchArbeitnow(): Promise<FetchResult> {
  let data: any;
  try {
    data = await getJson("https://www.arbeitnow.com/api/job-board-api");
  } catch (error) {
    return [[], `Arbeitnow: ${errorMessage(error)}`];
  }
  const postings = (data.data ?? []).map((job: any) => {
    const description = stripHtml(job.description ?? "") + " " + (job.tags ?? []).join(" ");
    return makePosting({
      source: "arbeitnow",
      company: job.company_name ?? "?",
      title: job.title ?? "",
      location: job.location ?? "",
      url: job.url ?? "",
      description,
      postedAt: String(job.created_at ?? ""),
      remoteOverride: job.remote ? true : null,
    });
  });
  return [postings, null];
}

async function fetchJobicy(): Promise<FetchResult> {
  let data: any;
  try {
    data = await getJson("https://jobicy.com/api/v2/remote-jobs?count=100");
  } catch (error) {
    return [[], `Jobicy: ${errorMessage(error)}`];
  }
  const postings = (data.jobs ?? []).map((job: any) =>
    makePosting({
      source: "jobicy",
      company: job.companyName ?? "?",
      title: job.jobTitle ?? "",
      location: job.jobGeo || "Remote",
      url: job.url ?? "",
      description: stripHtml(job.jobDescription || job.jobExcerpt || ""),
      postedAt: String(job.pubDate ?? ""),
      remoteOverride: true,
    })
  );
  return [postings, null];
}

async function fetchHimalayas(): Promise<FetchResult> {
  let data: any;
  try {
    data = await getJson("https://himalayas.app/jobs/api?limit=100");
  } catch (error) {
    return [[], `Himalayas: ${errorMessage(error)}`];
  }
  const postings = (data.jobs ?? []).map((job: any) =>
    makePosting({
      source: "himalayas",
      company: job.companyName ?? "?",
      title: job.title ?? "",
      location: (job.locationRestrictions ?? []).join(", ") || "Remote",
      url: job.applicationLink ?? "",
      description: stripHtml(job.description || job.excerpt || ""),
      postedAt: String(job.pubDate ?? ""),
      remoteOverride: true,
    })
  );
  return [postings, null];
}

const ITEM_RE = /<item>(.*?)<\/item>/gs;
const RSS_FIELD_NAMES = ["title", "link", "description", "pubDate", "region"] as const;
const FIELD_RE: Record<(typeof RSS_FIELD_NAMES)[number], RegExp> = Object.fromEntries(
  RSS_FIELD_NAMES.map((key) => [key, new RegExp(String.raw`<${key}>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</${key}>`, "s")])
) as any;

async function fetchWeworkremotely(): Promise<FetchResult> {
  let xml: string;
  try {
    xml = await getText("https://weworkremotely.com/remote-jobs.rss");
  } catch (error) {
    return [[], `WeWorkRemotely: ${errorMessage(error)}`];
  }
  const postings: Posting[] = [];
  for (const match of xml.matchAll(ITEM_RE)) {
    const chunk = match[1] ?? "";
    const field = (name: (typeof RSS_FIELD_NAMES)[number]): string => {
      const m = FIELD_RE[name].exec(chunk);
      return m ? decodeHtmlEntities(m[1]!.trim()) : "";
    };
    const rawTitle = field("title");
    const sepIndex = rawTitle.indexOf(":");
    let company: string;
    let title: string;
    if (sepIndex >= 0) {
      company = rawTitle.slice(0, sepIndex);
      title = rawTitle.slice(sepIndex + 1);
    } else {
      company = "?";
      title = rawTitle;
    }
    postings.push(
      makePosting({
        source: "weworkremotely",
        company: company.trim(),
        title: title.trim(),
        location: field("region") || "Remote",
        url: field("link"),
        description: stripHtml(field("description")),
        postedAt: field("pubDate"),
        remoteOverride: true,
      })
    );
  }
  return [postings, null];
}

/** dou.ua -- Ukraine's largest programmer community job board. RSS confirmed live at
 * `/vacancies/feeds/` (note: plural -- `/feed/` 404s), and confirmed to honour `?category=<exact
 * value>` server-side (25 items per category, consistently, across five different categories
 * tested; case-insensitive). Query-driven by `uaCategories`, one fetch per configured category --
 * deliberately NOT a flat aggregator pull of the site's ~50 most recent postings across every
 * discipline: relying on the shared title prefilter to find a specific track's postings in that
 * pool would mean pure volume dilution across a site with dozens of categories, nothing to do
 * with title language. See `reference/ua-scout-categories.md` for dou.ua's full, real category
 * list (there is no generic "Backend" value -- it's split by language: Java/PHP/Python/Golang/
 * etc.).
 *
 * The title packs role + company + a variable-length, comma-separated tail (salary and/or one or
 * more cities and/or "remote"/"abroad") into one string, not a fixed two-field split -- e.g.
 * "Backend Engineer в WinWin.Travel, за кордоном, віддалено" or "Junior Workplace Specialist в
 * Ubisoft, Київ" (no salary shown at all -- optional, not every posting has one). Splits on the
 * first " в " (role vs. everything else) then the first "," inside that (company vs. the
 * free-form tail) rather than trying to parse the tail's own field count -- `Posting` has no
 * salary field anyway, so the tail is kept whole as `location`, and the existing remote-word scan
 * (Ukrainian-aware, see `REMOTE_WORDS`) picks "віддалено" out of it the same way it already does
 * for any other source's location text. */
async function fetchDouUa({ uaCategories }: FeedFetchOpts): Promise<FetchResult> {
  if (uaCategories.length === 0) return [[], "dou.ua: no ua_categories configured for this candidate"];
  const postings: Posting[] = [];
  let error: string | null = null;
  for (const category of uaCategories) {
    const url = "https://jobs.dou.ua/vacancies/feeds/?category=" + encodeURIComponent(category);
    let xml: string;
    try {
      xml = await getText(url);
    } catch (fetchError) {
      error = `dou.ua (${category}): ${errorMessage(fetchError)}`;
      continue;
    }
    for (const match of xml.matchAll(ITEM_RE)) {
      const chunk = match[1] ?? "";
      const field = (name: (typeof RSS_FIELD_NAMES)[number]): string => {
        const m = FIELD_RE[name].exec(chunk);
        // Double-decode, not single -- dou.ua's own feed double-encodes entities in the title
        // specifically (confirmed live: literal "&amp;nbsp;" in the raw XML, not just "&nbsp;"),
        // so a single pass leaves a raw "&nbsp;" sitting in the text. Idempotent/harmless for
        // anything that was only single-encoded to begin with.
        return m ? decodeHtmlEntities(decodeHtmlEntities(m[1]!.trim())) : "";
      };
      const rawTitle = field("title");
      const sepIndex = rawTitle.indexOf(" в ");
      let title: string;
      let company: string;
      let location: string;
      if (sepIndex >= 0) {
        title = rawTitle.slice(0, sepIndex).trim();
        const rest = rawTitle.slice(sepIndex + 3);
        const commaIndex = rest.indexOf(",");
        if (commaIndex >= 0) {
          company = rest.slice(0, commaIndex).trim();
          location = rest.slice(commaIndex + 1).trim();
        } else {
          company = rest.trim();
          location = "";
        }
      } else {
        title = rawTitle;
        company = "?";
        location = "";
      }
      postings.push(
        makePosting({
          source: "douua",
          company,
          title,
          location,
          url: field("link"),
          description: stripHtml(field("description")),
          postedAt: field("pubDate"),
        })
      );
    }
  }
  return [postings, error];
}

/** The monthly 'Ask HN: Who is hiring?' thread via the Algolia API -- each top-level comment is
 * one posting, early-stage startups on no job board at all. */
async function fetchHackernews(): Promise<FetchResult> {
  let thread: any;
  try {
    const story = await getJson(
      "https://hn.algolia.com/api/v1/search?query=%22Ask%20HN%3A%20Who%20is%20hiring%3F%22&tags=story&hitsPerPage=1"
    );
    const hits = story.hits ?? [];
    if (hits.length === 0) return [[], "Hacker News: no 'Who is hiring' thread found"];
    thread = await getJson(`https://hn.algolia.com/api/v1/items/${hits[0].objectID}`);
  } catch (error) {
    return [[], `Hacker News: ${errorMessage(error)}`];
  }
  const postings: Posting[] = [];
  for (const comment of thread.children ?? []) {
    const text = stripHtml(comment.text ?? "");
    if (!text.trim()) continue;
    const head = (text.split("\n")[0] ?? "").slice(0, 200);
    const parts = head.split("|").map((p) => p.trim());
    const company = parts[0] ?? "?";
    const title = parts.length > 1 ? parts[1]! : head;
    const location = parts.length > 2 ? parts.slice(2, 4).join(" ") : "";
    postings.push(
      makePosting({
        source: "hackernews",
        company,
        title,
        location,
        url: `https://news.ycombinator.com/item?id=${comment.id}`,
        description: text,
        postedAt: String(comment.created_at ?? ""),
        remoteOverride: head.toLowerCase().includes("remote") ? true : null,
      })
    );
  }
  return [postings, null];
}

export const AGGREGATOR_FETCHERS: Record<string, FeedFetcher> = {
  remoteok: fetchRemoteok,
  remotive: fetchRemotive,
  arbeitnow: fetchArbeitnow,
  jobicy: fetchJobicy,
  himalayas: fetchHimalayas,
  weworkremotely: fetchWeworkremotely,
  hackernews: fetchHackernews,
};

// ---------------------------------------------------------------------- regional boards

/** justjoin.it -- Poland/EU IT board, salary-transparent. The list endpoint is the site's own
 * same-origin one; `api.justjoin.it` answers 503 to everything. The list API only returns
 * title+skill-tags+level, not JD text -- a title worth judging (see `worthDetailFetch`) gets one
 * extra detail fetch for the real requirements/description text. */
async function justjoinPosting(offer: any, opts: FeedFetchOpts): Promise<Posting> {
  const rawSkills = [...(offer.requiredSkills ?? []), ...(offer.niceToHaveSkills ?? [])];
  const skills = rawSkills.map((s: any) => (typeof s === "object" ? s.name ?? "" : String(s))).join(" ");
  const title = offer.title ?? "";
  let body = "";
  if (worthDetailFetch(title, opts.trackTitles, opts.roleSignals)) {
    try {
      const detail = await getJson(`https://justjoin.it/api/candidate-api/offers/${offer.slug ?? ""}`);
      body = stripHtml(detail.body ?? "");
    } catch {
      // best effort, never fatal
    }
  }
  return makePosting({
    source: "justjoin",
    company: offer.companyName ?? "?",
    title,
    location: [offer.city ?? "", offer.workplaceType ?? ""].filter(Boolean).join(", "),
    url: `https://justjoin.it/job-offer/${offer.slug ?? ""}`,
    description: `${title}\n${body}\n${skills}\n${offer.experienceLevel ?? ""}`,
    postedAt: offer.publishedAt ?? "",
    remoteOverride: offer.workplaceType === "remote" ? true : null,
  });
}

async function fetchJustjoin(opts: FeedFetchOpts, pages = 3): Promise<FetchResult> {
  const postings: Posting[] = [];
  for (let page = 1; page <= pages; page++) {
    const url = `https://justjoin.it/api/candidate-api/offers?sortBy=newest&from=${(page - 1) * 100}&itemsCount=100`;
    let data: any;
    try {
      data = await getJson(url);
    } catch (error) {
      return [postings, `JustJoin.it (page ${page}): ${errorMessage(error)}`];
    }
    const offers = data.data ?? [];
    if (offers.length === 0) break;
    for (const offer of offers) postings.push(await justjoinPosting(offer, opts));
  }
  return [postings, null];
}

async function nofluffPosting(postingData: any, opts: FeedFetchOpts): Promise<Posting> {
  const places = postingData.location?.places ?? [];
  const city = places[0]?.city ?? "";
  const title = (postingData.title ?? "").trim();
  let body = "";
  if (worthDetailFetch(title, opts.trackTitles, opts.roleSignals)) {
    try {
      const detail = await getJson(`https://nofluffjobs.com/api/posting/${postingData.url ?? ""}`);
      const req = detail.requirements ?? {};
      const det = detail.details ?? {};
      body = stripHtml(req.description ?? "") + "\n" + stripHtml(det.description ?? "");
    } catch {
      // best effort, never fatal
    }
  }
  const tech = postingData.technology;
  const techStr = (Array.isArray(tech) ? tech : [tech ?? ""]).join(" ");
  return makePosting({
    source: "nofluff",
    company: postingData.name ?? "?",
    title,
    location: city || "Poland",
    url: `https://nofluffjobs.com/job/${postingData.url ?? ""}`,
    description: `${title}\n${body}\n${postingData.category ?? ""} ${techStr}`,
    postedAt: postingData.posted ?? "",
    remoteOverride: postingData.fullyRemote ? true : null,
  });
}

/** nofluffjobs.com -- Poland/CEE IT board, salary disclosure mandatory. Same detail-fetch gap
 * as JustJoin above. */
async function fetchNofluff(opts: FeedFetchOpts): Promise<FetchResult> {
  let data: any;
  try {
    data = await getJson("https://nofluffjobs.com/api/posting");
  } catch (error) {
    return [[], `NoFluffJobs: ${errorMessage(error)}`];
  }
  const postings: Posting[] = [];
  for (const postingData of data.postings ?? []) postings.push(await nofluffPosting(postingData, opts));
  return [postings, null];
}

/** What a Djinni job page says that its RSS item does not: the company, how the work is done and
 * which countries are considered. `remote` is `null` when the page names no work mode. */
export interface DjinniPage {
  company: string | null;
  location: string;
  remote: boolean | null;
}

/** Reads a Djinni job page (Ukrainian UI). The company is in the `<title>` as
 * `"<job title> в <Company> – Djinni"` ("в" is Cyrillic "at", U+0432 -- doesn't collide with Latin
 * "in", e.g. "Head of QA (in Warsaw)"); the RSS title is stripped as an exact prefix instead of
 * guessing where " в " splits, with a regex fallback for a title/page mismatch.
 *
 * The RSS description never says where the job can be done, but the page's facts list does: a
 * work-mode line ("Тільки віддалено", "Офіс, Гібридний формат роботи", ...) and a
 * `<span class="location-text">` with the countries considered ("Країни Європи та Україна",
 * "Весь світ"). Without them a remote-from-Ukraine posting looked on-site to the location gate. */
export function parseDjinniPage(html: string, rssTitle: string): DjinniPage {
  const pageTitle = decodeHtmlEntities(/<title>([^<]*)<\/title>/.exec(html)?.[1]?.trim() ?? "");
  const { countries, mode } = djinniFacts(html);
  const remote = mode ? /віддален/i.test(mode) : null;
  const location = [countries, mode ? `(${mode.toLowerCase()})` : ""].filter(Boolean).join(" ");
  return { company: djinniCompany(pageTitle, rssTitle), location, remote };
}

function djinniCompany(pageTitle: string, rssTitle: string): string | null {
  const suffix = " – Djinni";
  if (!pageTitle.endsWith(suffix)) return null;
  const withoutSuffix = pageTitle.slice(0, -suffix.length);
  const prefix = `${rssTitle} в `;
  const name = withoutSuffix.startsWith(prefix)
    ? withoutSuffix.slice(prefix.length)
    : (/ в (.+)$/.exec(withoutSuffix)?.[1] ?? "");
  return name.trim() || null;
}

/** The countries considered and the first work-mode line of the page's facts list. */
function djinniFacts(html: string): { countries: string; mode: string } {
  let countries = "";
  let mode = "";
  const facts = /<ul[^>]*>((?:(?!<\/ul>)[\s\S])*location-text(?:(?!<\/ul>)[\s\S])*)<\/ul>/.exec(html)?.[1];
  for (const item of facts?.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g) ?? []) {
    const raw = item[1] ?? "";
    const text = decodeHtmlEntities(raw.replace(TAG_RE, " ")).replace(/\s+/g, " ").trim();
    if (raw.includes("location-text")) {
      countries = decodeHtmlEntities(/class="location-text"[^>]*>([^<]*)</.exec(raw)?.[1] ?? "").trim();
    } else if (!mode && /віддален|офіс|гібрид/i.test(text)) {
      mode = text;
    }
  }
  return { countries, mode };
}

export async function fetchDjinniCompany(jobUrl: string, rssTitle: string): Promise<string | null> {
  return parseDjinniPage(await getText(jobUrl), rssTitle).company;
}

/** djinni.co -- Ukraine's largest tech job board. RSS confirmed live at `/jobs/rss/`, and
 * `?primary_keyword=<exact category>` confirmed to genuinely filter server-side -- but ONLY for
 * an exact match against Djinni's own fixed category taxonomy (~123 values, one per
 * `/jobs/keyword-<slug>` page in its sitemap -- see `reference/ua-scout-categories.md`).
 * Anything else -- a free-text track title, a typo, garbage -- is silently ignored server-side
 * and Djinni returns its unfiltered "latest vacancies" feed instead of an error or empty result;
 * confirmed by diffing the response for a real query against a nonsense one and finding them
 * byte-identical. Query-driven by `uaCategories`, one fetch per configured category (like
 * `fetchDouUa` above) -- track titles wouldn't work here, since they're free text and this only
 * ever matches an exact category. Also case-sensitive for anything that isn't already lowercase,
 * unlike dou.ua -- `"Engineering Manager"` filters correctly,
 * `"engineering manager"` silently falls back to the unfiltered feed same as garbage input; the
 * slug form (`"engineering_manager"`) is safest since it's already all-lowercase and is exactly
 * what `reference/ua-scout-categories.md` lists. An item has no structured company/location
 * field at all (`title`, `link`, `description`, `category` [the matched keyword, not useful as a
 * real category], `pubDate`, `guid` only, confirmed live) -- so company, work mode and countries
 * come from one extra fetch of the item's own page (see `parseDjinniPage`; like `fetchJustjoin`'s
 * detail fetch, gated by `worthDetailFetch` so we're not fetching every single RSS item's page).
 * Falls back to `"?"` and the description-text remote check (Ukrainian-aware, see `REMOTE_WORDS`)
 * if that detail fetch fails or the page doesn't parse. */
async function fetchDjinni({ uaCategories, trackTitles, roleSignals }: FeedFetchOpts): Promise<FetchResult> {
  if (uaCategories.length === 0) return [[], "Djinni: no ua_categories configured for this candidate"];
  const postings: Posting[] = [];
  let error: string | null = null;
  for (const category of uaCategories) {
    const url = "https://djinni.co/jobs/rss/?primary_keyword=" + encodeURIComponent(category);
    let xml: string;
    try {
      xml = await getText(url);
    } catch (fetchError) {
      error = `Djinni (${category}): ${errorMessage(fetchError)}`;
      continue;
    }
    for (const match of xml.matchAll(ITEM_RE)) {
      const chunk = match[1] ?? "";
      const field = (name: (typeof RSS_FIELD_NAMES)[number]): string => {
        const m = FIELD_RE[name].exec(chunk);
        return m ? decodeHtmlEntities(m[1]!.trim()) : "";
      };
      const title = field("title");
      const link = field("link");
      let page: DjinniPage = { company: null, location: "", remote: null };
      if (link && worthDetailFetch(title, trackTitles, roleSignals)) {
        try {
          page = parseDjinniPage(await getText(link), title);
        } catch {
          // best effort -- a failed detail fetch keeps the posting, without company and location
        }
      }
      postings.push(
        makePosting({
          source: "djinni",
          company: page.company ?? "?",
          title,
          location: page.location,
          remoteOverride: page.remote,
          url: link,
          description: stripHtml(field("description")),
          postedAt: field("pubDate"),
        })
      );
    }
  }
  return [postings, error];
}

export const REGIONAL_FETCHERS: Record<string, FeedFetcher> = {
  justjoin: (opts) => fetchJustjoin(opts),
  nofluff: fetchNofluff,
  douua: fetchDouUa,
  djinni: fetchDjinni,
};

// ------------------------------------------------------------------------------- orchestration

export const FEED_FETCHERS: Record<string, FeedFetcher> = {
  ...QUERY_DRIVEN_FETCHERS,
  ...AGGREGATOR_FETCHERS,
  ...REGIONAL_FETCHERS,
};

/** Runs a bounded number of `tasks` at a time -- a fixed-size worker pool pulling the next
 * unstarted task by index until none remain, unlike a naive `Promise.allSettled(tasks.map(t =>
 * t()))`, which fires every task immediately with no cap at all. Hand-rolled rather than a new
 * dependency (`p-limit` and friends) for something this small. */
async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let nextIndex = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = nextIndex++;
      if (i >= tasks.length) return;
      try {
        results[i] = { status: "fulfilled", value: await tasks[i]!() };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

/** Runs every configured per-company board and every enabled feed through a bounded worker pool
 * (see `runWithConcurrency` -- `maxWorkers` defaults to 8), since these are all independent
 * network calls. One bad source (dead slug, flaky endpoint) is reported in the returned error
 * list and never stops the rest. */
export async function fetchAll(opts: {
  companies: CompanyConfig[];
  feeds: string[];
  trackTitles: string[];
  roleSignals?: string[];
  uaCategories?: string[];
  maxWorkers?: number;
}): Promise<FetchResult> {
  const roleSignals = opts.roleSignals ?? [];
  const uaCategories = opts.uaCategories ?? [];
  const jobs: Array<{ label: string; run: () => Promise<FetchResult> }> = [];

  for (const company of opts.companies) {
    const fetcher = PER_COMPANY_FETCHERS[company.ats];
    if (fetcher === undefined) {
      jobs.push({ label: company.name, run: async () => [[], `${company.name}: no fetcher for ats=${company.ats}`] });
    } else {
      jobs.push({ label: company.name, run: () => fetcher(company) });
    }
  }

  for (const feedKey of opts.feeds) {
    const fetcher = FEED_FETCHERS[feedKey];
    if (fetcher === undefined) {
      jobs.push({ label: feedKey, run: async () => [[], `${feedKey}: no fetcher for this feed key`] });
    } else {
      jobs.push({ label: feedKey, run: () => fetcher({ trackTitles: opts.trackTitles, roleSignals, uaCategories }) });
    }
  }

  const postings: Posting[] = [];
  const errors: string[] = [];
  const settled = await runWithConcurrency(
    jobs.map((job) => job.run),
    opts.maxWorkers ?? 8
  );
  settled.forEach((result, i) => {
    const label = jobs[i]!.label;
    if (result.status === "rejected") {
      errors.push(`${label}: ${errorMessage(result.reason)}`);
      return;
    }
    const [found, error] = result.value;
    postings.push(...found);
    if (error) errors.push(error);
  });

  return [postings, errors.length > 0 ? errors.join("; ") : null];
}

// --------------------------------------------------------------- resolve a single posting by URL

export type UrlResolveResult =
  | { matched: true; posting: Posting }
  | { matched: true; posting: null; error: string }
  | { matched: false };

type Resolver = (rawUrl: string, path: string) => Promise<UrlResolveResult> | UrlResolveResult;

const failed = (error: string): UrlResolveResult => ({ matched: true, posting: null, error });
const found = (posting: Posting): UrlResolveResult => ({ matched: true, posting });
const NOT_MATCHED: UrlResolveResult = { matched: false };

async function resolveJobico(rawUrl: string, path: string): Promise<UrlResolveResult> {
  const m = /^\/jobs\/([^/]+)\/?$/.exec(path);
  if (!m) return NOT_MATCHED;
  try {
    const detail = await postJobicoTool("get_job", { slug: m[1] });
    if (!detail.found) return failed(`jobico.io: no job found for slug ${m[1]}`);
    const description = jobicoDescription(detail, (detail.techStack ?? []).join(" "));
    return found(jobicoPosting(detail, description, rawUrl));
  } catch (error) {
    return failed(`jobico.io: ${errorMessage(error)}`);
  }
}

async function resolveGreenhouse(rawUrl: string, path: string): Promise<UrlResolveResult> {
  const m = /^\/([^/]+)\/jobs\/(\d+)/.exec(path);
  if (!m) return NOT_MATCHED;
  const [, company, jobId] = m as unknown as [string, string, string];
  try {
    const detail = await getJson(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs/${jobId}?content=true`);
    return found(
      makePosting({
        source: "greenhouse",
        company: detail.company_name ?? company,
        title: detail.title ?? "",
        location: detail.location?.name ?? "",
        url: detail.absolute_url ?? rawUrl,
        description: stripHtml(detail.content ?? ""),
        postedAt: detail.updated_at ?? "",
      })
    );
  } catch (error) {
    return failed(`greenhouse (${company}/${jobId}): ${errorMessage(error)}`);
  }
}

async function resolveLever(rawUrl: string, path: string): Promise<UrlResolveResult> {
  const m = /^\/([^/]+)\/([0-9a-f-]{36})/i.exec(path);
  if (!m) return NOT_MATCHED;
  const [, company, postingId] = m as unknown as [string, string, string];
  try {
    const detail = await getJson(`https://api.lever.co/v0/postings/${company}/${postingId}?mode=json`);
    return found(leverPosting(detail, company, rawUrl));
  } catch (error) {
    return failed(`lever (${company}/${postingId}): ${errorMessage(error)}`);
  }
}

async function resolveRecruitee(rawUrl: string, path: string, company: string): Promise<UrlResolveResult> {
  const m = /^\/o\/([^/]+)/.exec(path);
  if (!m) return NOT_MATCHED;
  const slug = m[1];
  try {
    const data = await getJson(`https://${company}.recruitee.com/api/offers/${slug}`);
    const offer = data.offer ?? {};
    return found(recruiteePosting(offer, offer.company_name ?? company, rawUrl));
  } catch (error) {
    return failed(`recruitee (${company}/${slug}): ${errorMessage(error)}`);
  }
}

async function resolveAshby(rawUrl: string, path: string): Promise<UrlResolveResult> {
  const m = /^\/([^/]+)\/([0-9a-f-]{36})/i.exec(path);
  if (!m) return NOT_MATCHED;
  const [, company, postingId] = m as unknown as [string, string, string];
  try {
    const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${company}?includeCompensation=true`);
    const job = (data.jobs ?? []).find((j: any) => j.id === postingId);
    if (!job) return failed(`ashby (${company}): no job with id ${postingId} on the current board`);
    return found(ashbyPosting(job, company, rawUrl));
  } catch (error) {
    return failed(`ashby (${company}): ${errorMessage(error)}`);
  }
}

async function resolveWorkable(rawUrl: string, path: string): Promise<UrlResolveResult> {
  // jobs.workable.com/view/<shortcode>/<slug> -- the single-job endpoint returns the same job
  // shape fetchWorkable's search endpoint does, so parse it identically.
  const m = /^\/view\/([A-Za-z0-9_-]+)/.exec(path);
  if (!m) return NOT_MATCHED;
  const shortcode = m[1]!;
  try {
    return found(workablePosting(await getJson(`https://jobs.workable.com/api/v1/jobs/${shortcode}`), rawUrl));
  } catch (error) {
    return failed(`workable (${shortcode}): ${errorMessage(error)}`);
  }
}

const HOST_RESOLVERS: Record<string, Resolver> = {
  "jobico.io": resolveJobico,
  "www.jobico.io": resolveJobico,
  "boards.greenhouse.io": resolveGreenhouse,
  "job-boards.greenhouse.io": resolveGreenhouse,
  "jobs.lever.co": resolveLever,
  "jobs.ashbyhq.com": resolveAshby,
  "jobs.workable.com": resolveWorkable,
};

/** Given one vacancy URL (not a feed to search), checks it against the handful of job-board/ATS
 * URL shapes this file already knows precisely -- greenhouse.io, lever.co, ashbyhq.com,
 * recruitee.com, jobico.io, jobs.workable.com -- and if it matches, fetches that EXACT posting
 * via that platform's own single-item API, the same reliability as anything scout_fetch finds.
 * `matched: false` means genuinely unrecognized (not an error) -- the caller falls back to its
 * own general fetch/read capability for that case, see `playbooks/add-from-url.md`.
 *
 * Every URL shape and endpoint below confirmed live against a real posting before writing this,
 * same discipline as every other fetcher in this file -- not assumed from API docs alone.
 * Greenhouse specifically: only matches `boards.greenhouse.io`/`job-boards.greenhouse.io` URLs,
 * where the company slug is directly in the path -- a company's own white-labeled careers domain
 * (`stripe.com/jobs/...?gh_jid=...`) has no reliable way to recover that slug from the URL alone,
 * so those fall through to `matched: false` rather than guessing. Ashby has no documented
 * single-posting endpoint -- fetches the company's whole board (same one `fetchAshby` above
 * already pulls per scout run) and picks out the matching id; cheap at a per-company scale. */
export async function resolvePostingFromUrl(rawUrl: string): Promise<UrlResolveResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return NOT_MATCHED;
  }
  const host = url.hostname.toLowerCase();
  const recruiteeCompany = /^([a-z0-9-]+)\.recruitee\.com$/.exec(host)?.[1];
  if (recruiteeCompany) return resolveRecruitee(rawUrl, url.pathname, recruiteeCompany);
  const resolver = Object.hasOwn(HOST_RESOLVERS, host) ? HOST_RESOLVERS[host] : undefined;
  return resolver ? resolver(rawUrl, url.pathname) : NOT_MATCHED;
}
