import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { appendCommunication } from "./communication_log";

test("appendCommunication keeps raw event text as quoted log entries and updates only the top summary", () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "career-space-comm-"));
  const slug = "acme-staff-engineer-11112222";
  fs.mkdirSync(path.join(dataDir, slug), { recursive: true });

  const first = appendCommunication({
    kind: "vacancy",
    slug,
    dataDir,
    title: "Recruiter email — interview invite",
    source: "Gmail / recruiter",
    direction: "inbound",
    status: "interview",
    observedAt: "2026-09-11T10:00:00Z",
    summary: "Recruiter invited the candidate to the technical interview.",
    rawText: "Hi,\n\nWe would like to invite you to a technical interview.\n\nRegards",
  });

  appendCommunication({
    kind: "vacancy",
    slug,
    dataDir,
    title: "Candidate reply — availability",
    source: "Gmail / candidate",
    direction: "outbound",
    observedAt: "2026-09-11T10:30:00Z",
    summary: "Interview invite received; candidate replied with availability.",
    rawText: "Thanks, Tuesday 15:00 works for me.",
  });

  const text = fs.readFileSync(first.path, "utf-8");
  assert.match(text, /^# Communication\n\nSummary:\nInterview invite received; candidate replied with availability\./);
  assert.match(text, /## 2026-09-11 — Recruiter email — interview invite/);
  assert.match(text, /Source: Gmail \/ recruiter · Direction: inbound · Related status: interview/);
  assert.match(text, /> We would like to invite you to a technical interview\./);
  assert.match(text, /## 2026-09-11 — Candidate reply — availability/);
  assert.match(text, /> Thanks, Tuesday 15:00 works for me\./);
});
