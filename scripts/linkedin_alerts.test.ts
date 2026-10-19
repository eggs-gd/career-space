import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAlertEmail, triage, canonicalJobUrl } from "./linkedin_alerts";
import { ScoutConfig, TrackConfig } from "./scout_domain";

// Synthetic: the real template's shape with made-up jobs, ids and tokens.
const TRACKING = "?trackingId=AAAA%3D%3D&refId=BBBB%3D%3D&trk=eml-x-jobcard_body_text_0_jobid_ID&otpToken=CCCC";
const DASHES = "-".repeat(57);

function card(id: string, title: string, company: string, extra: string[]): string {
  return [title, company, ...extra, `View job: https://www.linkedin.com/comm/jobs/view/${id}/${TRACKING.replace("ID", id)}`].join("\n");
}

function email(name: string, cards: string[], listed: string[]): string {
  return [
    `Your job alert for ${name}Manage your job alerts: https://www.linkedin.com/comm/jobs/alerts?lipi=x`,
    "",
    cards.join(`\n\n${DASHES}\n\n`),
    "",
    DASHES,
    "",
    `See all jobs on LinkedIn: https://www.linkedin.com/comm/jobs/search-results/?keywords=x&originToLandingJobPostings=${listed.join(",")}&lipi=y`,
    "",
    "This email was intended for A Person (headline)",
  ].join("\n");
}

const body = email(
  "Team Lead in Ukraine",
  [
    card("1000000001", "Engineering Manager", "Acme", ["Kyiv", "", "1 connection", "Apply with resume & profile"]),
    card("1000000002", "Backend Developer Lead", "Globex", ["Ukraine", "", "This company is actively hiring"]),
    card("1000000003", "Marketing Team Lead", "Initech", ["Kyiv"]),
    card("1000000004", "Tech Lead", "Hooli", ["2 school alumni"]),
    card("1000000005", "Data Analyst", "Umbrella", ["Kyiv"]),
  ],
  ["1000000001", "1000000002", "1000000003", "1000000004", "1000000005"]
);

test("parseAlertEmail reads every card: title, company, location, badges, canonical url", () => {
  const parsed = parseAlertEmail(body);
  assert.equal(parsed.alert_name, "Team Lead in Ukraine");
  assert.deepEqual(parsed.listed_ids, ["1000000001", "1000000002", "1000000003", "1000000004", "1000000005"]);
  assert.deepEqual(
    parsed.jobs.map((j) => [j.job_id, j.title, j.company, j.location]),
    [
      ["1000000001", "Engineering Manager", "Acme", "Kyiv"],
      ["1000000002", "Backend Developer Lead", "Globex", "Ukraine"],
      ["1000000003", "Marketing Team Lead", "Initech", "Kyiv"],
      ["1000000004", "Tech Lead", "Hooli", ""],
      ["1000000005", "Data Analyst", "Umbrella", "Kyiv"],
    ]
  );
  assert.deepEqual(parsed.jobs[0]!.badges, ["1 connection", "Apply with resume & profile"]);
  assert.deepEqual(parsed.jobs[3]!.badges, ["2 school alumni"], "a badge in the third line is not a location");
  assert.equal(parsed.jobs[0]!.url, canonicalJobUrl("1000000001"));
  assert.ok(!parsed.jobs[0]!.url.includes("trackingId"), "tracking parameters never survive");
});

test("an email with no job cards parses to no jobs", () => {
  const parsed = parseAlertEmail("Your jobs similar to X\n\nsomething else entirely");
  assert.equal(parsed.jobs.length, 0);
});

function config(overrides: Partial<ConstructorParameters<typeof ScoutConfig>[0]> = {}): ScoutConfig {
  const track: TrackConfig = { label: "Lead", kind: "primary", titles: ["lead", "manager"], hiringTitles: [], uaCategories: [] };
  return new ScoutConfig({
    tracks: new Map([["lead", track]]),
    titleExclude: ["marketing"],
    hardExclude: [],
    companies: [],
    feeds: [],
    localKeywords: ["kyiv", "ukraine"],
    ...overrides,
  });
}

test("triage merges repeats across emails and counts them", () => {
  const second = email("Development Manager", [card("1000000001", "Engineering Manager", "Acme", ["Kyiv"])], ["1000000001"]);
  const result = triage([parseAlertEmail(body), parseAlertEmail(second)], { config: config() });
  assert.equal(result.jobs_listed, 6);
  assert.equal(result.unique_jobs, 5);
  const acme = result.jobs_to_read.find((j) => j.job_id === "1000000001")!;
  assert.equal(acme.emails, 2);
  assert.deepEqual(acme.alerts, ["Team Lead in Ukraine", "Development Manager"]);
});

test("triage drops known jobs and applies the light rules to what the alert shows", () => {
  const result = triage([parseAlertEmail(body)], { config: config(), isKnown: (id) => id === "1000000002" });
  assert.equal(result.already_known, 1);
  // 1000000003 fails title_exclude; 1000000004 has no location, so the location gate drops it;
  // 1000000005 matches no track but LinkedIn already matched the profile, so it stays
  assert.deepEqual(result.jobs_to_read.map((j) => j.job_id), ["1000000001", "1000000005"]);
  assert.equal(result.prefilter, "light");
});

test("full mode adds the track rule; off and a missing config skip the filter", () => {
  assert.deepEqual(
    triage([parseAlertEmail(body)], { config: config(), prefilter: "full" }).jobs_to_read.map((j) => j.job_id),
    ["1000000001", "1000000002"],
    "Data Analyst matches no track"
  );
  const off = triage([parseAlertEmail(body)], { config: config(), prefilter: "off" });
  assert.equal(off.returned, 5);
  assert.equal(off.prefilter, "off (asked)");
  const none = triage([parseAlertEmail(body)], { config: null });
  assert.equal(none.returned, 5);
  assert.equal(none.prefilter, "off (no sources.yaml)");
});

test("triage caps at maxJudgmentsPerRun and reports what was held back", () => {
  const result = triage([parseAlertEmail(body)], { config: config({ maxJudgmentsPerRun: 1, localKeywords: [] }) });
  assert.equal(result.returned, 1);
  assert.equal(result.capped, result.survived_prefilter - result.collapsed - 1);
  assert.ok(result.capped > 0);
  assert.equal(result.max_judgments, 1);
});

test("ids named by the See all link but missing from the cards are reported", () => {
  const partial = email("X", [card("1000000001", "Engineering Manager", "Acme", ["Kyiv"])], ["1000000001", "1000000009"]);
  assert.equal(triage([parseAlertEmail(partial)], { config: config() }).unparsed_ids, 1);
});
