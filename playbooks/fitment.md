# Playbook: fitment

Trigger: "зроби фітмент" / "чи я підходжу на цю роль" / "assess my fit" — the candidate pastes a
job posting.

A blunt, first-pass read the candidate uses to decide whether it's even worth applying — not the
pipeline that writes a cover letter, and not client-facing output. Be honest, including about
weak fits.

**The score is computed by `scripts/score_fit.ts`, never stated by you directly.** A model-stated
score drifts run to run in a way a weighted formula over your own structured judgment doesn't —
the whole value of "blunt, honest" depends on the number meaning the same thing every
time. Your job is narrower than it might feel: extract what the posting needs, classify it, judge
what evidence `data/CV_GENERAL.md` offers — never compute or guess the number yourself.

## What you're judging

Ground everything in what the posting actually asks for and what `data/CV_GENERAL.md` actually
demonstrates — don't invent gaps or strengths in either direction. For the mandatory-language
check specifically, use `data/config.yaml`'s `shared.languages` — don't infer proficiency from the
Master CV's prose or guess from absence of a mention.

**Location eligibility is separate from content fit.** Candidate-specific location scope lives in
`data/sources.yaml`'s `local_keywords`; don't hard-code a country or city in this playbook. A
posting the scout found already passed the cheap prefilter's location gate before you ever see it,
but a posting the candidate pastes directly never went through it at all — check it here. If
`data/sources.yaml` doesn't exist yet, ask for the candidate's location scope rather than
guessing.

Classify `eligibility.location.status` before scoring requirement clusters:

- `open_remote`: the posting is genuinely open remote/anywhere, with no country/payroll/residency
  restriction that excludes the candidate.
- `local`: the posting matches the candidate's `local_keywords`.
- `location_exception_candidate`: the posting is remote but scoped to nearby/adjacent markets or
  time zones the candidate is not explicitly inside, and the text does not state a hard legal,
  security, clearance, payroll, or work-authorization gate. Treat this as an operational risk
  worth surfacing, not a content mismatch: do not create a blocking cluster solely for this and
  do not lower the content score by hand.
- `hard_location_block`: the posting is on-site outside the candidate's local scope, remote only
  for a region/country the candidate is outside of with explicit residency/payroll/work-
  authorization language, US-only-style scope, clearance, or no-sponsorship language that makes
  eligibility itself the blocker. This is a `blocking: true` cluster with `evidence: none`.
- `unclear`: the posting's own text is genuinely ambiguous after close reading.

**The word "remote" alone is not enough — actively look for a scope attached to it, don't just
pattern-match the word and stop.** The prefilter's own check is a cheap keyword match with no
room to catch this; that's fine there (its job is "worth a judgment turn," not a final verdict),
but here it's a real failure mode, not a hypothetical one: "Remote (US only)," "must be authorized
to work in [country] without sponsorship," "remote — must reside in [region]," and similar
phrasing all contain the word "remote" while meaning very different things. Read the actual
sentence the word "remote" sits in, not just its presence.
Decompose each real requirement into the underlying capability it needs (not the literal words)
before checking the Master CV against it: a requirement can be genuinely met by something that
never uses the posting's vocabulary, and isn't met just because some entry happens to share a word
with it.

**A "who we're looking for" / "ideal candidate" / background section is a requirement cluster, not
colour.** When a posting describes the *kind of person* it wants — prior employers ("experience at
firms like X"), a role archetype ("forward-deployed engineer", "founding engineer", "agency
background"), or a domain track ("enterprise consulting", "digital transformation") — extract it
as its own cluster, anchored on the candidate's actual role history, not on capability and not on
how the candidate describes themselves. Score it like any other: real, current, comparable-scale
history in that shape is `direct_strong`; old, small, or tangential history is
`direct_partial`/`transferable`; absent is `none`. "Preferred, not required" usually makes it
`important` rather than `critical` — but never drop it, and don't let a strong match on the
*rest* of the posting absorb it. Watch specifically for the case where the candidate's own
positioning language echoes the posting ("AI agents, discovery, architecture, executive-facing"):
that is a vocabulary match, and it says nothing about whether the *context* matches — client-facing
vs internal, external enterprise vs own product, advising vs building. Check the context; where it
diverges, that is a real gap and it goes in a cluster and in `risk`, not into "strong overlap".

## Step 1 — extract requirement clusters

Group the posting's real requirements into clusters (related/adjacent requirements that point at
one underlying competency belong together). Each cluster names exactly one requirement
`"primary": true` — the one that actually anchors it; others in the same cluster are supporting
context. For each requirement:

- **`evidence`** — grade against what `data/CV_GENERAL.md` shows the candidate actually *did*, not
  against words the CV and the posting happen to share:
  - `direct_strong`: a specific, recent, comparable-scale instance where this *was* the core of the
    work — not "the CV uses this term".
  - `direct_partial`: in the history but thinner — older, smaller, or peripheral.
  - `transferable`: the underlying capability is there in a different form and the inferential step
    would hold up to a skeptical reader — not "sounds adjacent". Practices, platforms, and
    frameworks transfer within one category (CI/CD, cloud platforms, frameworks in the same
    language ecosystem); **a specific programming language does NOT transfer from a different
    language**, however strong the candidate is elsewhere — `none` or `direct_partial` only.
  - `none`: genuinely nothing — *or* only a vocabulary match with no role-history substance.
- **`quote`**: a real quote/close paraphrase from `data/CV_GENERAL.md` pointing at that actual
  instance, not a matching phrase (`null` if `evidence` is `none`).
- **`reason`**: one plain-language sentence — this becomes the candidate-facing headline for the
  cluster, so make it read like one (not a JSON field dump).

For each cluster:

- **`importance`**: `critical` (a core success factor; the role probably fails without it) /
  `important` (affects confidence/ramp-up, isn't the center of the role) / `nice_to_have`
  (a preference/bonus). Base this only on the posting's own emphasis and wording.
- **`blocking`**: almost always `false`. Only `true` for an actual hard gate that disqualifies
  regardless of everything else — `eligibility.location.status = hard_location_block`, or a
  mandatory spoken language the candidate doesn't have per `shared.languages` — OR a specific
  technology the posting makes
  the literal subject of the role itself (in the title, or an explicit "must personally code in X
  daily" mandate) — in that case the role
  *is* about that thing, not "otherwise strong candidate, one gap." An ordinary missing critical
  skill that's one requirement among several is `importance: critical`, `blocking: false`.

Don't manufacture gaps in requirements that are actually covered, and don't soften a real gap to
be encouraging — but also don't invent a requirement the posting never actually asked for.

`importance` and `evidence` have teeth: `score_fit` caps the whole score at 5 when any
`critical` cluster's primary requirement is `evidence: none` (a blocker caps harder, at 3). So
`critical` means "the role probably fails without it", not "the posting mentioned it twice" — and
`none` means genuinely nothing, not "thin". Assign both honestly; a real core gap *should* pull
the score down, a mis-tiered one will punish it wrongly.

## Step 2 — job summary, risk, appeal, category

- **`job_summary`**: 2-3 sentences, the real ask stripped of buzzwords/boilerplate.
- **`risk`**: one honest sentence — what about the weakest clusters could make a hiring team
  hesitate or reject, including a `location_exception_candidate` operational risk if present.
  Empty string if genuinely nothing.
- **`appeal`**: one honest sentence — what about the strongest clusters could make them interested
  regardless of the gaps.
- **`fit_category`**, exactly one: `clean_fit` (requirements and evidence line up cleanly) /
  `stretch_fit` (a real, worth-trying match with genuine gaps needing honest framing) /
  `underreach` (the candidate's history supports meaningfully more scope/seniority than this
  posting asks) / `craft_mismatch` (the underlying discipline itself differs too much, not just
  level — use sparingly, a missing stack/domain is `context_gap`, a wrong seniority band is
  `altitude_mismatch`) / `altitude_mismatch` (same discipline, wrong level of
  responsibility/scope) / `context_gap` (right discipline and level, missing domain/stack/
  operating-context evidence) / `unclear` (genuinely not enough information — don't force one of
  the others).

## Step 3 — run the scorer

If the `career-space` MCP server is connected, call its `score_fit` tool directly with the
structure from Steps 1-2 as arguments (`job_summary`, `clusters`, `risk`, `appeal`,
`fit_category`, `eligibility`) — no file needed. Otherwise, write the same structure to a scratch file (e.g.
`/tmp/fitment-<company>.json` — working data, not something that needs to live under `data/`)
matching `scripts/score_fit.ts`'s documented input shape, then run:

```bash
node scripts/dist/score_fit.js /tmp/fitment-<company>.json
```

**If this posting has a tracked vacancy folder** (`data/vacancies/<slug>/` — the candidate already
tracked it, or you're here from `scout.md`), pass `out_dir` (MCP) / `--out-dir <folder>` (CLI) =
that folder. `score_fit` then writes `fitment.json` (this exact input) and `fitment.md` (the
render) into it — never hand-write either yourself. `fitment.json` is what `rescore` replays when
the scoring formula changes, so a future re-score doesn't need a fresh judgment. For a standalone
check on a posting that isn't tracked, omit it — the read stays in chat.

Either way, show the returned `markdown` to the candidate **verbatim** — headers,
bold labels, horizontal rules, grouped by evidence state (Major gaps / Minor gaps / Transferable /
Strong overlap, then risk/appeal). Paste it directly into your response; don't re-key it into your
own prose or wrap it in a second, longer narrative underneath — this compact, structured view *is*
the answer, readable on its own in a chat client. If something genuinely needs more explanation
than one `reason` sentence gives (the candidate asks a follow-up, or a cluster's classification is
non-obvious), explain that specific point after showing the scored result — don't pre-emptively
pad every cluster with a paragraph.

## Step 4 — one thing beyond the score, only if it's real

If the posting's own positioning conflicts with something explicit in `data/config.yaml`
(e.g. a title in `shared.rejected_broader_titles`, or a role shape that contradicts
`shared.commercial_directions`), say so in one or two sentences after the scored result — this is
real, useful signal the formula can't see. Don't add this kind of note if there's nothing
genuinely worth flagging; an empty "nothing else to add" is better than a manufactured one.

If the candidate then asks for a cover letter or a targeted CV for the same posting, run
`playbooks/cover-letter.md` or `playbooks/cv-targeted.md` next — this playbook's output isn't an
automatic input to those, treat it as a separate, standalone check unless the candidate explicitly
wants the gaps addressed in the next document's own framing.
