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
- Projection is subtraction: a narrower surface must leave out true/strong/umbrella-level themes
  that don't serve its role -- else every surface converges back to one profile. Shared identity
  recurring is fine; unrelated breadth riding the umbrella is leakage. Don't manufacture
  differences between surfaces either.
- Canonical `reference/surfaces/<name>.md` always wins over a private `data/surfaces/<name>/reference.md`.
- A generated surface identity is checked against the user's direction + `context.md`, never against
  whichever tech cluster the Master CV has most evidence for.
- Once content is approved, running a `career-space` renderer/tool is execution, not a new
  decision -- never ask "shall I render / regenerate the PDF now?". Confirm content changes, not
  tool runs.
- `vacancy_resolve` / `vacancy_set_status` / `vacancy_set_archived` / `record_scout_outcomes` all
  re-render the board themselves when board-visible state changes, MCP or CLI -- don't add a
  manual `render_board` call after them. `vacancy_upsert` is the exception: it doesn't auto-render
  (it's the lower-level primitive the others are built on), so a playbook calling it directly still
  owns rendering after.
- Reconciliation consumes whatever email/calendar capability the host has (connector, plugin, or
  a user-added MCP server) -- career-space ships and wires none of it, and mandates no account or
  cloud project (that would break "no server, no app, no account"). Host-composed, never wrapped
  by a `career-space` tool. Email/calendar are read-only evidence; `record.yaml` stays canonical.
  No `sync_gmail()`, no Gmail labels / Google Sheets as trackers.
- `status_history.note` is an explicitly observed transition reason only (what the email said,
  that an interview was booked). Never an inferred cause ("probably too senior") -- omit
  inference. Keeps the field usable for the market-feedback loop instead of a speculation dump.
- Scout auto-runs `reconcile.md` first only when a **working** email-read tool exists -- one that
  succeeds, not one whose name is merely visible. A connector shown in the host UI (`@Gmail`, an
  unauthenticated MCP server) can still fail with `Auth required`; reconcile treats that as
  "present but unauthorized" (tell the candidate what to connect, never authorize it yourself),
  distinct from "no capability". Scout skips silently either way -- no setup nagging per run.
- Reconcile also accepts a pasted summary from another agent that has mailbox access -- treat it
  as the observations, lean toward "needs confirmation".
- `score_fit`'s `render()` returns markdown with no `score`; `evaluate()` returns the structured
  result. `record_scout_outcomes` needs `evaluate()`. Don't drop to the local `posting_ids` /
  `score_fit` modules to hand-record an unsupported-URL vacancy -- `record_scout_outcomes` takes a
  candidate with no `posting_id`/`content_id` and computes them.
- `record_scout_outcomes` candidate ids are both-or-neither (one alone throws). On the no-ids
  path `recordScoutOutcome` passes `undefined` through to `upsertVacancy` (not the computed pair)
  so the record gets `id_source: manual` and still merges onto an existing company+title record
  instead of duplicating -- `markSeen` gets the computed ids, the upsert resolves its own.
- Skill stacking is not free: route to the smallest needed playbook/reference, compose instead of
  copying semantics, and move deterministic checks into scripts/MCP.
- MCP server type-check slowness often means SDK/zod compatibility trouble -- check dependency
  versions before blaming tool schemas.
- Cover letter mode (task/long-term, emphasis) and shape (human-read vs ATS-likely, structure) are
  independent judgment calls -- a long-term role can be either shape, don't conflate them. Never
  force-create `targeting-plan.md` just to write a cover letter; reuse it only when it already
  exists.
