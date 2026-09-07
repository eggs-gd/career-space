import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { renderBoardHtml, renderEngagementsHtml, renderEngagementsMd } from "./rendering";

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

test("board renders an interview-prep.md file as a 'prep' badge with its content", () => {
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

  assert.match(html, /<summary>prep<\/summary>/);
  assert.match(html, /Remember this candidate as the one who restructures ambiguous systems/);
});

test("engagements board groups by status, shows category, shares the Employment/Engagements nav", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "career-space-eng-board-"));
  const slug = "nimbus-go-invoice-sync-91911bfa";
  fs.mkdirSync(path.join(root, slug), { recursive: true });
  fs.writeFileSync(path.join(root, slug, "fitment.md"), "## Match: 8/10 — good bet\n\nStrong Go overlap.\n");

  const orders = [
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

  const html = renderEngagementsHtml(orders, { engagementDirFn: (s) => path.join(root, s) });
  assert.match(html, /class="board-nav"/);
  assert.match(html, /class="board-nav-current">Engagements</);
  assert.match(html, /<a href="board\.html">Employment<\/a>/);
  assert.match(html, />Tracked <span class="n">\(1\)</);
  assert.match(html, /good_bet/);
  assert.match(html, /Strong Go overlap/);

  const md = renderEngagementsMd(orders);
  assert.match(md, /# Engagements board/);
  assert.match(md, /\| tracked \| 8 \| good_bet \| Nimbus \| Go invoice sync \|/);
});
