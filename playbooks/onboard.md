# Playbook: onboard

Trigger: "зроби мені онборд" / "set me up" / no `data/CV_GENERAL.md` exists yet and the candidate
asks for anything else.

Goal: produce `data/CV_GENERAL.md` (the Master CV — narrative evidence: achievements, recurring
pattern, candidate-specific evidence interpretation notes, and voice material), `data/config.yaml`'s
`shared:` block (professional identity, commercial directions, differentiators, core identity
thesis, plus concrete facts: contacts, certifications, education, languages), and initial
`data/role-profiles/*.md` from a conversation. Read
`policies/generation-rules.md` first — everything you write here is held to it.

If `data/CV_GENERAL.md` and `data/config.yaml` already exist, don't run onboarding from scratch.
If `data/role-profiles/` is missing or empty, run only Step 5 from the existing Master CV/config.
Otherwise ask whether the candidate wants to add something new (a recent role/project) or revise
positioning, and go straight to that instead of re-interviewing everything.

## Step 0 — check your own setup, before asking the candidate anything

Check the machine, don't ask the candidate to guess what's missing:

- **`scripts/dist/`** (check `scripts/dist/mcp_server.js` exists) — powers PDF export, the real
  deterministic fitment score, and the scout. If the `career-space` MCP server is connected, this
  almost certainly already exists -- `scripts/mcp_bootstrap.js` builds it on first connection,
  before you'd even reach this step. If it's still missing (no MCP host, or MCP not connected),
  offer to run the one-time setup right now (`npm install && npm run build` in this repo). If
  declined, continue onboarding anyway — the interview and file-writing below don't need it — but
  mention that without it, cover letters/CVs stay chat-text-only (no PDF) and fitment has no real
  score to compute, so it's worth coming back to before actually using either.
- **`design-patterns` MCP** (see `docs/development.md`) — for
  editing career-space's own playbooks/scripts, not for a candidate's job search. Don't check for
  it at all unless the candidate says they're also planning to
  develop career-space itself; for anyone else, skip this entirely, don't bring it up unprompted.
  If they do say that: check `node` on `PATH` and whether `$HOME/.agents/design_patterns_mcp`
  exists (don't just try the tools and see), offer to set up
  whatever's missing, and drop it immediately with no follow-up nudge if they decline.

## Step 1 — gather raw material

If you need a model of the expected end state, inspect `examples/onboarding/` and
`examples/role-profiles/` for shape and level of specificity. These are examples only: never copy
their facts, achievements, role claims, contact details, search tracks, or profile contents into a
real candidate's `data/`.

Ask for whatever they have: an existing resume/CV file, a LinkedIn export or profile URL/text,
any prior cover letters, notes. Read everything provided in full before asking anything else — a
lot of what you need is probably already in there.

## Step 2 — interview for what a document doesn't say

A resume states what happened; it rarely states scope of ownership, or the strategic layer this
whole repo runs on. Ask, preferring structured yes/no/multiple-choice over open text where you
can:

- **Ownership, per notable achievement.** Did you personally drive this end-to-end, or contribute
  to something someone else owned/decided? This is the single most consequential fact per
  achievement — get it right rather than assuming from a resume's confident phrasing. See
  `policies/generation-rules.md`'s "Ownership language" section for why this matters downstream.
- **Numbers and their baseline.** For each headline metric — what was the state before, is there a
  real baseline, were you accountable for the business outcome or just the technical capability
  that enabled it?
- **The recurring pattern.** Across roles, what's the common thread — what kind of situation do
  they repeatedly get pulled into, and what do they actually do about it? This becomes
  `shared.core_identity_line` — a claim about who they are, not a capability list.
- **Current positioning.** What titles are they actually targeting right now (`shared.
  professional_identity`)? Any commercial/independent directions alongside that (fractional CTO,
  advisory — `shared.commercial_directions`)? What differentiates them from someone else with a
  similar title (`shared.differentiators` — 3-6 short phrases, not a paragraph)? Any broader or
  aspirational title they've explicitly decided NOT to claim right now (`shared.
  rejected_broader_titles`)?
- **Gaps.** If something in the source material looks incomplete or ambiguous (a role with no
  clear scope, a number with no clear ownership), ask directly rather than filling it in with a
  plausible guess.
- **Voice and phrasing.** Do they have characteristic phrases, sayings, or a recognizable way of
  talking about work — things they'd actually say, not corporate-sounding lines? What do they
  genuinely believe about how work should get done (pace vs. polish, simplicity vs. completeness,
  and similar)? This becomes `Voice Material` in the Master CV — raw material for
  personality-forward writing (Upwork proposals, pitches), never quoted verbatim in a neutral CV
  or LinkedIn text. Easy to skip if not asked directly — most people don't volunteer this
  unprompted, and a document with none of it reads flatter than it needs to.
- **Concrete facts.** Full name, contacts (location, email, phone, LinkedIn URL), a personal
  landing page/portfolio link if they have one, certifications, education, and spoken languages
  with their level. None of this is narrative — it goes in `config.yaml`'s `shared:` block, not
  the CV — but full name is what rendered CV/cover-letter filenames are built from
  (`rendering.resume_output_stem`), and languages specifically are what `playbooks/fitment.md`'s
  mandatory-language blocking check looks for; both have nothing to work with until this is
  filled in.

## Step 3 — write `data/CV_GENERAL.md`

Structure (adapt as needed, this isn't rigid): a short intro (who they are, headline pattern),
then one section per role/project in reverse chronological order — company, title, dates, a short
framing of why the role exists in the narrative, achievement bullets. Every bullet must trace to
something confirmed in steps 1-2, with ownership scope carried through verb choice (see
`policies/generation-rules.md`). Where the candidate answered "I'm not sure" or the source is
ambiguous, either leave it out or mark it as a known gap in a short trailing note — never resolve
an ambiguity by picking the more flattering interpretation.

Also write a `## Voice Material` section from what Step 2 gathered — characteristic phrases and
work beliefs, verbatim where the candidate actually said something quotable. Leave it out
entirely if Step 2 genuinely didn't surface anything, rather than inventing generic-sounding
lines to fill the section.

Include candidate-specific interpretation notes inside the Master CV itself when they clarify how
to read the evidence: ownership maps, attribution caveats, business-outcome caveats, and other
"this example means X but not Y" notes. These notes belong beside `Voice Material` and recurring
patterns because they are personal evidence context, not reusable system policy.

## Step 4 — write `data/config.yaml`

```yaml
shared:
  full_name: <candidate's full name -- rendered CV/cover-letter filenames are built from this>
  professional_identity:
    - <title 1>
    - <title 2>
  commercial_directions:
    - <if any — fractional/advisory/freelance directions>
  differentiators:
    - <3-6 short phrases>
  core_identity_line: >-
    <one or two sentences, the recurring-pattern thesis from step 2>
  rejected_broader_titles:
    - <if any were explicitly discussed and rejected>
  contacts:
    location: <city, country>
    email: <email>
    phone: <phone, if given>
    linkedin: <profile URL, if given>
    landing: <personal landing page, if they have one>
    portfolio: <portfolio/projects link, if they have one>
  contact_strategy:
    targeted_cv:
      remote_or_nonlocal:
        location: <what to show instead of local address, e.g. Remote>
        include_phone: true|false
      local:
        use_config_location: true|false
        include_phone: true|false
    links:
      <contact/link key>:
        <candidate-approved display rule>
  certifications:
    - <one line per certification, issuer + date if known>
  education:
    - <one line per degree/program>
  languages:
    <language>: native|fluent|professional|limited
```

Deliberately no default `work_authorization`/`open_to_relocation` fields. Location and remote
preferences are candidate-specific and belong in `data/sources.yaml`'s `local_keywords` plus any
confirmed contact/application strategy in `shared:`. `config.yaml` holds `shared:` only — a
public surface's own positioning lives in `data/surfaces/<name>/context.md`, created by
`playbooks/surface-define.md` when that surface is first worked on, not here.

## Step 5 — derive initial role profiles

Once the Master CV is at least basically populated, propose a small set of candidate-specific role
profiles at different confidence/scale levels: `match` (well-supported today), `scale` (credible
next-level stretch), and `fallback` (safer proven lane). Use `examples/role-profiles/*.md` only as
examples of profile shape and quality; derive the candidate's runtime profiles only from this
candidate's Master CV and config.

After confirmation, write the selected profiles to `data/role-profiles/*.md`. These are the files
CV playbooks use later.

## Step 5b — surface the public-positioning capability

Once positioning exists, tell the candidate — once, plainly — that Career Space can also help with
how they're represented publicly: LinkedIn, freelance marketplaces (Upwork, Djinni, Fiverr),
a portfolio, a personal site, a GitHub profile, or another surface relevant to their goals. It can
work from an existing one or define a new surface from scratch (`playbooks/surface-define.md`).

This is an invitation, not a workflow to start now. Note which surfaces they already have (from
the `contacts` links and anything they mentioned), offer to pick one up whenever they want, and
move on. If they only want job applications, that's fine — don't push.

## Step 6 — show files, ask for corrections before treating onboarding as done

This is the seed everything else reads from — get the candidate to actually read it back, not
just confirm "looks good" reflexively. A wrong ownership call or an invented number here
propagates into every cover letter, CV, and platform profile generated afterward.
