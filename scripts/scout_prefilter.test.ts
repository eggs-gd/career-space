/**
 * Guards `REMOTE_SIGNAL_WORDS`/`REMOTE_WORDS` against a real failure mode: an on-site London
 * posting must not pass the location gate just because its description happens to contain "sell
 * anywhere" (product marketing copy) or "distributed systems" (plain engineering-architecture
 * phrasing) -- neither actually describes where the candidate could be based.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { filterPostings } from "./scout_prefilter";
import { Posting, ScoutConfig } from "./scout_domain";

function configWithLocalKeywords(localKeywords: string[]): ScoutConfig {
  return new ScoutConfig({
    tracks: new Map(),
    titleExclude: [],
    hardExclude: [],
    companies: [],
    feeds: [],
    localKeywords,
  });
}

function posting(overrides: Partial<ConstructorParameters<typeof Posting>[0]> = {}): Posting {
  return new Posting({
    source: "test",
    company: "Acme",
    title: "Backend Engineer",
    location: "",
    remote: false,
    url: "https://example.com/job",
    applyUrl: "",
    description: "",
    postedAt: "",
    ...overrides,
  });
}

test("on-site posting is NOT let through just because its description says 'sell anywhere' and 'distributed systems'", () => {
  const config = configWithLocalKeywords(["berlin"]); // candidate is Berlin-based, not London
  const onSiteLondon = posting({
    location: "London, UK",
    remote: false,
    description:
      "We build distributed systems that let our customers sell anywhere in the world. This is an office-based role in our London HQ.",
  });
  const survivors = filterPostings([onSiteLondon], config);
  assert.equal(survivors.length, 0, "an on-site posting must not pass the location gate on incidental word matches");
});

test("a genuinely remote posting ('work from anywhere') still passes", () => {
  const config = configWithLocalKeywords(["berlin"]);
  const genuinelyRemote = posting({
    location: "",
    remote: false, // fetcher couldn't tell from an empty location field either
    description: "Fully remote role -- work from anywhere in the world, no office required.",
  });
  const survivors = filterPostings([genuinelyRemote], config);
  assert.equal(survivors.length, 1, "the tightened phrase must still catch the real remote phrasing it exists for");
});
