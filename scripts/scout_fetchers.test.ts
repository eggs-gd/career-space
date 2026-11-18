import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { FEED_FETCHERS, PER_COMPANY_FETCHERS, resolvePostingFromUrl } from "./scout_sources";

type Reply = unknown | Error;

/** Stubs `global.fetch`: `route(url, body)` returns the JSON payload for that request (or an
 * Error to fail it). Restored after the test. */
function routeFetch(t: TestContext, route: (url: string, body: string) => Reply): string[] {
  const real = global.fetch;
  const urls: string[] = [];
  global.fetch = (async (input: unknown, init?: { body?: string }) => {
    const url = String(input);
    urls.push(url);
    const reply = route(url, init?.body ?? "");
    if (reply instanceof Error) throw reply;
    return new Response(JSON.stringify(reply), { status: 200 });
  }) as typeof fetch;
  t.after(() => {
    global.fetch = real;
  });
  return urls;
}

const COMPANY = (ats: string) => ({ name: "Acme", ats, slug: "acme" });
const FAIL = new Error("HTTP 404 Not Found for stub");

test("greenhouse board: one posting per job, error string on failure", async (t) => {
  routeFetch(t, () => ({
    jobs: [{ title: "Eng Manager", location: { name: "Remote, EU" }, absolute_url: "https://gh/1", content: "<p>Lead teams</p>", updated_at: "2026-01-01" }],
  }));
  const [postings, error] = await PER_COMPANY_FETCHERS.greenhouse!(COMPANY("greenhouse"));
  assert.equal(error, null);
  assert.equal(postings[0]!.location, "Remote, EU");
  assert.equal(postings[0]!.description, "Lead teams");

  routeFetch(t, () => FAIL);
  const [none, failure] = await PER_COMPANY_FETCHERS.greenhouse!(COMPANY("greenhouse"));
  assert.deepEqual(none, []);
  assert.match(failure ?? "", /Acme \(greenhouse\/acme\)/);
});

test("lever board: location joins team and commitment, description joins the list sections", async (t) => {
  routeFetch(t, () => [
    {
      text: "Head of Eng",
      hostedUrl: "https://lever/1",
      categories: { location: "Berlin", team: "Platform", commitment: "Full-time" },
      descriptionPlain: "About",
      lists: [{ content: "<li>One</li>" }],
      additionalPlain: "Perks",
      createdAt: 1700000000000,
    },
  ]);
  const [postings, error] = await PER_COMPANY_FETCHERS.lever!(COMPANY("lever"));
  assert.equal(error, null);
  assert.equal(postings[0]!.location, "Berlin, Platform, Full-time");
  assert.equal(postings[0]!.description, "About\nOne\nPerks");

  routeFetch(t, () => FAIL);
  assert.match((await PER_COMPANY_FETCHERS.lever!(COMPANY("lever")))[1] ?? "", /lever\/acme/);
});

test("ashby board: skips unlisted jobs, merges secondary locations, honours the remote flag", async (t) => {
  routeFetch(t, () => ({
    jobs: [
      { title: "Hidden", isListed: false },
      {
        title: "CTO",
        location: "London",
        secondaryLocations: [{ location: "Remote" }, {}],
        descriptionHtml: "<b>Run it</b>",
        jobUrl: "https://ashby/1",
        applyUrl: "https://ashby/1/apply",
        isRemote: true,
        publishedAt: "2026-02-02",
      },
    ],
  }));
  const [postings, error] = await PER_COMPANY_FETCHERS.ashby!(COMPANY("ashby"));
  assert.equal(error, null);
  assert.equal(postings.length, 1);
  assert.equal(postings[0]!.location, "London, Remote");
  assert.equal(postings[0]!.remote, true);
  assert.equal(postings[0]!.description, "Run it");

  routeFetch(t, () => FAIL);
  assert.match((await PER_COMPANY_FETCHERS.ashby!(COMPANY("ashby")))[1] ?? "", /ashby\/acme/);
});

test("recruitee board: location from city and country, remote from the offer flag", async (t) => {
  routeFetch(t, () => ({
    offers: [{ title: "VP Eng", city: "Kyiv", country: "Ukraine", remote: "yes", description: "<p>Own it</p>", requirements: "Years", careers_url: "https://rec/1", published_at: "2026-03-03" }],
  }));
  const [postings, error] = await PER_COMPANY_FETCHERS.recruitee!(COMPANY("recruitee"));
  assert.equal(error, null);
  assert.equal(postings[0]!.location, "Kyiv, Ukraine");
  assert.equal(postings[0]!.remote, true);
  assert.equal(postings[0]!.description, "Own it Years");

  routeFetch(t, () => FAIL);
  assert.match((await PER_COMPANY_FETCHERS.recruitee!(COMPANY("recruitee")))[1] ?? "", /recruitee\/acme/);
});

test("resolvePostingFromUrl fetches the exact posting for each known ATS shape", async (t) => {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";
  routeFetch(t, (url) => {
    if (url.includes("greenhouse")) return { title: "GH role", company_name: "GhCo", location: { name: "Remote" }, absolute_url: "https://gh/x", content: "<p>Body</p>" };
    if (url.includes("lever.co")) return { text: "Lever role", categories: { location: "Oslo" }, descriptionPlain: "Lever body", hostedUrl: "https://lever/x" };
    if (url.includes("recruitee")) return { offer: { title: "Rec role", company_name: "RecCo", city: "Riga", remote: "true", description: "Rec body" } };
    if (url.includes("ashbyhq")) return { jobs: [{ id: uuid, title: "Ashby role", location: "Paris", descriptionPlain: "Ashby body", workplaceType: "Remote" }] };
    if (url.includes("workable")) return { title: "Work role", company: { title: "WorkCo" }, location: { city: "Wien", countryName: "Austria" }, workplace: "remote", description: "<p>Work body</p>", published: "2026-04-04" };
    return {};
  });

  const gh = await resolvePostingFromUrl("https://boards.greenhouse.io/acme/jobs/12345");
  assert.ok(gh.matched && gh.posting);
  assert.equal(gh.posting.company, "GhCo");

  const lever = await resolvePostingFromUrl(`https://jobs.lever.co/acme/${uuid}`);
  assert.ok(lever.matched && lever.posting);
  assert.equal(lever.posting.location, "Oslo");

  const rec = await resolvePostingFromUrl("https://acme.recruitee.com/o/some-role");
  assert.ok(rec.matched && rec.posting);
  assert.equal(rec.posting.remote, true);

  const ashby = await resolvePostingFromUrl(`https://jobs.ashbyhq.com/acme/${uuid}`);
  assert.ok(ashby.matched && ashby.posting);
  assert.equal(ashby.posting.remote, true);

  const workable = await resolvePostingFromUrl("https://jobs.workable.com/view/AbC123/some-role");
  assert.ok(workable.matched && workable.posting);
  assert.equal(workable.posting.location, "Remote, Wien, Austria");
});

test("resolvePostingFromUrl: no such ashby id, bad URLs and unknown hosts are reported, not thrown", async (t) => {
  routeFetch(t, () => ({ jobs: [] }));
  const missing = await resolvePostingFromUrl("https://jobs.ashbyhq.com/acme/123e4567-e89b-12d3-a456-426614174000");
  assert.ok(missing.matched && missing.posting === null);
  assert.match(missing.error, /no job with id/);

  assert.deepEqual(await resolvePostingFromUrl("not a url"), { matched: false });
  assert.deepEqual(await resolvePostingFromUrl("https://example.com/jobs/1"), { matched: false });
  assert.deepEqual(await resolvePostingFromUrl("https://jobs.workable.com/other"), { matched: false });

  routeFetch(t, () => FAIL);
  const failed = await resolvePostingFromUrl("https://boards.greenhouse.io/acme/jobs/1");
  assert.ok(failed.matched && failed.posting === null);
  assert.match(failed.error, /greenhouse \(acme\/1\)/);
});

test("resolvePostingFromUrl reads a jobico posting through its JSON-RPC tool", async (t) => {
  routeFetch(t, (_url, body) => {
    const slug = JSON.parse(body).params.arguments.slug;
    if (slug === "gone") return { result: { structuredContent: { found: false } } };
    return {
      result: {
        structuredContent: { found: true, title: "Jobico role", company: { name: "JobCo" }, city: "Lviv", country: "Ukraine", locationType: "remote", description: "Desc", techStack: ["Go", "TS"], url: "https://jobico.io/jobs/x" },
      },
    };
  });
  const found = await resolvePostingFromUrl("https://jobico.io/jobs/x");
  assert.ok(found.matched && found.posting);
  assert.equal(found.posting.company, "JobCo");
  assert.equal(found.posting.location, "Remote, Lviv, Ukraine");
  assert.equal(found.posting.description, "Desc\n\nGo TS");

  const gone = await resolvePostingFromUrl("https://jobico.io/jobs/gone");
  assert.ok(gone.matched && gone.posting === null);
  assert.match(gone.error, /no job found/);
});

const OPTS = { trackTitles: ["engineering manager"], roleSignals: [], uaCategories: [] };

test("workable search: one posting per job, remote workplace prefixes the location", async (t) => {
  routeFetch(t, () => ({
    jobs: [{ title: "Engineering Manager", company: { title: "WorkCo" }, location: { city: "Wien", countryName: "Austria" }, workplace: "remote", description: "<p>Lead</p>", url: "https://w/1", created: "2026-05-05" }],
  }));
  const [postings, error] = await FEED_FETCHERS.workable!(OPTS);
  assert.equal(error, null);
  assert.equal(postings[0]!.location, "Remote, Wien, Austria");
});

test("smartrecruiters search: location from city, region and upper-cased country; detail text fetched for a relevant title", async (t) => {
  routeFetch(t, (url) => {
    if (url.includes("sr-jobs/search")) {
      return {
        content: [{ name: "Engineering Manager", company: { name: "SrCo" }, location: { city: "Praha", region: "Prague", country: "cz", remote: true }, applyUrl: "https://sr/1", actions: { details: "https://sr/detail/1" }, releasedDate: "2026-06-06" }],
      };
    }
    return { jobAd: { sections: { a: { text: "<p>Detail text</p>" }, b: null } } };
  });
  const [postings, error] = await FEED_FETCHERS.smartrecruiters!(OPTS);
  assert.equal(error, null);
  assert.equal(postings[0]!.location, "Praha, Prague, CZ");
  assert.equal(postings[0]!.description, "Detail text");
  assert.equal(postings[0]!.remote, true);
});

test("jobico search: lists jobs, fetches detail text for a relevant title", async (t) => {
  routeFetch(t, (_url, body) => {
    const call = JSON.parse(body).params;
    if (call.name === "search_jobs") {
      return { result: { structuredContent: { jobs: [{ title: "Engineering Manager", slug: "em", company: { name: "JobCo" }, city: "Lviv", locationType: "remote", techStack: ["Go"], url: "https://jobico.io/jobs/em" }] } } };
    }
    return { result: { structuredContent: { description: "Detail", requirements: "Req" } } };
  });
  const [postings, error] = await FEED_FETCHERS.jobico!(OPTS);
  assert.equal(error, null);
  assert.equal(postings[0]!.location, "Remote, Lviv");
  assert.equal(postings[0]!.description, "Detail\n\nReq\n\nGo");
});

test("justjoin lists offers (detail text for a relevant title) and nofluff reads the posting list", async (t) => {
  routeFetch(t, (url) => {
    if (url.includes("justjoin.it/api/candidate-api/offers?")) {
      return { data: url.includes("from=0") ? [{ title: "Engineering Manager", slug: "em", companyName: "JjCo", city: "Warszawa", workplaceType: "remote", requiredSkills: [{ name: "Go" }, "TS"] }] : [] };
    }
    if (url.includes("justjoin.it/api/candidate-api/offers/")) return { body: "<p>Detail</p>" };
    if (url.endsWith("/api/posting")) return { postings: [{ title: "Engineering Manager", url: "em-1", name: "NfCo", location: { places: [{ city: "Krakow" }] }, technology: "go", fullyRemote: true }, { title: "Cook", url: "cook-1", location: { places: [] } }] };
    return { requirements: { description: "<p>Req</p>" }, details: { description: "<p>Det</p>" } };
  });
  const [jj, jjError] = await FEED_FETCHERS.justjoin!(OPTS);
  assert.equal(jjError, null);
  assert.equal(jj[0]!.location, "Warszawa, remote");
  assert.match(jj[0]!.description, /Detail/);

  const [nf, nfError] = await FEED_FETCHERS.nofluff!(OPTS);
  assert.equal(nfError, null);
  assert.equal(nf[0]!.location, "Krakow");
  assert.equal(nf[1]!.location, "Poland");
  assert.match(nf[0]!.description, /Req\nDet/);
});
