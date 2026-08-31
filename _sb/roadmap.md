# career-space roadmap

`_sb/` ("storyboard") is internal project planning -- status, decisions, what's next. Not part of
any candidate-facing playbook, never read during normal execution; see `AGENTS.md`'s note on this
split. Keep this current and terse -- facts and decisions that matter for future work, not a
narrated history of how each one was found.

## Status as of 2026-08-30

**Built** (see `_sb/architecture.md` for how any of this actually works):
- [x] Onboarding -- Master CV, config, and role profiles from a conversation.
- [x] Fitment check -- private fit read against a pasted posting.
- [x] Cover letter generation.
- [x] CV generation -- universal (by role profile) and targeted (per vacancy).
- [x] CV review -- blunt quality diagnostic (score, top fixes, strengths, risks, target role
      slices, likely interview questions) for the Master CV or any generated CV.
- [x] Pitch -- explain/position career-space itself, audience- and length-aware.
- [x] Platform profile updates -- LinkedIn / Djinni / Upwork / Fiverr.
- [x] Scout -- auto-fetch/filter/dedup postings from 13 job boards/aggregators (plus 4 supported
      per-company ATS types -- greenhouse/lever/ashby/recruitee, opt-in per company in
      `sources.yaml`), judged the same way
      as a pasted posting.
- [x] LinkedIn search links -- ready-to-click Boolean search deep-links. People-search now needs
      a track's own `hiring_titles:` to appear at all (fixed 2026-08-30 -- see "Built" note below
      for what was actually wrong).
- [x] Dashboard/board -- every vacancy on one page, grouped by status, sorted by fit.
- [x] Rendered CV/cover-letter output -- PDF/HTML with recruiter-facing filenames.

**Fixed 2026-08-30 -- LinkedIn people-search searched for peers, not hirers.**
`linkedin_searches.ts`'s people-search link built its query from a track's own job-search
`titles` -- for an Engineering Manager track that searched LinkedIn for other Engineering
Managers, not the people who hire them. Added `TrackConfig.hiringTitles` (from `sources.yaml`'s
new, optional `hiring_titles:` field, domain judgment left to the candidate -- see
`playbooks/scout.md`'s Step 0); the people-search link is now built from that instead, and is
simply omitted (not silently wrong) for a track that hasn't set it, with a note in the generated
file explaining why and how to fix it. Covered by `linkedin_searches.test.ts`.

**Built 2026-08-30 -- two Ukrainian scout sources, dou.ua + Djinni.** Both verified live before
implementing (not assumed): **dou.ua** at `https://jobs.dou.ua/vacancies/feeds/` (note: `/feeds/`,
plural -- `/feed/` 404s), a flat aggregator fetcher (`AGGREGATOR_FETCHERS`, regex item extraction
like `fetchWeworkremotely()`), with its own title-splitting logic for the packed
"<Role> в <Company>, від $X, <City>" string and a double `decodeHtmlEntities()` pass (the feed
itself double-encodes `&nbsp;` as `&amp;nbsp;`). **Djinni** at `https://djinni.co/jobs/rss/`, a
query-driven fetcher (`REGIONAL_FETCHERS`, `?primary_keyword=` server-side filtering, same
loop-over-track-titles shape as `fetchWorkable`/`fetchSmartrecruiters`); no structured
company/location field, so company defaults to `"?"` and location falls back to description-text
inference, same as other fetchers already do. `REMOTE_WORDS` extended with "віддалено"/
"дистанційно" since both sources are Ukrainian-language. Not added to the real `data/
sources.yaml` -- only the mechanism and `examples/onboarding/sources.yaml` were touched; opting
in is the candidate's own call. Ruled out, both confirmed via a real fetch attempt: **robota.ua**
(no public API, 403s automated fetches) and **work.ua** (RSS exists but sits behind Cloudflare
bot protection -- `cf-mitigated: challenge` on a plain fetch with a real User-Agent).

## Next steps, in order

1. **`cover-letter.md` structure decision** -- brainstorm-stage, product question not just an
   engineering gap. `_sb/reference/cover-letter-framework-vacancy.md` has a genuinely different
   vacancy-application shape (Blocks 1-4: What/Why me/Why them/CTA, plus its own validator
   criteria) vs. the freelance-proposal shape (Problem/Differentiator/Evidence/Scope/Core Message)
   the playbook currently always uses for both modes. Real open question is UX, not mechanical:
   a real sent batch (current shape) reads as genuinely
   engaging/triggering to a human reader; the framework's Blocks 1-4 is more formal and flatter --
   likely the better bet for an ATS keyword scan, worse for a human reader. May end up needing
   both, chosen per posting, rather than one replacing the other. If/when this gets picked up,
   bundle in: wiring `cover-letter.md` to reuse `playbooks/requirement-evidence-plan.md`'s
   `targeting-plan.md` instead of re-deriving evidence independently (right now a CV and cover
   letter for the same vacancy can select different evidence for the same requirement), and the
   framework's vacancy-specific validator criteria (retells the resume, no concrete
   why-this-company, doesn't use the vacancy's own vocabulary).

## Later / maybe

- **Lead-gen / outreach extension** -- extend scout's vacancy -> company -> fit chain one hop
  further: contact discovery + drafted outreach for top-fit vacancies. Not started. Principles
  agreed in advance for when it's picked up: (a) LinkedIn contact lookup/browser control stays an
  external capability (Claude in Chrome or similar), never scraping built into career-space
  itself; (b) agent researches + drafts, candidate approves/sends, no bulk automation; (c) no new
  root entity needed to start -- add `contacts.md`/`outreach.md` to the existing `<slug>/`
  folder, or a differently-shaped slug for a non-vacancy signal, in the same flat
  `data/vacancies/` list; only worth an `Opportunity`-root rename once a concrete non-vacancy
  signal actually needs it. Vacancy slug sorting (folder names don't sort by recency) folds in
  here rather than being its own item -- `render_board` already removes the need to eyeball raw
  folder order, so it's a machine/collision concern only, worth solving alongside this if at all.
- **Fitment only judges "do I clear the bar," never "does this actually suit me."**
  `score_fit.ts`'s risk/appeal is one-directional -- what would make a hiring team hesitate or
  get interested, never what would make the candidate hesitate or get interested (remote-only,
  no people-management, a comp floor, and similar preferences aren't checked against a posting at
  all right now). Working hypothesis is this is probably partially covered already since fitment
  goes through LLM judgment on the whole posting rather than blind keyword matching: not confirmed
  either way.
- **Dashboard, expensive path** -- only if the cheap board proves insufficient. SvelteKit +
  static adapter. Not started, not clearly needed yet.
- **Offload narrow, mechanical LLM sub-steps to a cheaper-model subagent, host-capability-gated.**
  Captured 2026-08-29, not started. Some playbook steps are structured extraction, not real
  judgment -- small, classification-shaped, bounded input/output, no need for the full Master CV
  or conversation history. Two candidates worth evaluating on that basis when this gets picked
  up: `fitment.md`'s Step 1 (requirement-cluster extraction) and cover-letter's task/long-term
  mode inference (Step 1). Worth trying on a cheaper model with a smaller, focused context
  instead of the full conversation -- spawned as a subagent (Claude Code's `Agent`/Task tool with
  a pinned cheap model), not a direct API call from a script, to stay agent-native rather than
  adding a separate LLM-calling layer to maintain.

  Real constraint, not yet solved: subagent spawning is a host capability, not something callable
  via MCP the same way on every provider -- Codex CLI/Gemini CLI/Cursor have no confirmed
  equivalent primitive. Use the same fallback idiom already established for MCP-vs-CLI ("if the
  host supports X, use X; otherwise do it inline") so this is a pure upgrade on hosts that support
  it and a no-op everywhere else, never a required step that breaks portability. Likely lands as
  a `.claude/`-scoped convenience (a subagent definition + a conditional playbook step), same
  shape as the existing `.claude/skills/` layer -- not a rewrite of the shared instructions.
  Needs real measurement once tried, not assumed savings -- and a real audit of which steps are
  actually mechanical enough to hand off before picking a first candidate.
