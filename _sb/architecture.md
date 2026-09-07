# career-space architecture

`AGENTS.md` defines the execution contract and data layout. This file is the compact
Developer-mode map of the implementation behind that contract.

## Runtime Boundary

Playbooks perform judgment and writing. `scripts/` performs deterministic work: fetching,
filtering, scoring arithmetic, rendering, hashing, vacancy storage, workspace validation, and MCP
tool wrapping. Runtime candidate data stays under gitignored `data/`.

## Vacancy Identity

Every posting has two hashes:

- `posting_id`: source/URL identity.
- `content_id`: company/title/description identity for same-role repost collapse.

`vacancyStore.upsertVacancy` resolves a vacancy folder by exact posting id first, then by
company/title reconciliation when appropriate. The folder slug is deterministic:
`<company-title-prefix>-<posting_id-prefix>`.

## Vacancy Record

`data/vacancies/<slug>/record.yaml` is the canonical metadata record:

- identity: `slug`, `posting_id`, `content_id`, `id_source`, `company`, `title`, URLs.
- pipeline: `status`, `status_history`, `archived`.
- scout metadata: `location`, `remote`, `source`, `posted_at`, `track_label`.
- fit index: `fit.score`, `fit.category`, `fit.reason`.
- eligibility flags: `eligibility.location.status` and optional reason.

Omitted enrichment fields mean "no opinion"; existing values are preserved. `new` is an initial
status, not a regression target for an existing record. `status_history.note` is only for an
explicitly observed transition reason.

## Engagements

`engagement_store.ts` is the vacancy store's sibling for the Engagement opportunity type (see
`_sb/concept.md`). Engagements live in `data/engagements/<slug>/` (a flat sibling of `data/vacancies/`,
never nested). `record.yaml` carries `client` / `title` / `url` / `status` / `status_history` /
`fit` / `judged_at` — leaner than a vacancy record (no `posting_id`/`content_id`/`eligibility`/
`track_label`). Engagements share `VALID_STATUSES` with vacancies: `setEngagementStatus`/`setEngagementArchived`
are `vacancy_store`'s own `setStatus`/`setArchived` pointed at `data/engagements/` via the
`scope: { dataDir }` seam. `upsertEngagement` and `listEngagements` are engagement-specific. `render_engagement.ts`
writes `data/engagements.html` + `data/engagements.md`, sharing the head template and nav with the
vacancy board. No seen ledger yet (there is no automated engagement source yet).

## Fitment persistence and re-scoring

The agent's structured judgement (`job_summary` / `clusters` / evidence levels / `risk` / `appeal`
/ `fit_category`) is the model half; `score_fit.ts`'s weighted formula + caps + Markdown render is
the deterministic half. `score_fit.persistFitment(assessment, dir)` writes both `fitment.json`
(the input, verbatim) and `fitment.md` (the render) into a vacancy/engagement folder — invoked by the
`score_fit` tool's `out_dir`, and by `vacancy_store.recordScoutOutcome` on the scout path (where
the folder doesn't exist at judge time). An agent never hand-writes a fitment file.

`rescore.ts` walks every `data/{vacancies,engagements}/*/fitment.json`, re-runs `score_fit.evaluate`,
and (with `--write`) updates `record.yaml`'s `fit.score`/`fit.category`, rewrites `fitment.md`, and
re-renders both boards. This is how a scoring-formula change propagates to existing records without
re-running the model. Folders without a `fitment.json` (older records, or ones tracked via
cover-letter/cv-targeted without a fitment run) are reported as not replayable.

## Scout Pipeline

`scout_fetch.ts` fetches configured public sources, applies deterministic prefiltering
(`title_exclude`, `hard_exclude`, location gate, track/signals), collapses same-role reposts, and
drops ids already present in `seen.jsonl`. Returned candidates are judged through
`fitment.md` + `score_fit.ts`; `record_scout_outcomes` writes the seen ledger and creates folders
for matched postings.

The prefilter is intentionally cheap. Nuanced eligibility such as
`location_exception_candidate` is classified during fitment and stored in the vacancy record.

## Rendering

`render_resume.ts` and `render_cover_letter.ts` render Markdown artifacts to attachable files.
Output filenames are derived from `data/config.yaml` and sibling `record.yaml` context.

`render_board.ts` writes both:

- `data/board.html`: grouped status dashboard with inline vacancy documents, folder links, local
  highlighting, archive visibility, copy payloads, and location-exception badges.
- `data/board.md`: flat table for handing board state to another agent.

MCP status/archive changes return fresh board paths.

## Validation

`workspace_validate.ts` reports deterministic `data/` layout and schema issues without generating
artifacts. It validates config shape, scout source config, vacancy records, artifact placement,
surface context files, and known enum values.

## MCP Server

`scripts/mcp_server.ts` exposes the deterministic layer as typed tools:

- `render_resume`
- `render_cover_letter`
- `score_fit`
- `scout_fetch`
- `resolve_vacancy_url`
- `vacancy_resolve`
- `vacancy_mark_seen`
- `record_scout_outcomes`
- `vacancy_upsert`
- `vacancy_set_status`
- `vacancy_set_archived`
- `vacancy_attach_artifact`
- `vacancy_list`
- `linkedin_searches`
- `render_board`
- `workspace_validate`
- `rescore`
- `engagement_upsert`
- `engagement_set_status`
- `engagement_set_archived`
- `engagement_attach_artifact`
- `engagement_list`
- `render_engagement`

The MCP handlers are thin wrappers over the same functions used by the CLI fallback.
