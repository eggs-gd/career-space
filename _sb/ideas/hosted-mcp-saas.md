# Hosted career-space via remote MCP -- brainstorm, not started

Captured 2026-08-30. A product/business direction, not a design that's been validated against
real demand -- see `_sb/roadmap.md`'s "Later / maybe" for status. Downstream of the agent-native,
MCP-based architecture already built: this idea only exists because career-space is already
"prompts + deterministic tools an agent calls," not a standalone app.

## The core idea

ChatGPT / Claude / any other AI host already provides the UI, the reasoning runtime, conversation
context, browser/file handling, mobile and desktop apps, and the LLM itself. career-space doesn't
need to rebuild any of that -- it sells only the domain layer, over a remote MCP connection.

```
ChatGPT / Claude / other agent host
              |
        career-space MCP
              |
     Auth + user workspace
              |
 methodology / workflow resolver
 scout / vacancy intelligence
 state / artifacts / renderers
```

A user connects career-space as a remote MCP, goes through OAuth once, and works with their own
career workspace directly inside whichever chat client they already use: "find me vacancies,"
"show me the top 5," "why does this one fit," "make a targeted CV," "reject these three," "what's
worth applying to today." No new app, no new interface to learn.

## Who pays for what

career-space never pays for LLM inference -- the user brings their own ChatGPT/Claude
subscription and their own model tokens. What career-space actually sells is managed methodology,
persistent state, sourcing, integrations, and deterministic intelligence (the same
scout/dedup/scoring/rendering layer this repo already has, just hosted and multi-tenant). A
hosted backend for this is potentially small: auth, a database/storage layer, serverless
MCP/functions, and billing -- not a full application stack. The OSS, self-hosted edition (what
exists today) stays exactly as-is alongside this; hosting is an additional edition, not a
replacement.

## The bigger unlock: a vacancy can be a global entity

A self-hosted, single-user career-space has no reason to separate "the vacancy" from "my
relationship to the vacancy" -- there's only ever one user. A multi-tenant hosted version does:

```
Global Vacancy
  - canonical posting
  - normalized requirements
  - company research
  - tags
  - location/compensation
  - shared analysis

User Opportunity
  - vacancy_id
  - personal fit
  - status
  - CV / cover
  - personal notes
```

One posting gets scraped, deduped, normalized, tagged, and partially analyzed once, shared across
every user instead of once per workspace -- a new user doesn't multiply the full cost of that
intelligence. (This is the same root-entity tension `_sb/roadmap.md`'s lead-gen/outreach item
already flagged -- "vacancy" felt too narrow once contact discovery and non-vacancy signals came
up. A global Vacancy + a personal Opportunity wrapping it resolves that more cleanly than
renaming the root: the shared fact and the personal relationship to it were always two different
things, this just gives them two different scopes instead of forcing one shape to hold both.)

**Scrape location is still an open question, not solved by "check the cache first."** The cache-
first idea (a second user hitting an already-scraped posting completes from cache, only fetches
the delta) genuinely cuts redundant work either way. But "packaged as one hosted MCP" defaults to
the scrape itself running on career-space's own server -- that's where a remote MCP tool executes
by default, regardless of caching. Real per-user-machine distribution (the thing that would
actually keep traffic looking like many individual users instead of one aggregator) needs an
explicit local component actually doing the fetch on the user's own device/session, with the
hosted side only orchestrating and caching -- a real hybrid local+remote design, not something
that falls out for free from "one MCP." Absent that, the honest default is centralized scraping
from shared infrastructure, and the original detection/rate-limit risk stands and needs its own
answer (the standard scraper-ops toolkit -- proxy/IP distribution, respecting rate limits, etc.),
not one this brainstorm has solved.

## A further optimization this suggests -- unproven, needs real data

```
vacancy
    x
candidate archetype
    ->
shared baseline compatibility

shared baseline
    + small personal delta
    ->
personal fitment
```

A given Senior Unity Developer has a large shared capability footprint with other Senior Unity
Developers. Fully re-analyzing the same vacancy from scratch for every similar profile is
wasteful in principle -- compute a reusable baseline once, deterministically find plausible-match
users, and only compute the cheap personal delta for them. Whether this actually holds up in
practice (archetypes clean enough to be useful, deltas actually small and cheap) is its own
hypothesis to test against real data later, not something to build on faith now.

**The real discipline here is a weight that adapts to how distinguishing the candidate's own
evidence actually is, not a fixed ceiling.** This can't become tag-matching wearing a smarter
costume -- candidates already hand recruiters keyword/framework tags today and get filtered like
inventory; the whole point of career-space's fitment is that it judges holistically, not by
bucket. But there's no single safe constant here: a candidate with barely any track record yet
genuinely might be mostly archetype -- shared baseline could legitimately dominate, even 90%+,
because there isn't much personal signal yet to weigh against it. A candidate with two decades of
unusual, specific history might have almost nothing in common with any bucket -- shared baseline
might contribute barely anything, nowhere near even 10%. The weighting has to track how much
genuinely distinguishing personal evidence exists for *this* candidate, not apply the same split
to everyone. What has to hold regardless of the number: shared signal informs, it never
overrides the personal judgment.

## The natural second side: a recruiter package

Once there are roughly 100+ active candidates, a second market side becomes viable:

```
Candidates
    <->
shared labor-market intelligence
    <->
Vacancies
    <->
Recruiters
```

A recruiter doesn't get another raw CV database -- they get a small pool of active, structurally
described candidates where the system already understands capabilities, evidence, career intent,
and vacancy compatibility. The recruiter side could reuse the same MCP for agent-using recruiters,
plus a simple static/Svelte UI for anyone who just wants an ordinary interface.

**This is a real applied need, not a privacy tradeoff to manage.** A single static CV forces a
candidate to pre-censor their own history before anyone sees it -- ran a few businesses, worked
as a night janitor at some point, five leadership roles and one mediocre lead stint: a corporate
recruiter mostly wants to see someone compliant and legible, so most of that gets quietly hidden,
even though a startup or a COO search might see exactly the opposite in the same facts. The
candidate shouldn't have to guess who's looking and pre-filter themselves into one flattened,
safe version. Full, unfiltered history stays with the system; what gets surfaced to a given
recruiter is a selective, relevant slice of it -- intelligent disclosure per opportunity, not one
static document doing double duty for every audience at once. That's the actual point of
separating global Vacancy/shared intelligence from personal Opportunity data in the first place.

## Possible bootstrap path

```
OSS career-space
      ->
Hosted MCP, free early access
      ->
10-100 candidates
      ->
shared vacancy corpus
      ->
invite first recruiters
      ->
real cross-user / cross-side usage
      ->
only then choose monetization
```

The first 10-100 candidates could get lifetime free access -- infrastructure cost is potentially
minimal, and they're the ones who create the initial corpus, real usage patterns, and the supply
side a recruiter package would need to exist at all.

## Possible monetization, later

Something like a ~$10/month candidate subscription (managed infrastructure/intelligence/token
savings) and a meaningfully more expensive recruiter subscription (~$50+, for talent
discovery/matching). A placement fee is a possible third revenue stream, but not a required one.

## What actually matters now: don't close the door

The point isn't to build any of this yet. The point is the current architecture shouldn't
foreclose it by accident: **a vacancy is potentially global; an opportunity is personal.**
Recruiter-side features, archetypes, shared fitments, a marketplace, and pricing should only show
up after real demand, not speculatively ahead of it.

## Framing

Not a classic "AI career SaaS" -- closer to a **vertical SaaS without the SaaS shell**:
career-space owns identity, state, methodology, shared domain intelligence, and integrations;
the AI host provides the UI and the intelligence runtime. Past a certain user count, shared
intelligence also produces real economies of scale -- each additional user increases reuse of
already-collected, already-computed knowledge instead of adding linear inference cost.
