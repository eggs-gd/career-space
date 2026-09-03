# career-space architecture

`AGENTS.md` defines the execution contract and data layout. This file is the compact
Developer-mode map of the implementation behind that contract.

## Runtime Boundary

Playbooks perform judgment and writing. `scripts/` performs deterministic work: fetching,
filtering, scoring arithmetic, rendering, hashing, vacancy storage, and MCP tool wrapping.
Runtime candidate data stays under gitignored `data/`.

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

## Scout Pipeline

`scout_fetch.ts` fetches configured public sources, applies deterministic prefiltering
(`title_exclude`, `hard_exclude`, location gate, track/signals), collapses same-role reposts, and
drops ids already present in `seen.jsonl`. Returned candidates are judged through
`fitment.md` + `score_fit.ts`; `scout-record-outcomes.md` writes the seen ledger and creates
folders for matched postings.

The prefilter is intentionally cheap. Nuanced eligibility such as
`location_exception_candidate` is classified during fitment and stored in the vacancy record.

## Rendering

`render_resume.ts` and `render_cover_letter.ts` render Markdown artifacts to attachable files.
Output filenames are derived from `data/config.yaml` and sibling `record.yaml` context.

`render_board.ts` writes both:

- `data/board.html`: grouped status dashboard with inline vacancy documents, folder links, local
  highlighting, archive visibility, copy payloads, and location-exception badges.
- `data/board.md`: flat table for handing board state to another agent.

Status/archive changes must end by rendering the board once after the final change.

## MCP Server

`scripts/mcp_server.ts` exposes the deterministic layer as typed tools:

- `render_resume`
- `render_cover_letter`
- `score_fit`
- `scout_fetch`
- `resolve_vacancy_url`
- `vacancy_mark_seen`
- `vacancy_upsert`
- `vacancy_set_status`
- `vacancy_set_archived`
- `vacancy_attach_artifact`
- `vacancy_list`
- `linkedin_searches`
- `render_board`

The MCP handlers are thin wrappers over the same functions used by the CLI fallback.
