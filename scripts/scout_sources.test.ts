import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { fetchWithTimeout, fetchDjinniCompany, FEED_FETCHERS } from "./scout_sources";

/** Stubs `global.fetch` with a queue of responses/throws, one per call. Restores the real `fetch`
 * via `t.after()` -- runs after this test specifically, pass or fail, not just at process exit --
 * so a later test that forgets to stub its own fetch fails loudly instead of silently inheriting
 * a stale mock. */
function stubFetch(t: TestContext, ...behaviors: Array<(() => Response) | Error>): { calls: number; urls: string[] } {
  const real = global.fetch;
  const state = { calls: 0, urls: [] as string[] };
  global.fetch = (async (input: unknown) => {
    state.urls.push(String(input));
    const behavior = behaviors[state.calls];
    state.calls += 1;
    if (behavior instanceof Error) throw behavior;
    if (!behavior) throw new Error("stubFetch: ran out of queued behaviors");
    return behavior();
  }) as typeof fetch;
  t.after(() => {
    global.fetch = real;
  });
  return state;
}

test("fetchWithTimeout retries once after a 5xx, then succeeds", async (t) => {
  const state = stubFetch(
    t,
    () => new Response("", { status: 503, statusText: "Service Unavailable" }),
    () => new Response("ok", { status: 200 })
  );
  const response = await fetchWithTimeout("https://example.test/x", {}, 5_000, 0);
  assert.equal(response.status, 200);
  assert.equal(state.calls, 2, "should have retried exactly once");
});

test("fetchWithTimeout retries once after the fetch call itself throwing, then succeeds", async (t) => {
  const state = stubFetch(t, new Error("fetch failed"), () => new Response("ok", { status: 200 }));
  const response = await fetchWithTimeout("https://example.test/x", {}, 5_000, 0);
  assert.equal(response.status, 200);
  assert.equal(state.calls, 2);
});

test("fetchWithTimeout does NOT retry a 4xx -- it's deterministic, not transient", async (t) => {
  const state = stubFetch(t, () => new Response("", { status: 404, statusText: "Not Found" }));
  await assert.rejects(() => fetchWithTimeout("https://example.test/x", {}, 5_000, 0), /HTTP 404/);
  assert.equal(state.calls, 1, "must not retry a 4xx");
});

test("fetchWithTimeout still throws if the retry itself fails", async (t) => {
  stubFetch(
    t,
    () => new Response("", { status: 503, statusText: "Service Unavailable" }),
    () => new Response("", { status: 503, statusText: "Service Unavailable" })
  );
  await assert.rejects(() => fetchWithTimeout("https://example.test/x", {}, 5_000, 0), /HTTP 503/);
});

test("fetchDjinniCompany parses the company out of the job page's own <title>", async (t) => {
  stubFetch(t, () => new Response("<title>Group Engineering Manager в JustMarkets Tech – Djinni</title>", { status: 200 }));
  const company = await fetchDjinniCompany("https://djinni.co/jobs/1/", "Group Engineering Manager");
  assert.equal(company, "JustMarkets Tech");
});

test("fetchDjinniCompany doesn't get confused by a job title containing the Latin letters 'in'", async (t) => {
  stubFetch(t, () => new Response("<title>Head of QA (in Warsaw) в Synergetica – Djinni</title>", { status: 200 }));
  const company = await fetchDjinniCompany("https://djinni.co/jobs/2/", "Head of QA (in Warsaw)");
  assert.equal(company, "Synergetica");
});

test("fetchDjinniCompany falls back to a regex split when the RSS title doesn't prefix-match exactly", async (t) => {
  // e.g. an HTML-entity/whitespace difference between the RSS <title> and the page's own.
  stubFetch(t, () => new Response("<title>Engineering  Manager в Some Co – Djinni</title>", { status: 200 }));
  const company = await fetchDjinniCompany("https://djinni.co/jobs/3/", "Engineering Manager");
  assert.equal(company, "Some Co");
});

test('fetchDjinniCompany returns null (caller keeps "?") when the page doesn\'t match the expected shape', async (t) => {
  stubFetch(t, () => new Response("<title>Something else entirely</title>", { status: 200 }));
  const company = await fetchDjinniCompany("https://djinni.co/jobs/4/", "Engineering Manager");
  assert.equal(company, null);
});

test("justjoin lists through the site's own endpoint (api.justjoin.it is dead) and pages by `from`", async (t) => {
  const offer = {
    title: "Backend Engineer",
    slug: "acme--backend-engineer--warszawa",
    companyName: "Acme",
    city: "Warszawa",
    workplaceType: "remote",
    experienceLevel: "senior",
    publishedAt: "2026-10-22T09:20:02Z",
    requiredSkills: [{ name: "Python" }],
    niceToHaveSkills: [],
  };
  const state = stubFetch(
    t,
    () => new Response(JSON.stringify({ data: [offer] }), { status: 200 }),
    () => new Response(JSON.stringify({ data: [] }), { status: 200 })
  );
  const [postings, error] = await FEED_FETCHERS.justjoin!({ trackTitles: [], roleSignals: [], uaCategories: [] });
  assert.equal(error, null);
  assert.deepEqual(
    state.urls.map((u) => new URL(u).pathname + new URL(u).search),
    [
      "/api/candidate-api/offers?sortBy=newest&from=0&itemsCount=100",
      "/api/candidate-api/offers?sortBy=newest&from=100&itemsCount=100",
    ]
  );
  assert.ok(state.urls.every((u) => new URL(u).hostname === "justjoin.it"));
  assert.equal(postings.length, 1);
  assert.equal(postings[0]!.company, "Acme");
  assert.equal(postings[0]!.url, "https://justjoin.it/job-offer/acme--backend-engineer--warszawa");
  assert.equal(postings[0]!.remote, true);
});
