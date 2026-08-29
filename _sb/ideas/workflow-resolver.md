# MCP workflow resolver -- brainstorm, not started

Captured 2026-08-30. An architectural idea, not a design that's been reviewed against real
edge cases yet -- see `_sb/roadmap.md`'s "Later / maybe" for status.

## The observation

career-space's playbooks split into two different kinds, even though nothing currently marks
them as such:

- **Action playbooks** -- one atomic piece of real reasoning: `fitment.md` (judge a posting),
  `requirement-evidence-plan.md` (map requirements to evidence), the write step inside
  `cv-targeted.md`/`cover-letter.md`. These genuinely need a model.
- **Orchestration playbooks** -- a sequence of those actions glued together with logic that's
  almost entirely deterministic: `cv-targeted.md`'s own shape is "if `targeting-plan.md` exists,
  reuse it; if not, run `requirement-evidence-plan.md` first," `vacancy-resolve.md`'s "if this
  vacancy is already on the board, don't ask for the posting again."

Right now the agent re-reads the orchestration playbook every single call, walks its linked
files, checks which artifacts already exist on disk, and interprets the `if/else` itself. None
of that actually needs natural-language understanding -- it's "does this file exist," "what does
this status say," restated as prose the model has to reason through anyway.

## The proposal

Add a workflow resolver to the MCP layer. One entry point: `resolve("cv-targeted", vacancy_id)`.
The resolver knows the workflow graph for that name, checks real state (files, `record.yaml`,
artifact presence/freshness) deterministically, and returns exactly one thing: the next action
that actually needs a model, with every input it needs already assembled.

```
workflow: cv-targeted

completed:
  - fitment
  - evidence-mapping
  - targeting-plan

next_action: generate-targeted-cv

inputs:
  - vacancy
  - targeting-plan
  - relevant candidate data
  - strategy

instructions:
  <action playbook>

output:
  data/vacancies/foo/cv-targeted.md
```

The agent never sees that the workflow had five steps, never greps the filesystem, never
decides for itself what's safe to skip. It gets one concrete task, scoped to whatever the
current state actually calls for. After the action runs and its artifact is saved, the next
`resolve()` call either hands back the following action or reports the workflow complete.

```
User intent
    |
MCP workflow resolver
    |
current state + deterministic if/else
    |
minimal unresolved action + exact context
    |
LLM reasoning
    |
artifact / state change
    |
MCP
```

## The boundary that makes this safe

MCP routes, it never judges. Everything the resolver itself decides has to be answerable from
state alone, with no natural-language understanding involved: does a file exist, what does a
status field say, is a dependency satisfied, is an artifact current against some hash/revision.
The moment a question requires judgment -- is this fitment actually good, which evidence is
stronger, how should this candidate be positioned, what should this sentence actually say -- it
stays a model action, full stop. The resolver's whole value depends on never quietly absorbing a
judgment call into its deterministic branching.

Stated as a general rule: **if a branch can be resolved from state without understanding
natural-language meaning, the model should never see that branch. Code routes; the model
reasons.**

## Why this would be worth it

- **The real token lever is input-slicing, not the `if/else` itself.** The `if/else` in
  orchestration prose is cheap on its own (tens of tokens). The actual recurring cost is that
  every action reads all of `data/CV_GENERAL.md` even though it's already informally scoped by
  `<!-- audience: fit, planner -->`-style tags per section -- those tags are currently just
  something the agent reasons about after already paying to read the whole file. A deterministic
  pre-step that hands back only the sections tagged for the current action's audience is a real,
  sizable cut -- and it's safe: it slices raw source text, it doesn't cache a *selection* made
  from that text, so it doesn't touch "selection fields are not a cache" at all.
- Less room for two different agents (or two different runs of the same agent) to interpret the
  same orchestration logic differently -- the branching lives in one place, not re-derived from
  prose each time. This is the strongest justification for the idea overall, stronger than the
  token case.
- One entry point that works the same way for Claude Code, Codex, Gemini, Cursor -- and,
  potentially, a plain chat client with MCP access, not just a coding agent.
- Once this repo has outside users (open-source direction), most of them only ever need to read
  actions in prose ("assess fit against these params") -- orchestration becomes internal
  mechanism, not something every user needs to open and understand. A linear step sequence
  (fit -> evidence -> plan -> targeted CV) genuinely reads better as five-to-ten lines of
  formatted, highlighted code than as the same sequence spread across three cross-referencing
  playbook files. This tradeoff is phase-dependent -- while this is a single developer's own tool
  under active development, keeping orchestration in editable prose still has real value; it
  weakens specifically once there's a broader user base that isn't also the one building it.

## Staleness -- resolved, not still an open question

"Does an existing artifact still count as current, or does the resolver need to re-run the step
that produced it" sounds like a hard problem in the abstract (the academic risk: `CV_GENERAL.md`
could have changed since `targeting-plan.md` was generated). In practice the risk is small: an
artifact that already exists was very likely already used (applied) close to when it was
generated -- the real window for drift is narrow. Two cheap, concrete checks cover the realistic
case without needing to solve staleness in general: (1) a status check -- generated-but-not-yet-
applied gets regenerated fresh, already-applied is treated as a historical artifact, not
something to silently redo; (2) a content hash/mtime on `CV_GENERAL.md` recorded at generation
time -- unchanged since, the artifact is current, changed, it isn't. Neither requires the
resolver to understand anything about the artifact's own content, so this stays inside the
"code routes" boundary above, not a judgment call in disguise.

## Open questions this brainstorm doesn't answer yet

- What the "workflow graph" is actually made of -- a new config format, or something derived from
  the existing playbooks themselves.
- How much of today's orchestration prose (`vacancy-resolve.md`,
  `requirement-evidence-plan.md`'s existence check, `cv-targeted.md`'s Step 2) would need to be
  rewritten as resolver logic vs. staying playbook text for a host with no MCP.
- Whether this needs the same host-capability fallback shape as the subagent idea (`_sb/
  roadmap.md`) -- a host without this MCP tool would need the current prose-driven path to keep
  working unchanged.
