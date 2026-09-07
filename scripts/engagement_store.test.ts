import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as yaml from "js-yaml";
import { upsertEngagement, listEngagements, setEngagementStatus, setEngagementArchived } from "./engagement_store";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "career-space-eng-"));
}

test("upsertEngagement creates an order folder with a provisional record and posting.md", () => {
  const dataDir = tmpDir();
  const rec = upsertEngagement({
    client: "Nimbus Labs",
    title: "Go microservice for invoice sync",
    url: "https://www.upwork.com/jobs/~01abc",
    postingText: "Need a Go service that syncs invoices to QuickBooks.",
    fitScore: 8,
    fitCategory: "good_bet",
    fitReason: "Direct Go + integrations evidence.",
    dataDir,
  });

  assert.equal(rec.status, "new");
  assert.equal(rec.client, "Nimbus Labs");
  assert.equal(rec.source, "upwork");
  assert.deepEqual(rec.fit, { score: 8, category: "good_bet", reason: "Direct Go + integrations evidence." });
  assert.equal(rec.status_history.length, 1);

  const dir = path.join(dataDir, rec.slug);
  assert.ok(fs.existsSync(path.join(dir, "record.yaml")));
  assert.match(fs.readFileSync(path.join(dir, "posting.md"), "utf-8"), /QuickBooks/);
});

test("upsertEngagement is idempotent on the same posting and merges fresh fit without touching status", () => {
  const dataDir = tmpDir();
  const first = upsertEngagement({ client: "Acme", title: "Fix flaky CI", url: "https://x/1", fitScore: 5, dataDir });
  setEngagementStatus(first.slug, "tracked", undefined, dataDir);
  const second = upsertEngagement({ client: "Acme", title: "Fix flaky CI", url: "https://x/1", fitScore: 7, fitCategory: "thin_margin", dataDir });

  assert.equal(second.slug, first.slug);
  assert.equal(second.status, "tracked", "re-judging must not reset an advanced status");
  assert.equal(second.fit.score, 7);
  assert.equal(fs.readdirSync(dataDir).length, 1, "no duplicate folder");
});

test("setEngagementStatus records a transition with history; setEngagementArchived hides from the default listing", () => {
  const dataDir = tmpDir();
  const a = upsertEngagement({ client: "One", title: "Task A", url: "https://x/a", fitScore: 9, dataDir });
  const b = upsertEngagement({ client: "Two", title: "Task B", url: "https://x/b", fitScore: 4, dataDir });

  const moved = setEngagementStatus(a.slug, "applied", "sent a proposal", dataDir);
  assert.equal(moved.status, "applied");
  const hist = moved.status_history.at(-1);
  assert.equal(hist.status, "applied");
  assert.equal(hist.note, "sent a proposal");

  setEngagementArchived(b.slug, true, dataDir);

  const active = listEngagements({ dataDir });
  assert.deepEqual(
    active.map((o) => o.slug),
    [a.slug],
    "archived order is excluded and the rest still list"
  );
  assert.equal(listEngagements({ dataDir, includeArchived: true }).length, 2);
});

test("listEngagements sorts newest-judged first", () => {
  const dataDir = tmpDir();
  const older = upsertEngagement({ client: "C1", title: "Older", url: "https://x/o", judgedAt: "2026-09-01T00:00:00Z", dataDir });
  const newer = upsertEngagement({ client: "C2", title: "Newer", url: "https://x/n", judgedAt: "2026-09-05T00:00:00Z", dataDir });
  assert.deepEqual(
    listEngagements({ dataDir }).map((o) => o.slug),
    [newer.slug, older.slug]
  );
});

test("upsertEngagement rejects an unknown status", () => {
  const dataDir = tmpDir();
  assert.throws(() => upsertEngagement({ client: "X", title: "Y", status: "shortlisted", dataDir }), /status must be one of/);
});

test("record.yaml round-trips as valid YAML", () => {
  const dataDir = tmpDir();
  const rec = upsertEngagement({ client: "Z", title: "Parse me", url: "https://x/z", fitScore: 6, dataDir });
  const parsed = yaml.load(fs.readFileSync(path.join(dataDir, rec.slug, "record.yaml"), "utf-8")) as Record<string, unknown>;
  assert.equal(parsed.slug, rec.slug);
  assert.equal(parsed.title, "Parse me");
});

test("re-upsert without url or posting text still finds the folder via client+title", () => {
  const dataDir = tmpDir();
  const first = upsertEngagement({ client: "Beacon", title: "Rust CLI tool", postingText: "Build a Rust CLI.", dataDir });
  const second = upsertEngagement({ client: "Beacon", title: "Rust CLI tool", fitScore: 7, fitCategory: "good_bet", dataDir });
  assert.equal(second.slug, first.slug);
  assert.equal(fs.readdirSync(dataDir).length, 1);
  assert.equal(second.fit.score, 7);
});

test("upsertEngagement preserves judged_at across a re-upsert (Step 1 create, Step 4 add fit)", () => {
  const dataDir = tmpDir();
  const first = upsertEngagement({ client: "Beacon", title: "Rust CLI", postingText: "build it", dataDir });
  const judgedAt = first.judged_at as string;
  assert.ok(judgedAt);
  // Step 4: re-upsert with the score, no judgedAt passed.
  const second = upsertEngagement({ client: "Beacon", title: "Rust CLI", fitScore: 7, fitCategory: "good_bet", dataDir });
  assert.equal(second.judged_at, judgedAt, "judged_at is set once and preserved");
  assert.notEqual(second.updated_at, judgedAt, "updated_at still moves");
});
