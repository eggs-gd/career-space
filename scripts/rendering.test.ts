import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { renderBoardHtml } from "./rendering";

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
