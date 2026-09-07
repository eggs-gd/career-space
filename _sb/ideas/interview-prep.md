# Interview preparation -- design rationale

Built as `playbooks/interview-prep.md`. This file is the reasoning behind it: the landscape scan,
what career-ops already built, what's career-space's own to add, and what was deliberately scoped
out. The pipeline phase after application
(`direction -> positioning -> surface -> opportunity -> application -> interview`).

## The market splits three ways

1. **Interview simulators.** Big Interview (PracticeAI), Teal (Mock / Coach Mode), Yoodli,
   Final Round AI's mock mode, Exponent/Aced. Play the interviewer, generate role/JD-derived
   questions, adapt follow-ups, score delivery (clarity / pacing / fillers / confidence), show an
   "optimized answer". Yoodli owns the voice-delivery niche specifically.
2. **Live copilots.** Final Round AI, Interview Sidekick, LockedIn AI. Listen during the real
   interview and stream suggested answers; some read the screen for coding rounds. Out of scope
   here on principle -- career-space prepares a candidate, it doesn't perform the interview for
   them, and "a human decides, unassisted, in the room" is the same line the no-auto-submit rule
   draws.
3. **Preparation packages.** CleverPrep ($19/package), ApplyArc, and Teal's checklist. Purpose-
   built for "I have an interview at {company} next week": company research, likely questions for
   the specific role, STAR answers from the resume, strategic questions to ask, then optional
   practice. **This is the category career-space's instinct lands in** -- and it's a real, paid
   category, not a gap nobody wants filled.

The useful distinction from the reviews: a simulator has a feedback loop but *generated*
questions; a real-question bank has *real* questions but no loop. A prep package is the third
thing -- reasoning about this specific interview from what's known about the role, the company,
and the candidate.

## What career-ops already built (prior art -- read before designing, don't copy)

career-ops has a full interview suite (`modes/interview-prep.md`, `modes/interview/{plan,practice,
debrief}.md`, `modes/deep.md`, `modes/interview-redflag.md`). It already covers most of the
brainstorm:

- **Company-specific intel** (`interview-prep.md`): audience-grouped web research
  (recruiter / hiring-manager / peer-tech), process overview, round-by-round, likely questions
  per audience (sourced-with-citation or `[inferred from JD]`), story-bank mapping, per-audience
  "what to say / avoid to whom".
- **Time-blocked plan** (`interview/plan.md`) + a 15-minute quick reference: an **anchor
  sentence**, top 3 things to land, questions to ask.
- **Chat mock** (`interview/practice.md`): one question at a time, structured feedback,
  a `retracted-claims.md` hard gate, machine-readable session transcripts.
- **Debrief loop** (`interview/debrief.md`): capture what was asked, close gaps, update a
  question bank with 🔴 markers, predict the next round, correct contradicted facts in place.
- Supporting artifacts: `story-bank.md` (with provenance markers -- see
  `_sb/ideas/career-ops-comparison.md` note 2), `question-bank.md`, `sessions/` transcripts.

The lesson: the "google the company + predict questions + map evidence + suggest smart questions"
core is solved technique. career-space shouldn't reinvent it -- it should do the parts its own
artifacts make sharper, and add the parts career-ops doesn't have.

## What's actually career-space's to add

### Sharper, because the artifacts already exist

- **Question prediction off the scored fitment, not off JD text.** `score_fit.ts` already has
  requirement clusters tagged by evidence level (direct_strong / direct_partial / transferable /
  none), importance (critical / important / nice_to_have), and a `blocking` flag. That *is* the
  question map: critical + direct_strong -> "prove it" questions; critical/blocking + none or
  transferable -> a gap probe to expect **early and explicitly**. career-ops infers questions
  from the JD and web reviews; career-space can derive them from evidence it already scored.
- **Evidence ammunition from `targeting-plan.md`.** The requirement->evidence map already exists.
  Re-project it as "if they ask about X: the evidence, the numbers safe to state, the
  overstatement risk, the angle relevant to *this* company." Ownership-language and provenance
  discipline (`policies/generation-rules.md`) carry over for free -- career-ops bolts
  `retracted-claims.md` on as a separate gate; career-space already generates under that rule.
- **Risk shape from `fit_category`.** `altitude_mismatch` -> expect scope/seniority probing;
  `craft_mismatch` -> expect a hands-on depth check; `underreach` -> expect "why a role below
  your level, will you leave". career-ops has no equivalent typology.
- **The recruiter's own words.** `reconcile.md` already brings recruiter correspondence in as
  read-only evidence and records the why on `status_history` notes. A recruiter opening with
  "do you have React Native?" is a recorded fact -- next prep for a similar role should expect
  that probe, and the opener is ground truth for whether the gap-prediction fired correctly.
  This is where interview-prep meets the market-feedback-loop item in `roadmap.md`.

### New blocks career-ops doesn't have

- **Interview thesis** -- one paragraph: *what should they remember about me after this?* Not a
  per-interview tactical anchor (career-ops' "anchor sentence" is that) -- the continuation of
  the positioning already committed in `data/strategy.md` and the surfaces, into the interview
  phase. The whole prep is checked against it.
- **"What they're actually hiring for"** -- an explicit *formally X / likely really about Y /
  confidence / evidence* block. career-space's fitment already reasons this way about individual
  requirements; extend it to the role's underlying problem (team scaling, delivery slipping,
  a platform rebuild, a fresh AI mandate). For EM/CTO roles, adjacent-team postings, an
  engineering blog, layoffs, funding, and leadership changes often say more about the real
  structure than the JD.
- **Questions to ask them, categorized** -- diagnostic (is it a mess in there?), positioning
  (demonstrate how I think), decision (information I need to accept an offer). career-ops has
  "sharp questions tied to a named team challenge"; the typology is what makes this useful for
  senior/leadership roles. Example, for a JD that says "0->1 AI platform" at a company that's
  been enterprise for a decade: *"You describe this as 0->1. Is the harder problem proving the
  product direction, or getting the existing org to ship it at startup speed?"* -- informative,
  shows thinking, quietly sells positioning.
- **5-minute cheat sheet** -- one screen before the call, tighter than career-ops' 15-minute
  review.

## Deliberately not building

- **Voice / video / delivery scoring** (Yoodli's island: audio, realtime, pacing/filler
  analysis, a UI). Different complexity domain, and well-served already.
- **Live copilot.** See category 2 above -- against the "prepare, don't perform" line.
- **Mock-interview infrastructure.** Not needed: the generated `interview-prep.md` is already the
  context for an in-chat mock on request ("run a 30-minute technical leadership interview off
  this, probe my weak areas, hold feedback to the end"). Capability is close to free; whether it
  earns its own playbook is a usage question, later. Suspicion: for one candidate, research +
  question prediction + evidence mapping + smart questions is 80-90% of the value, and
  half-hour AI mock sessions get old fast.

## Shape (as built)

`playbooks/interview-prep.md`, on request only -- "готуй мене до співбесіди <slug>" / "prep me
for this interview" / "що спитають на співбесіді". **No status-change trigger**: a process is
1-5 rounds, the candidate moves a vacancy to `interview` at the recruiter screen and asks for a
brief each round as they advance. Reads the vacancy folder (`posting.md`, `fitment.md`,
`targeting-plan.md`, `cv.md`, `cover-letter.md`, `record.yaml` `status_history` for recruiter
correspondence) + `CV_GENERAL.md` + `config.yaml` `shared:` + `strategy.md` + the role-profile +
bounded web research (5-query cap, same discipline as `fitment.md`). Writes one
`data/vacancies/<slug>/interview-prep.md`:

1. Interview thesis
2. Company & role intelligence (what I need to know before this call, not an encyclopedia)
3. What they're actually hiring for (formally / likely / confidence / evidence)
4. Likely questions + agenda, **grouped by audience** (recruiter / hiring-manager / technical) --
   the candidate reads the slice for the round they're on. Derived from the scored fitment
   clusters; gap probes flagged expect-early; a probe the recruiter already made reads as
   confirmed from `status_history`, not predicted.
5. Evidence ammunition (per likely question: evidence, safe numbers, overstatement risk, angle
   for this company)
6. Questions to ask them (diagnostic / positioning / decision)
7. Verify + red flags (fitment eligibility flags + facts to confirm live)
8. 5-minute cheat sheet

Re-runs for a later round keep blocks 1-3, regenerate 4-8, and deepen whichever audience slice
the candidate names. No board sub-status -- a dated round note in the file (the candidate's own
stage label if they gave one, no forced "Round N" numbering) records the process history instead.

## Decisions

- **No persistent story bank.** career-ops accumulates a cross-vacancy `story-bank.md`;
  career-space does not. Ground rule #9 ("selection fields are not a cache") already governs
  this -- a story bank is a cache of evidence selections and drifts from the Master CV (the same
  provenance problem as `_sb/ideas/career-ops-comparison.md` note 2). Each `interview-prep` run
  re-selects from the current `CV_GENERAL.md`. If prep surfaces a genuinely new story the
  candidate tells that isn't in the Master CV, that's a prompt to update `CV_GENERAL.md`, not to
  start a sidecar.
- **No debrief / answer-grading in this feature.** A per-answer "landed / didn't land"
  post-mortem depends on recall the candidate usually doesn't have, and a theory built from a
  misremembered round makes the *next* prep worse, not better. If a post-interview capture is
  ever built, it's a separate, deferred item and a narrow one: only the questions actually asked,
  the facts the interview corrected (comp, team size, stack, remote policy), and the outcome --
  never a grade on the candidate's answers. It also needs round-level sub-states on the board,
  which don't exist. The recruiter's opener still reaches the loop for free via `reconcile.md`.
- **The `-> interview` trigger needs no board work.** `interview` / `offer` / `rejected` /
  `skipped` are already in `VALID_STATUSES`.
- **Strategy updates are not this feature's job.** Learning from rejections belongs on negative
  status transitions, folded into the market-feedback-loop item -- see `roadmap.md`.

## Validation

Judge a generated brief against a real interview by five questions, not by how it reads:

1. Did it predict the 2-3 most likely opening probes?
2. Did it surface the real weak spots, not just the flattering evidence?
3. Are the questions-to-ask ones the candidate actually wants to ask, not HR filler?
4. Is there something from research the candidate didn't already know that changes the prep?
5. Can the candidate read the cheat sheet in 5 minutes before the call and feel like a stronger
   candidate for it?

4/5 → the feature earns its place. 2/5 → fix the methodology against that specific interview,
don't add more architecture.

## Open questions

- **Does the thesis feed back to `strategy.md`?** Probably vacancy-local, but a recurring thesis
  pattern across interviews is a strategy signal -- same "no persisted judgment until a stable
  pattern emerges" shape as `playbooks/prioritize.md`.
- **Prep for a role that was never evaluated** (referral, recruiter reachout): route through
  `add-from-url.md` -> `fitment.md` first, then this.
