import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchWithTimeout, fetchDjinniCompany } from "./scout_sources";

/** Stubs `global.fetch` with a queue of responses/throws, one per call, and restores the real
 * `fetch` after the test regardless of pass/fail. */
function stubFetch(...behaviors: Array<(() => Response) | Error>): { calls: number } {
  const real = global.fetch;
  const state = { calls: 0 };
  global.fetch = (async () => {
    const behavior = behaviors[state.calls];
    state.calls += 1;
    if (behavior instanceof Error) throw behavior;
    if (!behavior) throw new Error("stubFetch: ran out of queued behaviors");
    return behavior();
  }) as typeof fetch;
  process.once("beforeExit", () => {
    global.fetch = real;
  });
  return state;
}

test("fetchWithTimeout retries once after a 5xx, then succeeds", async () => {
  const state = stubFetch(
    () => new Response("", { status: 503, statusText: "Service Unavailable" }),
    () => new Response("ok", { status: 200 })
  );
  const response = await fetchWithTimeout("https://example.test/x", {}, 5_000, 0);
  assert.equal(response.status, 200);
  assert.equal(state.calls, 2, "should have retried exactly once");
});

test("fetchWithTimeout retries once after the fetch call itself throwing, then succeeds", async () => {
  const state = stubFetch(new Error("fetch failed"), () => new Response("ok", { status: 200 }));
  const response = await fetchWithTimeout("https://example.test/x", {}, 5_000, 0);
  assert.equal(response.status, 200);
  assert.equal(state.calls, 2);
});

test("fetchWithTimeout does NOT retry a 4xx -- it's deterministic, not transient", async () => {
  const state = stubFetch(() => new Response("", { status: 404, statusText: "Not Found" }));
  await assert.rejects(() => fetchWithTimeout("https://example.test/x", {}, 5_000, 0), /HTTP 404/);
  assert.equal(state.calls, 1, "must not retry a 4xx");
});

test("fetchWithTimeout still throws if the retry itself fails", async () => {
  stubFetch(
    () => new Response("", { status: 503, statusText: "Service Unavailable" }),
    () => new Response("", { status: 503, statusText: "Service Unavailable" })
  );
  await assert.rejects(() => fetchWithTimeout("https://example.test/x", {}, 5_000, 0), /HTTP 503/);
});

test("fetchDjinniCompany parses the company out of the job page's own <title>", async () => {
  stubFetch(() => new Response("<title>Group Engineering Manager в JustMarkets Tech – Djinni</title>", { status: 200 }));
  const company = await fetchDjinniCompany("https://djinni.co/jobs/1/", "Group Engineering Manager");
  assert.equal(company, "JustMarkets Tech");
});

test("fetchDjinniCompany doesn't get confused by a job title containing the Latin letters 'in'", async () => {
  stubFetch(() => new Response("<title>Head of QA (in Warsaw) в Synergetica – Djinni</title>", { status: 200 }));
  const company = await fetchDjinniCompany("https://djinni.co/jobs/2/", "Head of QA (in Warsaw)");
  assert.equal(company, "Synergetica");
});

test("fetchDjinniCompany falls back to a regex split when the RSS title doesn't prefix-match exactly", async () => {
  // e.g. an HTML-entity/whitespace difference between the RSS <title> and the page's own.
  stubFetch(() => new Response("<title>Engineering  Manager в Some Co – Djinni</title>", { status: 200 }));
  const company = await fetchDjinniCompany("https://djinni.co/jobs/3/", "Engineering Manager");
  assert.equal(company, "Some Co");
});

test("fetchDjinniCompany returns null (caller keeps \"?\") when the page doesn't match the expected shape", async () => {
  stubFetch(() => new Response("<title>Something else entirely</title>", { status: 200 }));
  const company = await fetchDjinniCompany("https://djinni.co/jobs/4/", "Engineering Manager");
  assert.equal(company, null);
});
