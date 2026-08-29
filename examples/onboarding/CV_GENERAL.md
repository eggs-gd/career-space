# Alex Morgan
> Senior Backend Developer

## About
<!-- audience: fit, planner -->
Backend-focused software developer with about 7 years of experience, mostly working within
existing codebases and existing team processes rather than building things from scratch.

Comfortable across the ordinary backend lifecycle: implementing features, integrating
third-party APIs, fixing performance problems, participating in migrations, reviewing code, and
helping ship releases on schedule. Occasionally mentors a junior developer joining the team.

Primary stack: Python, TypeScript, PostgreSQL, Docker.

I work well when the codebase and process already exist and the job is to get the next piece of
work done cleanly — not to redesign how the team operates.

## Recurring Pattern
<!-- audience: fit, planner -->

- Often becomes the person who fixes neglected backend tasks nobody else has gotten to.
- Prefers incremental changes over large rewrites.
- Usually helps get delayed features across the finish line.
- Tends to simplify code once requirements become clearer, rather than over-designing early.

## Experience
<!-- audience: fit, planner, validator -->

### Northgate Software

**Senior Backend Developer**
> Mar 2022 – Present

Backend developer on a small product team building a scheduling and billing platform for small
businesses.

Key achievements:

- Regularly asked to add one-off features to a shared, already-in-use API layer without breaking
  either of the two existing clients depending on it — implemented these end-to-end, from
  endpoint to database schema, without a compatibility break in either client.
- Failed payments were occasionally getting silently dropped instead of retried, generating a
  handful of support tickets most months — integrated two third-party payment providers with
  webhook-based reconciliation and automatic retries, bringing that category of ticket down to
  close to zero.
- Diagnosed a recurring slowdown in a reporting endpoint — a missing index plus an unbatched
  query loop — and fixed it, cutting average response time from several seconds to under one.
- The main service had grown large enough that deploys were slow and an unrelated change would
  regularly break something else — participated in migrating it into a smaller set of services
  alongside two other backend developers, personally taking two of the extracted services from
  design through deployment.
- Reviews pull requests regularly and mentors a junior developer who joined the team last year.

**Skills:**
- Python
- PostgreSQL
- Docker
- REST APIs
- Celery
- Redis

### Vantage Consulting

**Backend Developer**
> Jun 2019 – Feb 2022

Outsourcing-firm developer, assigned across two client projects over this period: an internal
tooling dashboard, then a logistics-tracking backend.

Key achievements:

- Built and maintained REST APIs consumed by both a web client and a mobile app.
- Inherited a codebase from a previous vendor with a backlog of long-standing bugs the client had
  been living with — worked through a batch of them over a few months, bringing the client's open
  bug count down from around 30 to under 10.
- One client project had no automated tests running at all, so regressions typically weren't
  caught until the client noticed them after release — set up a CI pipeline running the existing
  test suite on every commit, catching most regressions before release instead of after.
- Delivered assigned work on schedule across both projects, coordinating scope directly with each
  client's product manager.

**Skills:**
- TypeScript
- Node.js
- PostgreSQL
- CI/CD
- Docker

### Fernbridge Systems

**Software Developer**
> Aug 2017 – May 2019

First professional developer role, on a small team building an internal inventory-management
tool.

Key achievements:

- Implemented smaller features under guidance from senior developers on the team.
- Fixed bugs reported by the small internal user base.
- Wrote and maintained unit tests for the parts of the codebase touched day to day.

**Skills:**
- Python
- SQL
- Git

## Voice Material
<!-- audience: writer -->

Raw material for personality-forward writing (Upwork proposals, pitches, cover letters) — not
meant to be quoted verbatim in a neutral corporate CV or LinkedIn text.

- "I can dig in if it's needed, or not — whatever the task actually calls for."
- "Mostly it just has to work."
- "I like finishing on time."
- "If there's a simpler way to do it, do the simpler way."

Work beliefs:
- Don't overcomplicate something that doesn't need it.
- Shipping something that works beats endlessly polishing it.
- A good workday ends on time.

## Evidence Interpretation Notes
<!-- audience: writer, planner, validator -->

Candidate-specific notes for interpreting the evidence above when generating CVs, LinkedIn text,
platform profiles, fitment reads, or cover letters.

**Ownership map.** The Northgate Software work is personally owned and driven end-to-end. The
service migration at Vantage Consulting was a shared team effort across three developers, not
solo-owned — don't upgrade "participated in" into "led" when generating targeted CVs.
