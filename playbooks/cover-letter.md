# Playbook: cover-letter

Trigger: "напиши кавер на цю вакансію" / "write a cover letter for this" — the candidate pastes a
job posting (or a link/description) in the same message or the one before.

Orchestrator: resolve the vacancy, decide mode and shape, make sure evidence is ready, write from
the matching shape file, save/show/render. This file holds none of the writing technique itself —
that lives in `policies/`, one file per shape so a generation only ever loads the one it needs
(same orchestration/policy split as `cv-targeted.md`/`cv-writing-policy.md`).

Read `policies/generation-rules.md` and `policies/cover-letter-writing-policy.md` (shared rules,
short) first. Don't read `cover-letter-shape-a.md`/`-shape-b.md` yet — that's Step 4, after Step 2
picks one.

## Step 1 — Resolve the vacancy

Run `playbooks/vacancy-resolve.md`. Continue only once you have a `slug` and the full posting
text. The cover letter will be saved into that vacancy folder, never into `data/cover-letters/`.

## Step 2 — Decide mode and shape

Two independent judgment calls. Both are inferred from the posting; ask the candidate when
genuinely unclear rather than silently picking — cheap to ask, more consequential to guess wrong.

**Mode** — controls emphasis: **task-based bid** (a single deliverable, Upwork-style — fixed
price/hourly, a defined piece of work with an end) or **long-term role** (an ongoing position — a
standing job description, "join our team," expected to continue past any one deliverable). Most
postings give enough signal: task postings describe one thing to build, fix, or deliver;
long-term postings describe a role with ongoing responsibilities, a team, and no defined end —
phrasing like "We are seeking a [title]," "Responsibilities include," or "the ideal candidate
will have" is standard long-term/full-time language even when the posting never says "full-time."

**Shape** — controls structure: is this letter likely to be **read by a person**, or likely
**processed by an ATS / a formal corporate pipeline** first? Signals: application channel (a
direct Upwork/email/referral/fractional-advisory engagement vs. a large-company career portal, a
Greenhouse/Lever/Workday-hosted listing), formality of the posting's own language, company size
cues. Fractional/advisory/offer-adjacent engagements read as human-read even when technically
long-term in duration; a formally-posted standard vacancy reads as ATS-likely even when the
company is mid-size. Shape and mode are independent — a long-term role can be either shape, a
task bid usually (not always) reads human-likely.

- Human-read likely → **Shape A** (Problem/Differentiator/Evidence/Scope/Core Message).
- ATS/formal-pipeline likely → **Shape B** (Blocks 1-4: What/Why me/Why them/CTA).

Only a real indicator settles ATS/formal-pipeline-likely on its own: a named or inferable
platform (Greenhouse, Lever, Workday, "our applicant tracking system"), or an explicit statement
that a recruiter/team screens applications. Formal tone, bulleted Responsibilities/Requirements,
a generic "careers page" with no platform named, and company size are each real signal but none of
them settle it alone — a posting can read entirely formally and still land on a founder's or
hiring manager's desk first. Absent a real indicator, treat it as mixed and ask, even if everything
else about the posting reads formally — this is a newer, less-proven judgment call than mode is,
and the ask is cheap.

## Step 3 — Evidence

If `data/vacancies/<slug>/targeting-plan.md` already exists (from an earlier CV or another pass
for this vacancy), read it and reuse its Requirement Evidence section — don't re-derive evidence
independently; a CV and a cover letter for the same vacancy should draw on the same selected
evidence for the same requirement. If it doesn't exist, don't create one just for this letter —
the shape's own Plan step in the policy does its own evidence search inline, same as today.

## Step 4 — Plan, write, self-check

Read only the shape file Step 2 picked — `policies/cover-letter-shape-a.md` or
`policies/cover-letter-shape-b.md`, never both — and follow it in full, in order: Plan (analysis
only) → Write (from the plan alone, not the raw CV) → Self-check (an independent pass against the
plan and the full Master CV, the shared checks in `cover-letter-writing-policy.md` plus whatever
the shape file adds). Keep the three passes genuinely separate steps; see the policy's own note on
why blending them invites invented specifics.

## Step 5 — Save and show

Save to `data/vacancies/<slug>/cover-letter.md`, using the slug Step 1 returned, and show the
final letter in chat. Mention briefly what the self-check caught and fixed, if anything — the
candidate should see that check happened, not just the polished result.

Some application forms have a file-upload field for the cover letter instead of a text box.
Produce a downloadable version as part of finishing: call `render_cover_letter` (MCP tool, or
`node scripts/dist/render_cover_letter.js <file>.md`). It writes `.txt`, `.html`, and `.pdf` next
to the saved draft.
