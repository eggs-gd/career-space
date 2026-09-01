# Playbook: surface-define

Trigger: the candidate wants to define, or rethink the positioning intent of, a public career
surface — "хочу профіль на <платформі>", "допоможи з портфоліо / лендосом / сайтом", "хочу
LinkedIn більше під EM", "let's rework how I show up on Upwork". Also the internal first step of
`playbooks/update-surface.md` when a surface has no `context.md` yet.

This writes intent, not output. It produces `data/surfaces/<name>/context.md` (and, for a
platform with no canonical reference, `data/surfaces/<name>/reference.md`). Generating or updating
the actual `output.md` is `playbooks/update-surface.md`.

Read `policies/generation-rules.md` and `policies/surfaces-framework.md` first, and
`data/strategy.md` if it exists — a surface's role is derived from the candidate's career
direction, not assumed. If `data/config.yaml` has no `shared:` block, stop and run
`playbooks/onboard.md` — every surface projects from it.

## Define vs revise

- **Define** — no `data/surfaces/<name>/` yet. Run all steps.
- **Revise** — `context.md` exists and the candidate is changing *what this surface should
  communicate* (a shift in positioning intent, audience, tone, emphasis). Skip Step 1; go to
  Step 2 with the existing `context.md` as the starting point, change only what the candidate is
  actually rethinking.
- If the candidate only has *new evidence* to reflect (a recent role, a new achievement) and the
  intent is unchanged, this is not the right playbook — go straight to `playbooks/update-surface.md`.

## Step 1 — identify the surface

Pick the `<name>` (short, lowercase, filesystem-safe — `linkedin`, `upwork`, `firestart.dev`,
`github-profile`). Then classify:

- **Canonical platform** — `reference/surfaces/<name>.md` exists. Read it for the platform facts
  (fields, limits, mechanics). It says nothing about how this candidate should use the platform —
  that's Step 2. Go to Step 2.
- **Unknown platform** — a real external platform with its own profile structure, no canonical
  file. Go to Step 1a.
- **Free-form surface** — portfolio, personal site, GitHub README, speaker bio, anything with no
  external schema. Go to Step 2 (there is nothing to research; the shape comes entirely from
  intent).

### Step 1a — research an unknown platform

Do this conversationally with a general-purpose agent's own web capability — no scraper, no schema
extractor, nothing added to this repo. Follow the "real sample first" discipline: look at the
actual platform, don't describe it from memory.

Find out, and confirm what you're unsure of with the candidate:

- What the platform is for, and who the audience is (recruiters? clients? peers?).
- The interaction/discovery model — do people search and filter, get matched, browse, buy off the
  shelf?
- The profile fields: which exist, which are required, character limits, section structure,
  what's shown above the fold.

Write this to `data/surfaces/<name>/reference.md` with a short note on how confident each part is
and when it was checked. It's provisional user-local knowledge, not a canonical definition — if
`reference/surfaces/<name>.md` ever ships, it wins and this file should be reconciled or dropped.

## Step 2 — work out the positioning intent

The Master CV answers *what can we truthfully claim*. This step answers *what role does this
surface play in this candidate's strategy, and what should it emphasise* — which needs the
candidate. Ask, challenge assumptions, don't invent a personal brand from the evidence, and don't
assume a platform's role from `policies/surfaces-framework.md`'s default model — that's a
suggestion to react to, not a template:

- Given the candidate's direction (`data/strategy.md`), what is this surface *for* — relative to
  their other surfaces? (e.g. converge toward one identity, or carry a distinct positioning the
  others don't.)
- Who should see it? What should they understand and remember? What action should it cause?
- What should it emphasise — and what should it deliberately not communicate?
- What tone fits?
- For a constrained platform: any values the candidate wants pinned verbatim (headline, target
  title, CTA, tagline, top skills)?

Guardrail: this sets emphasis, audience, and tone. It never introduces a fact the Master CV
doesn't support (ground rules #1, #5).

## Step 3 — write `context.md`

Plain Markdown. Sections roughly: **Role in strategy** (what this surface is for, relative to the
others), **Audience**, **Emphasise / don't say**, **Tone**, **Pinned** (verbatim values, if any),
plus any category-level decisions (service directions, role emphasis order, whether a
fractional/advisory title is explicit here). No evidence or achievement text (re-derived at
generation time), no cached selection, and no presentation implementation — layout, fonts,
per-section HTML belong in `output.md`, not here.

## Step 4 — show it, ask before saving

Show the `context.md` (and `reference.md` if written). Confirm before saving. Then offer to run
`playbooks/update-surface.md` to generate `output.md` from it.
