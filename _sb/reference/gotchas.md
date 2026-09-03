# Gotchas

One line each: a constraint we hit the hard way and re-hit whenever it's not written down. The
trap and the rule -- not the story.

- Board links: absolute `file://` only. A Claude client's local-file preview rewrites relative
  URLs against its own hosted-content domain, pointing nowhere.
- Board must work with no JavaScript and no same-page `#fragment` navigation -- sandboxed
  preview panes strip `<script>` and block top-frame anchor navigation.
- Fitment (employer-side score) and Prioritize (candidate-side, `data/strategy.md`) are
  independent. Dependency only ever `prioritize -> fitment`, never back.
- Write a fetcher only after curl/WebFetch of a real sample. Never guess API/HTML shape.
- `macos-13` GitHub runner is retired -- keep it out of CI matrices.
- `reference/surfaces/<name>.md` is facts only -- fields, order, limits, discovery mechanics. No
  positioning advice (that's `surfaces-framework.md` methodology + the user's own `context.md`). A
  shipped file with any "should" in it is the bug -- it must be contributable by someone who
  disagrees with how to build a career.
- The strategic role a surface plays is user-specific and lives in `data/surfaces/<name>/context.md`
  -- derived from `data/strategy.md` + `shared:`, never assumed from the platform or another user.
- Canonical `reference/surfaces/<name>.md` always wins over a private `data/surfaces/<name>/reference.md`.
- A generated surface identity is checked against the user's direction + `context.md`, never against
  whichever tech cluster the Master CV has most evidence for.
- Once content is approved, running a `career-space` renderer/tool is execution, not a new
  decision -- never ask "shall I render / regenerate the PDF now?". Confirm content changes, not
  tool runs.
- Every `vacancy_set_status` / `vacancy_set_archived` is finalized by `render_board` -- the board
  is stale otherwise. Batch the changes, render once at the end, never ask.
- Gmail/Calendar reconciliation is host-composed: the `gmail`/`google-calendar` MCP servers are
  Google-hosted, never wrapped by a `career-space` tool. Email/calendar are read-only evidence;
  `record.yaml` stays canonical. No `sync_gmail()`, no Gmail labels / Google Sheets as trackers.
- `status_history.note` is an explicitly observed transition reason only (what the email said,
  that an interview was booked). Never an inferred cause ("probably too senior") -- omit
  inference. Keeps the field usable for the market-feedback loop instead of a speculation dump.
- Scout auto-runs `reconcile.md` first when an email capability exists -- not a prompt. Reconcile
  itself asks only on ambiguous matches. A reconcile error never blocks the fetch.
