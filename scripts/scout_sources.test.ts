import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchWithTimeout } from "./scout_sources";

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
