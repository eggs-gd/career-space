import { test } from "node:test";
import assert from "node:assert/strict";
import { djinniJobId, jobKey } from "./job_links";

test("jobKey: one Djinni job is one key whatever the link looks like", () => {
  const keys = [
    "https://djinni.co/jobs/841895-game-dev-tech-lead/",
    "https://djinni.co/jobs/841895-game-dev-tech-lead/?utm_source=rss",
    "https://www.djinni.co/jobs/841895/",
    "http://djinni.co/jobs/841895-anything",
  ].map(jobKey);
  assert.deepEqual(new Set(keys), new Set(["djinni:841895"]));
  assert.equal(djinniJobId("https://djinni.co/jobs/841895-game-dev-tech-lead/"), 841895);
});

test("jobKey: DOU and LinkedIn ids, with and without tracking tails", () => {
  assert.equal(jobKey("https://jobs.dou.ua/companies/digicode/vacancies/369035/?utm_source=jobsrss"), "dou:369035");
  assert.equal(jobKey("https://jobs.dou.ua/companies/digicode/vacancies/369035/"), "dou:369035");
  assert.equal(jobKey("https://www.linkedin.com/jobs/view/head-of-engineering-3912345678?trk=x"), "linkedin:3912345678");
  assert.equal(jobKey("https://www.linkedin.com/jobs/view/3912345678/"), "linkedin:3912345678");
});

test("jobKey: other sites compare by host and path only; an empty or odd input does not throw", () => {
  assert.equal(jobKey("https://Boards.Greenhouse.io/acme/jobs/123/?gh_src=x"), "boards.greenhouse.io/acme/jobs/123");
  assert.equal(jobKey(""), "");
  assert.equal(jobKey("not a url"), "not a url");
  assert.notEqual(jobKey("https://djinni.co/jobs/1-a/"), jobKey("https://djinni.co/jobs/2-a/"));
  assert.equal(djinniJobId("https://jobs.dou.ua/companies/x/vacancies/1/"), null);
});
