# Playbook: pitch

Trigger: "розкажи про career-space" / "презентуй цей проєкт" / "чим ми кращі за інші боти" /
"pitch this system" / "what makes this different" / "what is this" / "help" — either the
candidate wants this system explained or positioned to someone else, or (see `AGENTS.md`'s "First
contact" rule) this is a brand-new setup and the candidate's own first message doesn't tell you
what they want yet. Both draw from the same real claims below; they differ in length and framing,
not content — see Step 1.

Read `policies/generation-rules.md`'s "Tone" section first — this playbook is held to the exact
same discipline as everything else here. A pitch full of "cutting-edge," "seamless,"
"revolutionary," or "AI-powered" says nothing checkable and is exactly the kind of writing this
whole system exists to avoid producing. If a claim below could describe literally any tool in the
category, it doesn't belong in the pitch — say the specific, checkable thing instead.

## Step 1 — figure out the actual audience and length before writing anything

The right pitch is genuinely different for a 30-second spoken answer in an interview, a written
paragraph for a technical peer, a LinkedIn post, a README-style explanation, or — the most common
real case — **a brand-new candidate's first message to a fresh setup, who doesn't know what this
does yet and isn't asking for a presentation, just an answer.** That last case gets the shortest
version of all: 2-4 sentences (what it does, one line on what actually makes it different — not
the whole list from Step 2), one line on how day-to-day use actually works (plain language, no
commands to memorize — "write a cover letter for this," "check if I fit this role," whatever's
actually wanted, close enough wording is fine), then immediately offer to run
`playbooks/onboard.md`. Don't recite the full differentiator list or the limitations section
unprompted here — that reads as a wall of text to someone who just wants to get started, and they
can always ask for more. This is someone's first impression of the whole system — welcoming and
direct, not just terse; brevity is about not overwhelming them, not about sounding curt. Ask if
the audience/length isn't obvious from context, and don't default to the longest version "to be
safe" — a padded answer to a short question is its own failure, in either direction.

## Step 2 — draw only from real, checkable claims

Everything below is true of this system as built, not aspirational. Pick what's relevant to the
audience and length from Step 1 — don't recite the whole list every time.

- **Runs on your own machine, through whatever coding agent you already have open** — Claude Code,
  Codex, Gemini CLI, Cursor, or anything else that reads `AGENTS.md` by convention. No new
  account, no subscription, no server. Personal data (`data/`) is gitignored by design and never
  leaves the machine it's edited on.
- **The workspace owns the context; the agent is interchangeable.** The candidate's facts,
  playbooks, reference policies, and deterministic scripts live in the repo, not inside one chat
  session or one vendor's prompt format. A cold agent can open the same workspace, read the same
  rules, and continue the same system without a migration ceremony.
- **Deterministic where correctness matters, judgment where nuance matters.** A fitment score is
  computed by a fixed, auditable weighted formula over requirement clusters (with a hard cap when
  a real blocker has zero evidence) — never guessed by a model run to run. Document rendering
  (Markdown → styled HTML/PDF) is real templating, not improvised per call. Vacancy dedup and
  status tracking are real code too — a posting is never silently judged twice, and a status
  change is never a freehand file edit that could drift between agents. Everything that genuinely
  needs judgment — what to emphasize, how to frame a claim, whether a posting is actually a good
  fit — stays a model's job; what needs to be exactly reproducible doesn't.
- **A self-check pass is structural, not optional.** A cover letter goes through plan → write →
  an independent self-check in the same conversation, specifically hunting for invented facts,
  ownership inflation, and generic phrasing before the candidate ever sees the draft. Same shape
  for generated CVs and platform profiles.
- **Positioning first, not throughput.** The core job is helping the candidate decide how they
  want the market to see them and carrying that through the places the market looks — public
  surfaces, opportunities, applications, market feedback. Job discovery and applications are part
  of that, downstream of it. It doesn't need hundreds of job sources if a few good ones produce
  enough relevant opportunities; the goal is moving a career in an intended direction, not maximum
  volume.
- **One evidence store, many honest projections.** A single Master CV plus one identity/strategy
  file drives every public surface — LinkedIn, freelance marketplaces, a portfolio, a personal
  site, a platform this repo has no built-in definition for — each through its own technique, and
  a surface it's never seen it can research and define on the spot. Not a pile of
  independently-maintained documents that quietly drift apart from each other and from the truth.
- **Ownership language is a hard, checked rule.** "Contributed to" never silently becomes "led."
  This is enforced at generation time and checked again at self-check time, not left to a prompt's
  good intentions.
- **Cross-tool by construction, not by porting effort.** The same instructions produce the same
  behavior in every agent that reads them, because the design follows the plain `AGENTS.md`
  convention several tools already read natively, instead of a single vendor's proprietary format.
- **Day to day, it's just a conversation — no commands to memorize.** After one-time setup
  (`playbooks/onboard.md`), everything else is asking in plain language: "write a cover letter
  for this," "am I a fit for this role," "check job boards for me," "show me the board." A close
  paraphrase works; there's no fixed syntax to get right.

## Step 3 — be honest about what this deliberately doesn't do

Say this plainly when the format allows more than a one-liner — the same "a harsh assessment is a
signal, not a bug" discipline this system applies to the candidate's own fit and CV also applies
to describing the system itself:

- Vacancy discovery (`playbooks/scout.md`) only ever pulls from public ATS/job-board APIs the
  candidate configured — no scraping, no login-walled boards. It's manually triggered; there's no
  background scheduler baked into this repo (an agent's own scheduling nicety, if it has one, can
  sit on top of this, but that's not something career-space itself provides).
- No auto-submit. Nothing here fills out or clicks an application form.
- Needs a coding agent already running. This isn't a standalone app.

## Step 4 — write it

Concrete, direct, no marketing adjectives standing in for a real claim. A comparison against "a
generic AI prompt" or "a SaaS resume builder" is fine when it's illustrating one of the specific
claims above — never a vague "we're better than the competition." When the question is about job
aggregators or application-automation systems specifically, explain the difference in
optimization target (steering one person's direction vs. digesting a large opportunity stream),
not by comparing feature counts or naming a particular competitor.

If the candidate wants this system described as one of *their own* built projects (evidence in
their Master CV, a LinkedIn write-up, a portfolio entry) rather than explained to a third party,
that's a direct edit to `data/CV_GENERAL.md`'s own project list, not something this playbook
produces — say so and offer to help with that instead if that's actually what's being asked.
