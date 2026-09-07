# career-space concept

The founding thesis and the entity model that follows from it. `architecture.md` is how the
current code is built; `roadmap.md` is what's next; this is the shape everything is meant to grow
toward. Written 2026-09-07; concept agreed, most of it not yet implemented.

## Thesis

career-space manages a person's whole money-making flow. It does not care whether the money comes
from employment, freelance, or a personal brand -- those are modes of the same activity, not
separate products. The chain is `direction -> positioning -> surfaces -> opportunities ->
applications -> market feedback -> (back to direction)`. Opportunity discovery is one downstream
part of that, never the center.

Concretely: the same person, the same Master CV, the same strategy doc, feeds an employment
search *and* an Upwork search *and* (later) a productized-offer catalogue, through one Operator
entry point. Adding a mode is adding a subtype, not standing up a parallel system.

## Entity model

**Opportunity** is the root: a specific, trackable chance to make money or advance the career.
Subtypes so far:

- **vacancy** -- an employment posting. Exists today as `data/vacancies/<slug>/`.
- **order** -- a freelance job (Upwork-style). Not built; see
  `_sb/ideas/freelance-opportunity-source.md`.
- room for more (productized offers, inbound leads) -- not designed, deliberately.

### Shared across all subtypes

- A folder per opportunity: canonical `record.yaml`, the source text (`posting.md` / equivalent),
  generated artifacts (CV, cover/proposal, fitment) written in-place.
- A pipeline expressed as `status` + `status_history` with an observed-reason `note`, plus
  `archived`. The concrete status values can differ per subtype, the mechanism doesn't.
- Deterministic identity: two hashes (source/URL identity, content identity for repost collapse)
  and a deterministic slug.
- A `seen` ledger so re-scanning a source doesn't re-surface or duplicate.
- Fit assessment through the same `fitment.md` + `score_fit.ts` machinery.
- Board rendering from `data/state` by a deterministic renderer to a static page. No web server --
  state is changed by Operator/MCP, the renderer only displays.

### Per-subtype

- The **reasoning-weight order** in fitment. Employment: `strategy -> role fit -> evidence ->
  economics`. Order: `can deliver -> economics -> useful experience -> strategy`. Same clusters,
  different priority.
- The **enrichment fields** on the record (vacancy: seniority, team, location/remote, eligibility;
  order: budget, effort, buyer quality, competition, proposal angle).
- The **fitment criteria** and possibly the status vocabulary.

## Current state

Only `vacancy` exists, and the deterministic layer assumes it everywhere: `listVacancies`,
`render_board`, `seen.jsonl`, slug handling, `workspace_validate` all treat every folder under
`data/vacancies/` as a vacancy. There is no subtype discriminator anywhere yet.

## Target state -- and the wrap-vs-rename question

When a second subtype is built, it gets **its own `data/` root**, not folders mixed into
`data/vacancies/` (a discriminator on every consumer and a filter in every renderer is the wrong
tax). The open question was whether to:

1. add sibling roots (`data/vacancies/`, `data/orders/`, ...), or
2. introduce a parent (`data/opportunities/{vacancies,orders,...}`), or
3. keep one root and wrap it -- the "global Vacancy + personal Opportunity" split from
   `_sb/ideas/hosted-mcp-saas.md`.

**Resolution:** option 3's argument ("wrap, don't rename") is a *multi-tenant hosted* concern --
it exists to share one canonical posting analysis across many users, splitting the shared fact
from each user's personal relationship to it. The local single-user tool has one user and no such
split, so that argument doesn't apply here. Locally the clean shape is a parent:
**`data/opportunities/<subtype>/<slug>/`**. If a hosted version ever happens, the global/personal
split layers on top of that, it doesn't replace it.

**Deferred:** the physical move (`data/vacancies/` -> `data/opportunities/vacancies/`) happens
*with* the first second-subtype build, as one migration informed by that build -- not as a
standalone rename now. A rename today is pure churn across `repo_paths.ts`, `vacancy_store.ts`,
`render_board.ts`, `scout_*`, `workspace_validate.ts`, every playbook, `AGENTS.md`'s data-layout
section, and the live gitignored `data/`, for zero functional gain.
