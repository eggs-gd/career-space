import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { pdfLaunchBlocker, renderBoardHtml, renderEngagementsHtml, renderEngagementsMd, writePdfDetailed } from "./rendering";

test("board renders location-exception metadata as a visible badge", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "career-space-board-"));
  const slug = "acme-principal-engineer-a1b2c3d4";
  fs.mkdirSync(path.join(root, slug), { recursive: true });

  const html = renderBoardHtml(
    [
      {
        slug,
        status: "new",
        company: "Acme",
        title: "Principal Engineer",
        fit_score: 9,
        track_label: "technical",
        url: "https://example.com/jobs/1",
        updated_at: "2026-09-01T10:00:00Z",
        location: "Remote, UK / Ireland / Poland",
        archived: false,
        eligibility: {
          location: {
            status: "location_exception_candidate",
            reason: "Remote scope lists nearby markets but no hard legal blocker.",
          },
        },
        files: [],
      },
    ],
    { vacancyDirFn: (s) => path.join(root, s) }
  );

  assert.match(html, /class="vrow location-exception"/);
  assert.match(html, /Location exception/);
  assert.match(html, /Remote scope lists nearby markets but no hard legal blocker/);
});

test("board renders an interview-prep.md file as a '💡 prep' badge with its content", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "career-space-board-"));
  const slug = "acme-principal-engineer-a1b2c3d4";
  fs.mkdirSync(path.join(root, slug), { recursive: true });
  fs.writeFileSync(path.join(root, slug, "interview-prep.md"), "# Interview thesis\n\nRemember this candidate as the one who restructures ambiguous systems.\n");

  const html = renderBoardHtml(
    [
      {
        slug,
        status: "interview",
        company: "Acme",
        title: "Principal Engineer",
        fit_score: 8,
        url: "https://example.com/jobs/1",
        updated_at: "2026-09-02T10:00:00Z",
        archived: false,
        files: ["interview-prep.md"],
      },
    ],
    { vacancyDirFn: (s) => path.join(root, s) }
  );

  assert.match(html, /<summary>💡 prep<\/summary>/);
  assert.match(html, /Remember this candidate as the one who restructures ambiguous systems/);
});

test("board renders communication.md as a quoted communication badge", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "career-space-board-"));
  const slug = "acme-principal-engineer-a1b2c3d4";
  fs.mkdirSync(path.join(root, slug), { recursive: true });
  fs.writeFileSync(
    path.join(root, slug, "communication.md"),
    "# Communication\n\nSummary:\nInterview invite received.\n\n## 2026-09-11 — Recruiter email\n\nSource: Gmail\n\n> We would like to invite you.\n"
  );

  const html = renderBoardHtml(
    [
      {
        slug,
        status: "interview",
        company: "Acme",
        title: "Principal Engineer",
        fit_score: 8,
        url: "https://example.com/jobs/1",
        updated_at: "2026-09-02T10:00:00Z",
        archived: false,
        files: ["communication.md"],
      },
    ],
    { vacancyDirFn: (s) => path.join(root, s) }
  );

  assert.match(html, /<summary>📨 comm<\/summary>/);
  assert.match(html, /Interview invite received/);
  assert.match(html, /We would like to invite you/);
});

test("engagements board groups by status, shows category, shares the Employment/Engagements nav", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "career-space-eng-board-"));
  const slug = "nimbus-go-invoice-sync-91911bfa";
  fs.mkdirSync(path.join(root, slug), { recursive: true });
  fs.writeFileSync(path.join(root, slug, "fitment.md"), "## Match: 8/10 — good bet\n\nStrong Go overlap.\n");

  const engagements = [
    {
      slug,
      status: "tracked",
      client: "Nimbus",
      title: "Go invoice sync",
      url: "https://www.upwork.com/jobs/~01",
      fit_score: 8,
      fit_category: "good_bet",
      judged_at: "2026-09-05T10:00:00Z",
      archived: false,
      files: ["fitment.md", "record.yaml"],
    },
  ];

  const html = renderEngagementsHtml(engagements, { engagementDirFn: (s) => path.join(root, s) });
  assert.match(html, /class="board-nav"/);
  assert.match(html, /class="board-nav-current">Engagements</);
  assert.match(html, /<a href="vacancies\.html">Employment<\/a>/);
  assert.match(html, />Tracked <span class="n">\(1\)</);
  assert.match(html, /good_bet/);
  assert.match(html, /Strong Go overlap/);

  const md = renderEngagementsMd(engagements);
  assert.match(md, /# Engagements board/);
  assert.match(md, /\| tracked \| 8 \| good_bet \| Nimbus \| Go invoice sync \|/);
});

test("pdfLaunchBlocker stops a macOS launch inside an OS sandbox before the first attempt", () => {
  assert.match(pdfLaunchBlocker({ CODEX_SANDBOX: "seatbelt" }, "darwin") ?? "", /CODEX_SANDBOX=seatbelt.*outside the sandbox/);
  assert.match(pdfLaunchBlocker({ SANDBOX_RUNTIME: "1" }, "darwin") ?? "", /SANDBOX_RUNTIME/);
  assert.equal(pdfLaunchBlocker({}, "darwin"), null);
  assert.equal(pdfLaunchBlocker({ CODEX_SANDBOX: "seatbelt" }, "linux"), null);
  assert.equal(pdfLaunchBlocker({ CODEX_SANDBOX: "seatbelt", CAREER_SPACE_PDF_FORCE: "1" }, "darwin"), null);
});

test("writePdfDetailed reports the sandbox reason and writes no PDF", async () => {
  const saved = { sandbox: process.env.CODEX_SANDBOX, force: process.env.CAREER_SPACE_PDF_FORCE };
  const realPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
  process.env.CODEX_SANDBOX = "seatbelt";
  delete process.env.CAREER_SPACE_PDF_FORCE;
  Object.defineProperty(process, "platform", { value: "darwin" });
  const errors: string[] = [];
  const origError = console.error;
  console.error = (...a: unknown[]) => void errors.push(a.join(" "));
  try {
    const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "career-space-pdf-")), "cv.pdf");
    const result = await writePdfDetailed("<p>x</p>", out);
    assert.equal(result.ok, false);
    assert.match(result.reason ?? "", /OS sandbox/);
    assert.equal(fs.existsSync(out), false);
    assert.match(errors.join("\n"), /PDF skipped/);
  } finally {
    console.error = origError;
    Object.defineProperty(process, "platform", realPlatform);
    if (saved.sandbox === undefined) delete process.env.CODEX_SANDBOX; else process.env.CODEX_SANDBOX = saved.sandbox;
    if (saved.force !== undefined) process.env.CAREER_SPACE_PDF_FORCE = saved.force;
  }
});
