# career-space concept

The entity model and the invariant that holds it in place. `architecture.md` is how the code is
built; `roadmap.md` is what's next; this is the shape it grows toward.

## Two decisions, not N channels

Everything career-space assesses is an **opportunity** — a specific, trackable chance to be paid
for work. There are exactly two kinds, distinguished by the decision being made, not the platform
it arrived on:

- **Employment** — *should they hire me for role X?* Assessed against role requirements ↔
  candidate evidence, weighted by career strategy.
- **Engagement** — *should we take on outcome X for this counterparty on these terms?* Assessed
  against a deliverable ↔ capability evidence, weighted by commercial constraints (budget/effort,
  scope clarity, mandatory constraints, counterparty quality, win probability) and strategic
  value.

A job board vacancy, an Upwork job, a Fiverr order, a warm inbound lead, a direct client email —
these are all **Engagement** (or the vacancy, **Employment**). The signals available differ by
channel (a marketplace exposes client rating / spend / hire rate; a direct lead exposes none),
and the moment of assessment differs (published demand you choose to bid on vs. an inbound order
you choose to accept). The *questions* don't: can we deliver it, is it proven by evidence, is the
scope clear, are there mandatory constraints, is the money/time adequate, is the counterparty
sound, is it worth it. One fitment model per decision, not per platform.

### The invariant

> Platform mechanics may change the signals available, but must not create a new opportunity type
> or a new fitment model. Add a fitment model only when the underlying decision is *semantically*
> different from "should they hire me" and "should we take this on".

Anything upstream of a concrete opportunity — which surfaces to build, which productized offers to
design, how to warm a market — is positioning / offer design, not opportunity assessment. It
belongs in the candidate's own strategy/context material, not in a third opportunity type.

## Entity model

```
Opportunity
├── Employment   -- data/vacancies/<slug>/   (built)
└── Engagement   -- data/engagements/<slug>/ (skeleton built; judgment schema still settling)
```

### Shared across both

- A folder per opportunity: canonical `record.yaml`, the source text (`posting.md`), generated
  artifacts (CV, cover letter / proposal, `fitment.md` + `fitment.json`) written in-place.
- A pipeline: `status` + `status_history` (with an observed-reason `note`) + `archived`. Both
  currently share `VALID_STATUSES`; the mechanism is fixed even where the vocabulary later isn't.
- Deterministic identity (source/URL hash, content hash for repost collapse) and a slug.
- Fit assessment through the same `fitment.md`-shaped judgment → `score_fit.ts` arithmetic. The
  clusters and their `importance` tiers differ; the formula and its caps don't.
- Board rendering from `data/` state by a deterministic renderer to a static page — no web
  server, state changed only by Operator/MCP, one board per opportunity type sharing a nav.

### Different per type

- **Cluster weighting.** Employment leads with strategy/role-fit; Engagement leads with
  deliverability and economics (strategy is a tie-breaker). Same `score_fit` formula.
- **Enrichment fields** on the record (Employment: seniority, team, location/remote, eligibility;
  Engagement: budget, effort, counterparty quality, competition, proposal angle — still
  provisional, learned from real runs rather than fixed upfront).

## Data layout

Each type gets its own top-level `data/` root — `data/vacancies/` and `data/engagements/` — not
folders mixed under one root (that forces a type discriminator on every consumer and a filter in
every renderer). `data/vacancies/` is not renamed to `data/opportunities/vacancies/` now: pure
churn for zero functional gain. If an `data/opportunities/` parent is ever wanted, both roots move
under it together, in one migration.

`vacancy_store.ts`'s `scope: { dataDir }` seam made the second store cheap: `engagement_store.ts`
points `setStatus` / `setArchived` / `attachArtifact` at `data/engagements/` unchanged and adds
`upsertEngagement` / `listEngagements` for the leaner engagement record. `render_engagement.ts`
mirrors `render_board.ts` (`data/engagements.html` + `.md`), sharing the head template and the
`[ Employment | Engagements ]` nav.

## Current state

Employment is fully built. Engagement has its skeleton — `engagement_store.ts`,
`render_engagement.ts`, `engagement_*` MCP/CLI, `workspace_validate` coverage,
`playbooks/engagement-fitment.md` — mirroring the Employment pipeline. Not built: an automated
source for engagements (a platform API adapter), a seen ledger for one, and the settled
engagement judgment schema.
