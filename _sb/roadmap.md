# career-space roadmap

`_sb/` ("storyboard") is internal project planning -- status, decisions, what's next. Not part of
any candidate-facing playbook, never read during normal execution; see `AGENTS.md`'s note on this
split. Keep this current and terse -- facts and decisions that matter for future work, not a
narrated history of how each one was found.

## Status as of 2026-08-31

**Built** (see `_sb/architecture.md` for how any of this actually works):
- [x] Onboarding -- Master CV, config, and role profiles from a conversation.
- [x] Fitment check -- private fit read against a pasted posting.
- [x] Cover letter generation.
- [x] CV generation -- universal (by role profile) and targeted (per vacancy).
- [x] CV review -- blunt quality diagnostic (score, top fixes, strengths, risks, target role
      slices, likely interview questions) for the Master CV or any generated CV.
- [x] Pitch -- explain/position career-space itself, audience- and length-aware.
- [x] Platform profile updates -- LinkedIn / Djinni / Upwork / Fiverr.
- [x] Scout -- auto-fetch/filter/dedup postings from 14 job boards/aggregators (plus 4 supported
      per-company ATS types -- greenhouse/lever/ashby/recruitee, opt-in per company in
      `sources.yaml`), judged the same way as a pasted posting. A run can be restricted to a
      subset of the configured `feeds:` (`scout_fetch`'s `feeds` param, added 2026-08-31 -- e.g.
      "just the Ukrainian boards this time") -- an intersection with what's configured, never a
      bypass; per-company boards aren't covered by this yet.
- [x] LinkedIn search links -- ready-to-click Boolean search deep-links. People-search now needs
      a track's own `hiring_titles:` to appear at all (fixed 2026-08-30 -- see "Built" note below
      for what was actually wrong).
- [x] Dashboard/board -- every vacancy on one page, grouped by status, sorted by fit. A local
      vacancy (matches `local_keywords`, same check the scout's own prefilter uses) gets a
      colored highlight (added 2026-08-31, prompted by dou.ua/Djinni making "local" a real signal
      worth seeing at a glance, not just a fetch-time gate). A vacancy can be archived (`vacancy_
      set_archived`, added 2026-08-31) -- orthogonal to `status`, excluded from the board/
      `vacancy_list` by default, nothing deleted, `include_archived` brings it back.
- [x] Prioritize -- `playbooks/prioritize.md`, added 2026-08-31. Candidate-side "do I actually
      want this," a judgment deliberately kept separate from fitment's employer-side "can I clear
      their bar" -- confirmed by reading `fitment.md`'s own instructions that candidate preference
      is checked exactly once, `config.yaml`'s `rejected_broader_titles`/`commercial_directions`,
      nowhere else. `fitment.md` itself stays untouched -- its semantics didn't actually change by
      this playbook existing, so it has no reason to know about `prioritize.md`; the dependency is
      one-directional (`prioritize.md` reads a `fitment.md` artifact when one exists, never the
      reverse). Reasons over `data/strategy.md` (new, plain prose, not YAML --
      blockers/preferences/strategic-alignment/exceptions, written via this playbook's own Step 0
      interview) against the existing board + fitments -- and works fine with no fitment at all,
      recommending off suitability alone rather than waiting on or inventing an employer-side
      score. Deliberately no code, no new score, and nothing persisted yet -- a live judgment made
      fresh each time, not cached, until real repeated use shows a stable enough pattern to be
      worth formalizing (see the playbook's own closing note). `score_fit.ts`/`scout.md` untouched
      on purpose -- premature filtering
      earlier in the pipeline would just discard outliers before this judgment ever sees them.
- [x] Rendered CV/cover-letter output -- PDF/HTML with recruiter-facing filenames.

**Fixed 2026-08-30 -- LinkedIn people-search searched for peers, not hirers.**
`linkedin_searches.ts`'s people-search link built its query from a track's own job-search
`titles` -- for an Engineering Manager track that searched LinkedIn for other Engineering
Managers, not the people who hire them. Added `TrackConfig.hiringTitles` (from `sources.yaml`'s
new, optional `hiring_titles:` field, domain judgment left to the candidate -- see
`playbooks/scout.md`'s Step 0); the people-search link is now built from that instead, and is
simply omitted (not silently wrong) for a track that hasn't set it, with a note in the generated
file explaining why and how to fix it. Covered by `linkedin_searches.test.ts`.

**Fixed 2026-08-31 -- an on-site posting could pass the location gate on incidental word
matches.** Found by analyzing a real `skipped` batch: a London on-site role's description said
"distributed systems" (routine architecture phrasing) and "sell anywhere" (product marketing
copy) -- neither about where the candidate could be based, but bare `"distributed"`/`"anywhere"`
entries in `scout_prefilter.ts`'s `REMOTE_SIGNAL_WORDS` and `scout_sources.ts`'s `REMOTE_WORDS`
matched them as remote signals anyway. The actual leak for this specific case was
`REMOTE_SIGNAL_WORDS` (`scout_prefilter.ts`) -- `scout_sources.ts`'s location-first `isRemote()`
had already correctly recorded `remote: false` from the real "London, UK" location field; the
gate's own *separate* re-check of the full combined text overrode that. `scout_sources.ts`'s copy
already had the same latent bug for any posting relying on its description-fallback path (empty
location field) even though it hadn't been observed yet. Fixed both: dropped bare `"distributed"`
(`REMOTE_SIGNAL_WORDS` already excluded it; `REMOTE_WORDS` didn't) and replaced bare `"anywhere"`
with `"work anywhere"`/`"from anywhere"` in both lists -- still catches genuine phrasing ("work
from anywhere") without matching either false-positive shape. Covered by
`scout_prefilter.test.ts` (new file).

**Built 2026-08-31 -- third Ukrainian scout source, jobico.io.** Surfaced as "we added an MCP
server, just give the agent a link" -- verified live rather than taken at face value: jobico.io's
own site shows no MCP anywhere (easy to confuse with the similarly-named, unrelated `jobicy.com`,
which genuinely does have an official MCP server); the real MCP is documented at `jobico.io/
developers`. Confirmed live via a raw JSON-RPC POST (no MCP SDK, no session/handshake needed) --
`search_jobs` (genuine free-text server-side search, confirmed by diffing a real query against a
nonsense one: 0 results for the latter, unlike Djinni's `primary_keyword` leak above) and `get_job`
(full JD text, a second call per slug). Concluded "MCP" isn't the right integration path here
either way -- same reasoning as never adding Jobicy's own MCP on top of its existing REST fetcher:
a connected MCP server suits ad-hoc chat search, not this repo's own deterministic pipeline. Added
as `fetchJobico` (`scripts/scout_sources.ts`, `QUERY_DRIVEN_FETCHERS`) instead -- query-driven by
track `titles` directly, like `fetchWorkable`/`fetchSmartrecruiters`, no `ua_categories` needed
(unlike dou.ua/Djinni, this platform's search is real free text). `locationType` is a clean,
always-present structured field, used directly rather than inferred from text. Not added to the
real `data/sources.yaml` -- mechanism + `examples/onboarding/sources.yaml` only.

**Built 2026-08-30, fixed 2026-08-31 -- two Ukrainian scout sources, dou.ua + Djinni.** Both
sources returned ~0 results in real use despite postings existing. Root cause, confirmed live: the
2026-08-30 cut queried both platforms using a track's own free-text `titles` (dou.ua as a flat
unfiltered pull, Djinni via `?primary_keyword=<track title>`) -- neither platform filters on free
text at all. dou.ua's `?category=` and Djinni's `?primary_keyword=` both genuinely filter
server-side, but only for an exact match against each platform's own small, fixed category
taxonomy; a track title like "senior backend developer" matches neither, so dou.ua fell back to
its ~50-most-recent-postings-sitewide pull (diluted across every discipline) and Djinni silently
served its unfiltered "latest vacancies" feed instead of erroring (confirmed by diffing its
response for a real category against a nonsense one -- byte-identical). Neither is a
Ukrainian-vs-English title problem, despite looking like one from a candidate's chair.

Fixed by making both genuinely category-driven: new per-track `TrackConfig.uaCategories` (from
`sources.yaml`'s `ua_categories:`, same "candidate picks, never inferred" spirit as
`hiringTitles`), sourced only from each platform's own real, live-verified list -- see
`reference/ua-scout-categories.md` (dou.ua's 59 values from its own `<select>`, Djinni's 123 from
its sitemap's `/jobs/keyword-<slug>` URLs). `fetchDouUa` moved out of `AGGREGATOR_FETCHERS` into
`REGIONAL_FETCHERS` alongside `fetchDjinni`, both now one fetch per configured category. Not added
to the real `data/sources.yaml` -- only the mechanism, `examples/onboarding/sources.yaml`, and the
reference file were touched; opting in (and picking real categories) is the candidate's own call.

Ruled out for a third UA source, confirmed via a real fetch attempt: **robota.ua** (no public API,
403s automated fetches) and **work.ua** (RSS exists but sits behind Cloudflare bot protection --
`cf-mitigated: challenge` on a plain fetch with a real User-Agent).

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

- **Per-company cap on how many postings one scout run surfaces.** Found via a real `skipped`
  batch analysis 2026-08-31: one company (Canonical) posting 10+ near-identical EM roles in one
  run burned that many judgment turns on what was really one decision ("this company's own
  application process doesn't fit," not "10 separate roles don't fit"). Worked around for now via
  a `hard_exclude` entry in the candidate's own `data/sources.yaml` (company-specific, reversible,
  not a code change) -- the real fix would be a `max_postings_per_company_per_run`-shaped config
  in `scout_domain.ts`/`scout_prefilter.ts`'s dedup step, not started. Not urgent while the
  workaround holds; worth doing if a second company does the same thing.
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
