# career-ops -- comparison, and what's actually worth taking

Captured 2026-09-02, revised same day after external review. `career-ops` (santifer/career-ops,
MIT) is a large, active OSS job-search tool found after most of career-space was built. Reference
only, like `jobhunt-agent` -- never a dependency, never imported, never a source for
candidate-facing content.

## The finding that matters: different optimization targets

The two tools sit at opposite ends of the same problem, and the architectures follow from that.
This is structural, not positioning spin.

```
career-ops:    market -> ~700 postings -> evaluate / filter -> ~10 worth applying to
career-space:  person -> direction -> positioning -> surfaces -> opportunities ->
               applications / outreach -> market feedback -> (back to direction)
```

career-ops' main problem is digesting a large market stream, so it grew 92 providers, batch
workers, cheap standalone evaluators, ghost-job detection, calibration. career-space's problem is
steering one person's trajectory, so it grew `strategy -> surfaces -> fitment / prioritize`.
Neither feature set is missing from the other by oversight.

This is now in the product positioning. `README.md` carries the product-level statement with **no
competitor named** ("starts with you, not the job feed" -- the thesis survives career-ops
changing or disappearing). `playbooks/pitch.md` Step 4 has a one-line rule: when asked about job
aggregators / application-automation tools, answer by optimization target, not feature count, and
don't name a specific competitor. No per-competitor section in pitch.md by design -- that would
be a hardcoded battlecard. If a real comparison is ever wanted it's a separate standalone doc
covering many tools generically, not one repo. The surfaces concept is what makes this thesis a
real architectural property rather than aspirational marketing.

## Convergence (validation, nothing to build)

career-ops independently landed on nearly the same anti-fabrication doctrine as our Ground rules
("keywords get reformulated, never fabricated", ownership-language preservation, a
selection-is-not-a-cache equivalent). It took it one step further with provenance markers -- note 2.

## Three notes (not a feature list)

### 1. Market-feedback loop -- preserve outcomes now, automate learning later

The one strategically significant thing, because it closes career-space's own model: today the
chain stops at `application`; the natural loop is
`application -> market response -> learn -> strategy / positioning / selection`.

career-ops has `/outcome` + a deterministic advisory `calibrate.mjs`. Do **not** build that now.
The near-term move is smaller: **stop losing observations that can't be reconstructed later.**
`record.yaml` holds `status` / `status_history` but no field for *why* a transition happened. A
concrete case: a recruiter opening with "do you have React Native?" is market feedback that
fitment underweighted a mandatory-core-stack gap -- that signal has nowhere structured to live
right now. Worth deciding soon whether status transitions should also capture a known
reason/signal (a `feedback:` field per vacancy, or a `data/outcomes.md` log). Analysis and
calibration come later, once there's data.

### 2. Provenance for accumulated evidence -- recall when it's relevant

Not now. But the distinction is a hard-won pattern worth keeping:

```
primary               user stated it directly (CV_GENERAL.md)
derived               agent reformulated / interpreted a primary fact
derived-unverified    a number that emerged during preparation, never in a primary file
user-cannot-confirm   specifically checked with the user; they can't confirm it
```

career-ops enforces this on `story-bank.md` because generated STAR stories accumulate and a
figure invented once to match a JD becomes a cited "fact" three iterations later. career-space
has no long-lived generated evidence outside `CV_GENERAL.md` today. The moment it does -- almost
certainly interview prep -- adopt this, plus career-ops' UX rule: never present an unverified
number as confirm/deny (a confirmed guess launders a guess into a fact); offer four outcomes
including a durable "I don't know".

### 3. career-ops as prior art -- read before designing, don't copy speculatively

For these capabilities, *if real usage actually leads there*, read career-ops' implementation
before designing ours:

- **Outreach** -- `modes/contacto.md` (hiring manager / recruiter / peer + a short LinkedIn
  message per type), `modes/email.md`, `linkedin-join.mjs` (warm-intro finder over a
  `Connections.csv` export, offline, "operational only, never a scoring input"). Mature prior art
  for exactly the `_sb/roadmap.md` lead-gen/outreach item.
- **Posting legitimacy** -- Block G in `modes/oferta.md`. Only relevant if real usage shows a
  meaningful share of application bandwidth going to dead/ghost postings. Not an obvious third
  axis alongside fitment and prioritize just because career-ops has it -- when apply packages are
  cheap, applying to a doubtful posting is often cheaper than researching repost history, layoffs,
  and JD specificity to rule it out. Its jurisdiction-compliance signals are over-build for a
  personal tool regardless.
- **Interview prep** -- career-ops has a full suite (plan / practice / debrief + a company
  red-flag detector).
- **Cheap pre-filter** -- `modes/triage.md` reads only a small user-maintained `_brief.md`, not
  the full context, for a go/no-go pass. Pragmatic version of `_sb/ideas/workflow-resolver.md`'s
  input-slicing.

## Two design forks -- ours stay ours

- **Score.** career-ops' 1-5 score is holistic model judgement, explicitly no formula.
  `score_fit.ts` is a fixed weighted formula on purpose. Keep ours.
- **Surface area.** career-ops sprawls (70 root scripts, TUI, web UI, plugins) to serve forks and
  thousands of users. MCP + thin-wrapper discipline stays.

## Shared code

Core domain logic is not meaningfully reusable in either direction -- the core abstractions
differ. Peripheral deterministic primitives could: a job-board provider, an ATS fetcher, a
posting normalizer, a cross-run repost detector, an ATS-PDF validator, a LinkedIn-connections
join. The one concrete near-term instance: `scout_sources.ts` has working fetchers for
`douua` / `djinni` / `jobico` / `justjoin` / `nofluff` that career-ops may lack among its 92
providers; a self-contained TS-to-plain-mjs port fits their one-file `providers/` contract --
but only once ours is battle-tested, and never ahead of career-space's own work.

Small items career-ops has that are genuinely trivial but not currently worth the extra file to
read or maintain: `data/blacklist.md` (do-not-apply list), a follow-up cadence nudge, an
ATS-parseability check, `voice-dna.md` (a per-user voice guardrail on top of the cliché list in
`generation-rules.md`). Revisit only on a demonstrated recurring need.

## Contributing back

Not now. Different core philosophy, heavy governance (issue-first, linked-PR, CI, CodeRabbit,
contributor ladder), and outside this repo's "every change made by an agent reading AGENTS.md"
experiment. The `providers/*.mjs` port above is the one low-friction exception if it ever makes
sense.
