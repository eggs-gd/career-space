/**
 * Fetchers for public ATS/job-board feeds. Only public, unauthenticated JSON/RSS APIs -- no
 * scraping, no headless browser, no login. Network/HTTP errors for a single source are
 * swallowed and reported, never fatal to the rest of the run -- one dead company slug or one
 * flaky aggregator should never blank out every other source's results.
 *
 * `Promise.allSettled` across every fetcher in `fetchAll`, using Node's built-in `fetch` --
 * the thread-pool-for-blocking-`urllib` concern the Python original had doesn't exist here at
 * all (no GIL, no blocking I/O to work around), a straightforward simplification, not a porting
 * obstacle.
 */

import { decode as decodeHtmlEntities } from "he";
import { CompanyConfig, Posting } from "./scout_domain";

const TAG_RE = /<[^>]+>/g;
const WS_RE = /[ \t]+/g;
const REMOTE_WORDS = ["remote", "anywhere", "distributed", "work from home", "wfh"];

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

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs: number): Promise<Response> {
  const response = await fetch(url, {
    headers: { ...HEADERS, ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
  }
  return response;
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
      location: (job.location ?? {}).name ?? "",
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
  const postings = (data as any[]).map((job) => {
    const cats = job.categories ?? {};
    const loc = cats.location ?? "";
    const parts = [job.descriptionPlain ?? ""];
    for (const lst of job.lists ?? []) parts.push(stripHtml(lst.content ?? ""));
    parts.push(job.additionalPlain ?? "");
    const description = parts.filter((p) => p).join("\n");
    const locFull = [loc, cats.team ?? "", cats.commitment ?? ""].filter((x) => x).join(", ");
    return makePosting({
      source: "lever",
      company: company.name,
      title: job.text ?? "",
      location: locFull,
      url: job.hostedUrl ?? "",
      description,
      postedAt: String(job.createdAt ?? ""),
    });
  });
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
  const postings: Posting[] = [];
  for (const job of data.jobs ?? []) {
    if (job.isListed === false) continue;
    const loc = job.location ?? "";
    const secondary = (job.secondaryLocations ?? [])
      .map((s: any) => s.location ?? "")
      .filter((x: string) => x)
      .join(", ");
    const locFull = [loc, secondary].filter((x) => x).join(", ");
    const description = job.descriptionPlain || stripHtml(job.descriptionHtml ?? "");
    const remoteOverride = Boolean(job.isRemote || job.workplaceType === "Remote") || null;
    postings.push(
      makePosting({
        source: "ashby",
        company: company.name,
        title: job.title ?? "",
        location: locFull,
        url: job.jobUrl ?? "",
        applyUrl: job.applyUrl ?? "",
        description,
        postedAt: job.publishedAt ?? "",
        remoteOverride,
      })
    );
  }
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
  const postings = (data.offers ?? []).map((offer: any) => {
    const loc = [offer.city, offer.country].filter((x) => x).map(String).join(", ");
    const description = stripHtml(`${offer.description ?? ""} ${offer.requirements ?? ""}`);
    const remoteOverride = ["true", "1", "yes"].includes(String(offer.remote ?? "").toLowerCase()) || null;
    return makePosting({
      source: "recruitee",
      company: company.name,
      title: offer.title ?? "",
      location: loc,
      url: offer.careers_url || offer.careers_apply_url || "",
      description,
      postedAt: String(offer.published_at ?? ""),
      remoteOverride,
    });
  });
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
  return trackTitles.some((t) => titleL.includes(t)) || roleSignals.some((t) => titleL.includes(t));
}

async function fetchWorkable({ trackTitles }: FeedFetchOpts): Promise<FetchResult> {
  const queries = trackQueries(trackTitles);
  if (queries.length === 0) return [[], "Workable: no track titles to search with"];
  const postings: Posting[] = [];
  let error: string | null = null;
  for (const query of queries) {
    let token: string | undefined;
    for (let pageNum = 0; pageNum < 2; pageNum++) {
      // 20 postings/page -- 2 pages is plenty for a track query
      let url = "https://jobs.workable.com/api/v1/jobs?query=" + encodeURIComponent(query);
      if (token) url += `&pageToken=${token}`;
      let data: any;
      try {
        data = await getJson(url);
      } catch (fetchError) {
        error = `Workable (${query}): ${errorMessage(fetchError)}`;
        break;
      }
      for (const job of data.jobs ?? []) {
        const company = job.company ?? {};
        const loc = job.location ?? {};
        let locStr = [loc.city, loc.subregion, loc.countryName].filter((x) => x).map(String).join(", ");
        const workplace = (job.workplace ?? "").toLowerCase();
        if (workplace === "remote") locStr = locStr ? `Remote, ${locStr}` : "Remote";
        const description = stripHtml(
          [job.description, job.requirementsSection, job.benefitsSection].filter((x) => x).join(" ")
        );
        postings.push(
          makePosting({
            source: "workable",
            company: company.title ?? "?",
            title: job.title ?? "",
            location: locStr,
            url: job.url ?? "",
            description,
            postedAt: String(job.published ?? job.created ?? ""),
            remoteOverride: workplace === "remote" ? true : null,
          })
        );
      }
      token = data.nextPageToken;
      if (!token) break;
    }
  }
  return [postings, error];
}

async function fetchSmartrecruiters({ trackTitles, roleSignals }: FeedFetchOpts): Promise<FetchResult> {
  const queries = trackQueries(trackTitles);
  if (queries.length === 0) return [[], "SmartRecruiters: no track titles to search with"];
  const postings: Posting[] = [];
  let error: string | null = null;
  let detailBudget = 60;
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
      const company = job.company ?? {};
      const loc = job.location ?? {};
      const locStr = [loc.city, loc.region, (loc.country ?? "").toUpperCase()].filter((x) => x).join(", ");
      const title = job.name ?? "";
      let description = "";
      // Relevance gate via worthDetailFetch (trackTitles + roleSignals), not `queries` (the
      // top-8-longest subset trackQueries truncates the search step itself to): a posting's
      // title only needs to contain ONE track title to be worth a detail fetch, but short,
      // common titles ("engineering manager", "head of engineering") are exactly the ones
      // length-truncation drops in favor of longer compound ones -- so a plainly titled posting
      // could be found by search yet never get its real description fetched, silently degrading
      // to a title-only stub downstream.
      if (detailBudget > 0 && worthDetailFetch(title, trackTitles, roleSignals)) {
        const detailUrl = (job.actions ?? {}).details;
        if (detailUrl) {
          detailBudget -= 1;
          try {
            const detail = await getJson(detailUrl);
            const sections = (detail.jobAd ?? {}).sections ?? {};
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
      }
      postings.push(
        makePosting({
          source: "smartrecruiters",
          company: company.name ?? "?",
          title,
          location: locStr,
          url: job.applyUrl ?? "",
          applyUrl: job.applyUrl ?? "",
          description: description || title,
          postedAt: String(job.releasedDate ?? ""),
          remoteOverride: loc.remote ? true : null,
        })
      );
    }
  }
  return [postings, error];
}

export const QUERY_DRIVEN_FETCHERS: Record<string, FeedFetcher> = {
  workable: fetchWorkable,
  smartrecruiters: fetchSmartrecruiters,
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
  RSS_FIELD_NAMES.map((key) => [key, new RegExp(`<${key}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${key}>`, "s")])
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

/** justjoin.it -- Poland/EU IT board, salary-transparent. The list API only returns
 * title+skill-tags+level, not JD text -- a title worth judging (see `worthDetailFetch`) gets one
 * extra detail fetch for the real requirements/description text. */
async function fetchJustjoin({ trackTitles, roleSignals }: FeedFetchOpts, pages = 3): Promise<FetchResult> {
  const postings: Posting[] = [];
  for (let page = 1; page <= pages; page++) {
    const url = `https://api.justjoin.it/v2/user-panel/offers?page=${page}&sortBy=published&orderBy=DESC&perPage=100`;
    let data: any;
    try {
      data = await getJson(url, { Version: "2" });
    } catch (error) {
      return [postings, `JustJoin.it (page ${page}): ${errorMessage(error)}`];
    }
    const offers = data.data ?? [];
    if (offers.length === 0) break;
    for (const offer of offers) {
      const rawSkills = [...(offer.requiredSkills ?? []), ...(offer.niceToHaveSkills ?? [])];
      const skills = rawSkills.map((s: any) => (typeof s === "object" ? s.name ?? "" : String(s))).join(" ");
      let body = "";
      const title = offer.title ?? "";
      if (worthDetailFetch(title, trackTitles, roleSignals)) {
        try {
          const detail = await getJson(`https://justjoin.it/api/candidate-api/offers/${offer.slug ?? ""}`);
          body = stripHtml(detail.body ?? "");
        } catch {
          // best effort, never fatal
        }
      }
      const description = `${title}\n${body}\n${skills}\n${offer.experienceLevel ?? ""}`;
      const loc = [offer.city ?? "", offer.workplaceType ?? ""].filter((x) => x).join(", ");
      postings.push(
        makePosting({
          source: "justjoin",
          company: offer.companyName ?? "?",
          title,
          location: loc,
          url: `https://justjoin.it/job-offer/${offer.slug ?? ""}`,
          description,
          postedAt: offer.publishedAt ?? "",
          remoteOverride: offer.workplaceType === "remote" ? true : null,
        })
      );
    }
  }
  return [postings, null];
}

/** nofluffjobs.com -- Poland/CEE IT board, salary disclosure mandatory. Same detail-fetch gap
 * as JustJoin above. */
async function fetchNofluff({ trackTitles, roleSignals }: FeedFetchOpts): Promise<FetchResult> {
  let data: any;
  try {
    data = await getJson("https://nofluffjobs.com/api/posting");
  } catch (error) {
    return [[], `NoFluffJobs: ${errorMessage(error)}`];
  }
  const postings: Posting[] = [];
  for (const postingData of data.postings ?? []) {
    const places = (postingData.location ?? {}).places ?? [];
    const city = places.length > 0 ? places[0].city ?? "" : "";
    let body = "";
    const title = (postingData.title ?? "").trim();
    if (worthDetailFetch(title, trackTitles, roleSignals)) {
      try {
        const detail = await getJson(`https://nofluffjobs.com/api/posting/${postingData.url ?? ""}`);
        const req = detail.requirements ?? {};
        const det = detail.details ?? {};
        body = stripHtml(req.description ?? "") + "\n" + stripHtml(det.description ?? "");
      } catch {
        // best effort, never fatal
      }
    }
    const category = postingData.category ?? "";
    const tech = postingData.technology;
    const techStr = (Array.isArray(tech) ? tech : [tech ?? ""]).join(" ");
    const description = `${title}\n${body}\n${category} ${techStr}`;
    postings.push(
      makePosting({
        source: "nofluff",
        company: postingData.name ?? "?",
        title,
        location: city || "Poland",
        url: `https://nofluffjobs.com/job/${postingData.url ?? ""}`,
        description,
        postedAt: postingData.posted ?? "",
        remoteOverride: postingData.fullyRemote ? true : null,
      })
    );
  }
  return [postings, null];
}

export const REGIONAL_FETCHERS: Record<string, FeedFetcher> = {
  justjoin: (opts) => fetchJustjoin(opts),
  nofluff: fetchNofluff,
};

// ------------------------------------------------------------------------------- orchestration

export const FEED_FETCHERS: Record<string, FeedFetcher> = {
  ...QUERY_DRIVEN_FETCHERS,
  ...AGGREGATOR_FETCHERS,
  ...REGIONAL_FETCHERS,
};

/** Runs a bounded number of `tasks` at a time -- mirrors Python's
 * `ThreadPoolExecutor(max_workers=...)` semantics (a fixed-size worker pool pulling from a
 * shared queue), which the naive `Promise.allSettled(tasks.map(t => t()))` this replaced doesn't:
 * that fires every task immediately with no cap at all. Hand-rolled rather than a new dependency
 * (`p-limit` and friends) for something this small -- a worker pulls the next unstarted task by
 * index until none remain, same fixed concurrency ceiling Python had. */
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
 * (see `runWithConcurrency` -- `maxWorkers` defaults to 8, same as the Python original's
 * `ThreadPoolExecutor(max_workers=8)`), since these are all independent network calls. One bad
 * source (dead slug, flaky endpoint) is reported in the returned error list and never stops the
 * rest. */
export async function fetchAll(opts: {
  companies: CompanyConfig[];
  feeds: string[];
  trackTitles: string[];
  roleSignals?: string[];
  maxWorkers?: number;
}): Promise<FetchResult> {
  const roleSignals = opts.roleSignals ?? [];
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
      jobs.push({ label: feedKey, run: () => fetcher({ trackTitles: opts.trackTitles, roleSignals }) });
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
