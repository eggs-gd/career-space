import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as vacancies from "./vacancy_store";
import * as engagements from "./engagement_store";

/** Runs one CLI command the way `cli()` would -- parsed argv in, a throwaway data dir, a counter
 * where the board refresh would be. */
function runner(mod: { parseCli: (args?: string[]) => { values: any }; CLI_COMMANDS: Record<string, (v: any, c: any) => unknown> }) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "career-space-cli-"));
  const state = { renders: 0 };
  const run = (command: string, ...args: string[]): any => {
    const { values } = mod.parseCli(args);
    const handler = mod.CLI_COMMANDS[command];
    assert.ok(handler, `no such command ${command}`);
    return handler(values, { dataDir, renderBoards: () => void (state.renders += 1) });
  };
  return { dataDir, state, run };
}

test("vacancy CLI: upsert, status, archive, artifact, list, find, alias and resolve round-trip", () => {
  const { dataDir, state, run } = runner(vacancies);
  const upserted = run("upsert", "--company", "Acme", "--title", "Head of Eng", "--url", "https://acme.test/jobs/1", "--source", "linkedin", "--fit-score", "7", "--status", "tracked");
  const slug = upserted.slug as string;
  assert.ok(slug);

  assert.deepEqual(run("mark-seen", "--posting-id", "p1", "--content-id", "c1", "--outcome", "rejected", "--company", "Other", "--title", "T"), { ok: true });

  assert.equal(run("set-status", "--slug", slug, "--status", "applied", "--note", "sent").status, "applied");
  assert.equal(run("set-archived", "--slug", slug, "--archived", "false").archived, false);
  assert.equal(state.renders, 2, "status and archive refresh the boards");

  const note = path.join(dataDir, "cv.md");
  fs.writeFileSync(note, "# cv");
  assert.match(run("attach-artifact", "--slug", slug, "--kind", "cv", "--path", note).path, /cv\.md$/);

  assert.equal(run("list").length, 1);
  assert.equal(run("list", "--status", "rejected").length, 0);
  assert.equal(run("find", "--url", "https://acme.test/jobs/1")[0].slug, slug);
  assert.deepEqual(run("add-alias", "--slug", slug, "--source", "djinni", "--url", "https://djinni.co/jobs/9-x/"), { added: true });
  assert.equal(run("find", "--url", "https://djinni.co/jobs/9-x/")[0].matched_by, "also_seen");

  const before = state.renders;
  assert.equal(run("resolve", "--slug", slug, "--location", "Remote").changed, true);
  assert.equal(state.renders, before + 1);
  assert.equal(run("resolve", "--slug", slug).changed, false);
  assert.equal(state.renders, before + 1, "an unchanged resolve does not refresh the boards");

  assert.deepEqual(run("relocate-archived"), { moved: [], conflicts: [] });
});

test("vacancy CLI: record-scout-outcomes accepts a bare list or a wrapper and refreshes only on a match", () => {
  const { dataDir, state, run } = runner(vacancies);
  const item = (title: string, score: number) => ({
    candidate: { company: "Acme", title, job_post_text: "text", url: `https://acme.test/${title}` },
    fit: { score, fit_category: "stretch_fit", reason: "r", markdown: "## Match\n" },
  });
  const wrapped = path.join(dataDir, "wrapped.json");
  fs.writeFileSync(wrapped, JSON.stringify({ min_fit_score: 4, items: [item("Low", 2)] }));
  assert.equal(run("record-scout-outcomes", "--input", wrapped)[0].outcome, "rejected");
  assert.equal(state.renders, 0);

  const bare = path.join(dataDir, "bare.json");
  fs.writeFileSync(bare, JSON.stringify([item("High", 8)]));
  assert.equal(run("record-scout-outcomes", "--input", bare)[0].outcome, "matched");
  assert.equal(state.renders, 1);

  const empty = path.join(dataDir, "empty.json");
  fs.writeFileSync(empty, "[]");
  assert.throws(() => run("record-scout-outcomes", "--input", empty), /no items/);
});

test("vacancy CLI: missing or invalid arguments are rejected with the usage line", () => {
  const { run } = runner(vacancies);
  assert.throws(() => run("mark-seen"), /mark-seen requires/);
  assert.throws(() => run("upsert", "--company", "A"), /upsert requires/);
  assert.throws(() => run("upsert", "--company", "A", "--title", "T", "--status", "bogus"), /--status must be one of/);
  assert.throws(() => run("upsert", "--company", "A", "--title", "T", "--eligibility-location-status", "bogus"), /eligibility-location-status/);
  assert.throws(() => run("set-status"), /set-status requires/);
  assert.throws(() => run("set-archived", "--slug", "x", "--archived", "maybe"), /set-archived requires/);
  assert.throws(() => run("attach-artifact"), /attach-artifact requires/);
  assert.throws(() => run("add-alias"), /add-alias requires/);
  assert.throws(() => run("record-scout-outcomes"), /--input/);
  assert.throws(() => run("resolve", "--status", "bogus"), /--status must be one of/);
  assert.ok(Object.keys(vacancies.CLI_COMMANDS).includes("resolve"));
});

test("vacancy CLI: an upsert with an eligibility status stores it on the record", () => {
  const { run } = runner(vacancies);
  const record = run("upsert", "--company", "Acme", "--title", "CTO", "--eligibility-location-status", "open_remote", "--eligibility-location-reason", "fully remote");
  assert.equal(record.eligibility.location.status, "open_remote");
});

test("engagement CLI: upsert, status, archive, artifact, list and relocate round-trip", () => {
  const { dataDir, state, run } = runner(engagements);
  const upserted = run("upsert", "--client", "Nimbus", "--title", "Go sync", "--url", "https://upwork.test/1", "--fit-score", "8", "--fit-category", "good_bet");
  const slug = upserted.slug as string;
  assert.ok(slug);
  assert.equal(run("set-status", "--slug", slug, "--status", "applied").status, "applied");
  assert.equal(run("set-archived", "--slug", slug, "--archived", "false").archived, false);
  assert.equal(state.renders, 3, "upsert, status and archive refresh the boards");

  const note = path.join(dataDir, "proposal.md");
  fs.writeFileSync(note, "# proposal");
  assert.match(run("attach-artifact", "--slug", slug, "--kind", "proposal", "--path", note).path, /proposal\.md$/);
  assert.equal(state.renders, 3, "attaching leaves the board to the next status call");

  assert.equal(run("list").length, 1);
  assert.deepEqual(run("relocate-archived"), { moved: [], conflicts: [] });
});

test("engagement CLI: missing arguments are rejected with the usage line", () => {
  const { run } = runner(engagements);
  assert.throws(() => run("upsert"), /upsert requires --title/);
  assert.throws(() => run("set-status"), /set-status requires/);
  assert.throws(() => run("set-archived", "--slug", "x"), /set-archived requires/);
  assert.throws(() => run("attach-artifact"), /attach-artifact requires/);
});
