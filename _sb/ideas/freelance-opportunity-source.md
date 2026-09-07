# Freelance (Upwork) as an opportunity source

Captured 2026-09-07, scope narrowed same day. Two decoupled phases: **Phase 1** is a manual-fed
freelance flow (paste an order, judge it, record it) -- startable now, and the actual near-term
task. **Phase 2** is the Upwork API fetcher, a later convenience on top of the proven Phase 1
flow. The rule: don't build Phase 2 (or the `order` record schema, or freelance-fitment scoring)
ahead of Phase 1 -- a run on real listings shows which criteria matter; guessing them first is
the throughput trap in a new costume. The extra hand-work in Phase 1 is the point: by the time
the key clears, the flow it plugs into is already understood.

Scope right now is Upwork only. Fiverr / productized offers / outbound leads are explicitly *not*
worked through and not planned -- see the note at the bottom.

## Why now

September 2026: employment applications shifted to fewer, stronger, strategy-checked submissions
(~5-10/day, roughly half local / half western) -- no more August-style volume. That freed
capacity the candidate wants pointed at the same goal (money + work) through freelance. Target
split, roughly: the employment cadence above **plus** 2-5 *very* selective freelance
opportunities/day. Not "20 Upwork proposals a day."

First couple of weeks, Upwork doubles as a market probe: *what concrete problems are people
paying for right now, for someone with this evidence?* Employment feed tests hireability; Upwork
tests sellability. Fits the employment -> fractional transition directly.

## The keeper insight: reasoning weight inverts

Fitment transfers, the weighting doesn't:

- **Employment:** `strategy -> role fit -> evidence -> economics`
- **Upwork:** `can deliver -> economics -> useful experience -> strategy`

Upwork's focus is live cash + fresh commercial evidence + stack expansion. A $1-3k Go/Python/AI
backend contract is a good outcome even if it does nothing for the path to Engineering Director --
it buys money, recent commercial evidence, and a technology line for the CV. The candidate can
supply a focus (which stack to deepen), but strategy alignment is a tie-breaker here, not a gate.

Freelance-fitment criteria raised in discussion, to test against real listings, not fix upfront:
can I actually deliver this well; budget / effort; buyer quality; competition; is there a real
proposal angle; does it pay in money / reputation / positioning.

An Upwork job (an "order") is close to a vacancy but a clearly distinct entity -- the pipeline
maps onto existing statuses (`discovered -> evaluated -> proposed/applied -> conversation -> call
-> won/lost`), the fields don't (budget, buyer history, proposal angle vs. a vacancy's).

## Architecture -- keep in mind, don't build yet

Not a task yet. Just the constraints so a future build isn't a knee-shot:

- When freelance code lands, Upwork orders get their **own `data/` root**, not folders mixed into
  `data/vacancies/`. `listVacancies`, `render_board`, `seen.jsonl`, and slug handling all assume
  every folder under `data/vacancies/` is a vacancy; mixing in orders forces a type discriminator
  on every consumer and a filter in every renderer. (Different case from the roadmap's
  lead-gen/outreach item -- outreach contacts are vacancy-adjacent and hang off `<slug>/`; an
  order is a parallel pipeline.)
- Leave room for a `data/opportunities/{vacancies,orders,...}` parent so consolidating later is a
  planned migration, not a scramble -- but don't move `data/vacancies/` for it now (pure rename,
  zero functional gain today, and the bucket names will shift once the trial run lands).
- UX stays `Operator -> data/state -> deterministic renderer -> static page`, no web server --
  multiply the pattern (a sibling static view with shared header/nav), don't fork it into two
  systems and don't invent a universal mega-schema. Matches the roadmap's "Dashboard, expensive
  path" stance.

## Upwork API reality (checked 2026-09-07)

Official GraphQL API, `api.upwork.com/graphql`, OAuth 2.0 authorization-code flow.

**Readable (what the scout needs):**
- `marketplaceJobPostingsSearch` -- filtered job search (`MarketplaceJobPostingsSearchFilter`,
  search type, sort). The "run daily, see what's there" primitive.
- Job posting detail, freelancer profiles.
- Own contracts / engagements (lifecycle, status).
- Earnings / reporting / transactions -- structured history of what was delivered and for how much.
- Metadata (category / skill lists for filters).

**Not available:**
- Proposal submission -- web only, no API. (Fine -- applies were never going to be automated.)
- Job-match webhooks / real-time new-job alerts -- polling only.
- Messaging for individuals -- behind an enterprise gate, no self-serve OAuth scope.
- No match score, proposal count, or usable client-spend history on a posting.

**Access is the gate:** the developer application is company-oriented (name, website, project
description, expected volume, ecosystem benefit); approval skews to enterprise / ecosystem
partners; individual / personal-automation odds are low. Free and async to submit -- framing as a
personal, single-account, read-only triage assistant helps. Rate limits are fine for a
once-or-twice-daily batch (they bite real-time polling). Key requested 2026-09-07 (read-only
scopes only, matched to the description) -- disabled pending Upwork review.

## Boundaries

- The trial run does **not** wait on API approval -- manual paste of listings, or Claude in
  Chrome with a human in the loop.
- Browser-with-human-in-loop is fine. A scraper baked into scout is not -- against Upwork ToS and
  against the repo's own "no scraping built into career-space" principle (see the lead-gen item).
- If approval lands, the fetcher is small: one GraphQL query in a `scout_sources.ts`-shaped
  module, same contract as the existing feed fetchers.

## Plumbing (safe to build before approval)

The auth + transport layer is invariant to whatever the probe run teaches -- it's the same
regardless of which scoring criteria emerge -- so it can be built and mock-tested now. Kept
deliberately separate from the judgment layer.

- **Auth/config store:** one gitignored file, `data/upwork-auth.json`. Hand-seed `client_id`,
  `client_secret`, `redirect_uri`; the tool writes and rotates `access_token`, `refresh_token`,
  `expires_at`. Not `data/config.yaml` -- `workspace_validate.ts` pins its only top-level key to
  `shared`, and an OAuth token is machine-managed, not hand-edited identity.
- **`scripts/upwork_auth.ts`:** an `authorize` CLI command -- print the authorize URL
  (`https://www.upwork.com/ab/account-security/oauth2/authorize?...`), start a one-shot Node
  `http` server on the `redirect_uri` port, catch `?code=`, exchange it (+ `client_secret`) for
  the token set, persist. `accessToken()` -- return a valid bearer, refreshing on `expires_at`.
  Unit-testable with mocked `fetch`; the browser click is a one-time manual step.
- **`scripts/upwork_client.ts`:** `graphql(query, vars)` -> POST `api.upwork.com/graphql` with
  the bearer, `401 -> refresh once -> retry`. `searchMarketplaceJobs(filter)` wrapping
  `marketplaceJobPostingsSearch`. **Not** in `scout_sources.ts` -- that file's contract is
  "public, unauthenticated, no login" and the authenticated path must stay out of it.
- **`scripts/upwork_probe.ts`:** run `searchMarketplaceJobs` with a filter from argv, dump raw
  JSON + a flat readable list to a scratch path. This is the thing to run the day the key clears.

Churn risk: the `marketplaceJobPostingsSearch` field selection is drafted from docs, unverified
until the key is live -- expect one fix pass. OAuth2, token storage, and the retry wrapper are
standard and stable.

Still **not** now (waits on what the probe shows): the `order` record schema,
`data/opportunities/orders/`, freelance-fitment criteria/scoring, order statuses, any board or
render, and wiring into a playbook.

## First trial run

An experiment, not a feature. Something like:

> Find every Upwork job relevant to me from the last 24 hours. Change nothing in strategy or
> config. Judge each on: can I deliver it well -> money -> useful commercial experience / stack
> -> long-term strategy fit. Show a shortlist and say why these.

30-100 real listings later, the actual criteria, `data/surfaces/upwork`-adjacent context,
scoring, statuses, and UI fall out of what was observed -- not the other way around.

## Out of scope (not planned now)

Fiverr, productized/bounded offers, and outbound leads. Fiverr especially is a different model
(offer management -- gigs, impressions, conversion -- not opportunity search), and the candidate
hasn't worked it through. If it ever happens, recurring buyer-problem clusters from Upwork are
the natural input, not invented gigs. Keep it out of the Upwork entity model.
