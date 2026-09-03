# career-space roadmap

`_sb/` ("storyboard") is internal project planning -- status, decisions, what's next. Not part of
any candidate-facing playbook, never read during normal execution; see `AGENTS.md`'s note on this
split. Keep this current and terse -- a list of what exists and what's next, not a changelog; how
and why each one was built lives in git history, not here.

## Status as of 2026-09-01

**Built** (see `_sb/architecture.md` for how any of this actually works):
- [x] Onboarding -- Master CV, config, role profiles, and a starter `data/strategy.md` from a
      conversation. A candidate who doesn't know their direction yet is a valid input -- the
      strategy file persists the open questions instead of forcing target titles.
- [x] Fitment check -- private, employer-side fit read against a pasted posting. Candidate-side
      suitability ("do I actually want this") is a separate, independent judgment -- see
      Prioritize below, never inferred from a fit score.
- [x] Cover letter generation.
- [x] CV generation -- universal (by role profile) and targeted (per vacancy). A targeted CV
      echoes the vacancy's own posted title when the Master CV honestly supports it, for ATS
      matching -- see `policies/cv-writing-policy.md`'s title rule.
- [x] CV review -- blunt quality diagnostic (score, top fixes, strengths, risks, target role
      slices, likely interview questions) for the Master CV or any generated CV.
- [x] Pitch -- explain/position career-space itself, audience- and length-aware.
- [x] Public career surfaces -- one abstraction (`shared:` identity + per-surface `context.md`
      intent + `reference/surfaces/<name>.md` platform facts -> `output.md`). Ships LinkedIn /
      Djinni / Upwork / Fiverr as canonical references; `surface-define.md` handles free-form
      surfaces (portfolio, personal site, GitHub README) and unknown platforms (agent researches
      + defines per-candidate, no code change). `update-surface.md` regenerates from evidence.
      Projection-is-subtraction invariant: a narrower surface leaves out umbrella breadth that
      doesn't serve its role (guards the observed leak where every surface converged to one
      profile). Still open: change-propagation -- when strategy/evidence changes, which surfaces
      are actually affected.
- [x] Scout -- auto-fetch/filter/dedup postings from 14 job boards/aggregators (plus 4 supported
      per-company ATS types -- greenhouse/lever/ashby/recruitee, opt-in per company in
      `sources.yaml`), judged the same way as a pasted posting. `scout_fetch`'s `feeds` param can
      restrict one run to a subset of the configured `feeds:`. `douua`/`djinni` need a track's own
      `ua_categories:` to return anything (exact-match category taxonomies -- see `reference/
      ua-scout-categories.md`); `jobico` searches by track `titles` directly, no extra config.
      `robota.ua`/`work.ua` ruled out (no public API / Cloudflare-blocked) -- don't re-investigate.
- [x] Add a vacancy from a bare URL -- `playbooks/add-from-url.md`. `resolve_vacancy_url`
      recognizes greenhouse.io/lever.co/ashbyhq.com/recruitee.com/jobico.io URLs and fetches that
      exact posting via that platform's own single-item API (same reliability as a scout-found
      one); any other host falls back to the agent's own fetch/read capability, shown to the
      candidate before writing anything. Either way, the result still goes through
      `fitment.md`/`scout-record-outcomes.md` and lands at `new` (or just `seen.jsonl`) -- never
      `tracked` directly, unlike `vacancy-resolve.md`'s handling of a pasted full posting text
      (which does go straight to `tracked`, since pasting the whole text already implies a
      decision a bare link doesn't).
- [x] LinkedIn search links -- ready-to-click Boolean search deep-links. People-search needs a
      track's own `hiring_titles:` to appear at all.
- [x] Dashboard/board -- every vacancy on one page, grouped by status, sorted by fit; fully usable
      with no JavaScript. A vacancy matching `local_keywords` gets a colored highlight. A vacancy
      can be archived (`vacancy_set_archived`, orthogonal to `status`, `include_archived` brings
      it back). Each row has a `📁 Folder` panel with `file://` links to every file in the vacancy's
      directory (highlighted when a CV is present), for grabbing files to attach to an
      application. Each row has a "Copy"
      button -- header only (title/company/URL/status/fit/slug), not the posting text, meant for
      pasting into a new chat so an agent can resolve the rest itself. Status chips double as
      jump-to-section nav when JavaScript runs. A flat `board.md` twin is written alongside (one
      table, no embedded doc text) for handing to another agent.
- [x] Prioritize -- `playbooks/prioritize.md`. Candidate-side "do I actually want this," reasoned
      against `data/strategy.md` (plain prose -- blockers/preferences/strategic-alignment/
      exceptions). Independent of fitment in both directions -- works with or without a fitment on
      file. No persisted score -- a live judgment each time, until real repeated use shows a
      stable enough pattern worth formalizing.
- [x] Rendered CV/cover-letter output -- PDF/HTML with recruiter-facing filenames.
- [x] Board reconciliation -- `playbooks/reconcile.md`. Reads Gmail/Calendar (Google's official
      remote MCP servers, declared in the configs, host-composed -- no Google code here) as
      read-only evidence, moves tracked vacancy statuses to match recruiter correspondence, and
      stores the why on the `status_history` entry (`setStatus`'s optional `note`). Optional:
      skips cleanly with no email capability. Offered by `scout.md` before a run. See
      `docs/workspace.md` for the one-time Google Cloud + OAuth setup.

## Next steps, in order

1. **`cover-letter.md` structure decision** -- brainstorm-stage, product question not just an
   engineering gap. `_sb/reference/cover-letter-framework-vacancy.md` has a genuinely different
   vacancy-application shape (Blocks 1-4: What/Why me/Why them/CTA, plus its own validator
   criteria) vs. the freelance-proposal shape (Problem/Differentiator/Evidence/Scope/Core Message)
   the playbook currently always uses for both modes. Real open question is UX, not mechanical: a
   real sent batch (current shape) reads as genuinely engaging/triggering to a human reader; the
   framework's Blocks 1-4 is more formal and flatter -- likely the better bet for an ATS keyword
   scan, worse for a human reader. May end up needing both, chosen per posting, rather than one
   replacing the other. If/when this gets picked up, bundle in: wiring `cover-letter.md` to reuse
   `playbooks/requirement-evidence-plan.md`'s `targeting-plan.md` instead of re-deriving evidence
   independently (right now a CV and cover letter for the same vacancy can select different
   evidence for the same requirement), and the framework's vacancy-specific validator criteria
   (retells the resume, no concrete why-this-company, doesn't use the vacancy's own vocabulary).

## Later / maybe

- **Market-feedback loop -- learn from preserved outcomes.** The closed loop is `application ->
  market response -> learn -> strategy / positioning / selection`. The capture half is done:
  `reconcile.md` brings the market response in from email/calendar, and `setStatus`'s `note`
  records the why on each transition. Still open: the *learn* step -- reading the accumulated
  `status_history` notes for a pattern (a differentiator that keeps drawing rejections, a track
  that never converts) and feeding it back into positioning / scout config. Analysis/calibration,
  a separate step, not started. Reference: career-ops' `/outcome` + `calibrate.mjs`; other
  prior-art pointers in `_sb/ideas/career-ops-comparison.md`.
- **Per-company cap on how many postings one scout run surfaces.** One company posting 10+
  near-identical roles in one run burns that many judgment turns on what's really one decision.
  Worked around per-candidate via a `hard_exclude` entry in `data/sources.yaml` (reversible, not a
  code change); the real fix would be a `max_postings_per_company_per_run`-shaped config in
  `scout_domain.ts`/`scout_prefilter.ts`'s dedup step. Not started, not urgent while the
  workaround holds.
- **A.Team, if/when Upwork/Fiverr/freelance-network platforms get more active attention.** Not a
  real job posting source -- a freelance-talent-network platform that promotes itself by posting
  through aggregators like Remotive; "Apply" leads to registering for A.Team's own service, not an
  actual application. Worth a manual look alongside Upwork/Fiverr whenever that effort picks up,
  not as a scout source.
- **Lead-gen / outreach extension** -- extend scout's vacancy -> company -> fit chain one hop
  further: contact discovery + drafted outreach for top-fit vacancies. Not started. Principles
  agreed in advance for when it's picked up: (a) LinkedIn contact lookup/browser control stays an
  external capability (Claude in Chrome or similar), never scraping built into career-space
  itself; (b) agent researches + drafts, candidate approves/sends, no bulk automation; (c) no new
  root entity needed to start -- add `contacts.md`/`outreach.md` to the existing `<slug>/` folder,
  or a differently-shaped slug for a non-vacancy signal, in the same flat `data/vacancies/` list;
  only worth an `Opportunity`-root rename once a concrete non-vacancy signal actually needs it.
  Vacancy slug sorting (folder names don't sort by recency) folds in here rather than being its
  own item -- `render_board` already removes the need to eyeball raw folder order, so it's a
  machine/collision concern only, worth solving alongside this if at all.
- **Dashboard, expensive path** -- only if the cheap board proves insufficient. SvelteKit +
  static adapter. Not started, not clearly needed yet.
- **Offload narrow, mechanical LLM sub-steps to a cheaper-model subagent, host-capability-gated.**
  Some playbook steps are structured extraction, not real judgment -- small, classification-shaped,
  bounded input/output, no need for the full Master CV or conversation history. Two candidates
  worth evaluating on that basis when this gets picked up: `fitment.md`'s Step 1
  (requirement-cluster extraction) and cover-letter's task/long-term mode inference (Step 1).
  Worth trying on a cheaper model with a smaller, focused context instead of the full conversation
  -- spawned as a subagent (Claude Code's `Agent`/Task tool with a pinned cheap model), not a
  direct API call from a script, to stay agent-native rather than adding a separate LLM-calling
  layer to maintain.

  Real constraint, not yet solved: subagent spawning is a host capability, not something callable
  via MCP the same way on every provider -- Codex CLI/Gemini CLI/Cursor have no confirmed
  equivalent primitive. Use the same fallback idiom already established for MCP-vs-CLI ("if the
  host supports X, use X; otherwise do it inline") so this is a pure upgrade on hosts that support
  it and a no-op everywhere else, never a required step that breaks portability. Likely lands as a
  `.claude/`-scoped convenience (a subagent definition + a conditional playbook step), same shape
  as the existing `.claude/skills/` layer -- not a rewrite of the shared instructions. Needs real
  measurement once tried, not assumed savings -- and a real audit of which steps are actually
  mechanical enough to hand off before picking a first candidate.
