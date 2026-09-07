# Packaging and runtime -- plan, not started

Captured 2026-09-02. How career-space gets handed to someone as "a folder with my data + a thing
that runs it", without losing the agent's direct access to that data. Supersedes the earlier
"self-hosted remote MCP" framing (a remote server turned out to be the wrong shape -- see "Why
not a server"). Builds directly on `_sb/ideas/workflow-resolver.md` (the resolver mechanics live
there; not duplicated here).

## Three layers

1. **Instruction layer** -- `AGENTS.md` ground rules, the **actions** (see below), `policies/`,
   `reference/`. Public, MIT, identical for every user.
2. **Deterministic layer** -- `scripts/`: the scoring formula, rendering, scout fetch/dedup, the
   vacancy-record reconciliation contract, **and the flow resolver**.
3. **Data layer** -- `data/`: the user's private state. Gitignored. Stays local, always.

## actions vs flows

Every playbook is one of two things -- the current `playbooks/` already gestures at this
(capability playbooks vs orchestrators; the internal-playbooks list in `AGENTS.md`). Make it
explicit:

- **action** -- one atomic piece of model judgement with clear inputs and one output: judge a
  posting (`fitment`), map requirements to evidence (`requirement-evidence-plan`), write a cover
  letter from a plan, derive an interview thesis. These *need* a model. They stay **prose**,
  bundled in the package.
- **flow** -- orchestration: which action runs after which, under what condition. Almost all of
  the branching is "does `data/vacancies/<slug>/targeting-plan.md` exist? -> reuse it; else run
  `requirement-evidence-plan` first", "is this vacancy already on the board? -> don't re-ask for
  the posting". That is deterministic code, not model reasoning.

## flows move into the MCP

The MCP gets one entry point: `resolve(intent | flow, context)`. It knows the flow graph, checks
real state deterministically, and returns exactly one of:

- `{next_action, inputs, instructions}` -- the single next action that needs a model, with its
  inputs assembled and its prose attached;
- `flow_complete`;
- `not_a_flow` -- with the raw capability list, for a genuinely novel ask.

The agent never reads a flow playbook, never greps the filesystem to decide what's done, never
interprets an `if/else` written as prose. It gets one bounded task at a time. Full contract,
staleness handling, and the "code routes, the model reasons" boundary: `workflow-resolver.md`.

**"No instruction executes without the MCP"** means precisely: **no flow is ever re-derived from
prose by a model.** Actions stay prose (judgement lives in language). The always-loaded ground
rules stay in context. Ad-hoc work ("grep my vacancies for X") still happens agent-side.

## Why this dissolves the data-location dilemma

The dilemma was: the MCP seemed to need deep read/write of `data/` (render the whole board,
write records), which forced either co-locating data with the MCP (agent loses direct access) or
a full purity refactor (agent does all I/O, back to pre-MCP).

Under flows-in-MCP the MCP needs only **shallow state**: does a file exist, what does a
`record.yaml` field say, a content hash for staleness. Small, structured, cheap. Plus the same
pure computation it always did (score in -> number out; Markdown in -> PDF out).

And if the MCP is a **local subprocess**, reading the local `data/` folder for that shallow state
is free -- no sync, no co-location, no split-brain. The agent still has full filesystem access to
`data/` for everything outside a known flow.

## Conclusion: a package, not a server

Ship the deterministic layer + the resolver + the actions/policies as a **prebuilt npm package**,
run as a **local subprocess** -- what `.mcp.json` spawns, same as today, but with nothing to
build.

```
npx @career-space/workspace init ./my-career
```

creates:

```
my-career/
  AGENTS.md        # collapsed to the always-loaded ground rules + "this workspace is MCP-driven"
  data/            # empty, gitignored
  .mcp.json        # command: npx -y @career-space/workspace serve
```

- The package carries `dist/` (prebuilt) + its own deps. `npx` caches; first run is a package
  download, not `npm ci` of a dev tree + `tsc`.
- Chromium: `puppeteer-core` + system-Chrome detection; none found -> PDF degrades to HTML-only
  (the runtime already does this). No forced 150 MB download.
- Methodology updates: `init --update` re-syncs the stub + `.mcp.json` (actions/policies live in
  the package, so most updates touch nothing in the user's folder).
- Hacking on career-space itself: clone the repo, unchanged dev flow. The package is the
  consumer artifact.

## What changes downstream

- **The user's workspace becomes `data/` + `.mcp.json` + a small stub.** Actions and policies are
  package-bundled and served by `resolve()`, not loose files. This is what "just a folder with
  data" actually looks like.
- **`AGENTS.md` collapses.** The trigger table becomes intent -> `resolve()`. Data layout,
  scripts docs, dev docs move into the package/repo. What's left: the non-negotiable ground rules
  (never invent a fact, preserve ownership language, a harsh score is a signal) -- these are
  cross-cutting, they apply inside every action, so they stay always-loaded.
- **operator/developer split clarifies.** Developer = work on the package/repo. The operator's
  workspace has nothing to develop in. The current 40 lines of role-boundary agonising in
  `AGENTS.md` largely go away.
- **The deterministic action sub-steps** (`score_fit`, `render_*`) stay pure -- small refactor,
  mostly already true.

## The hard part

Not every flow branch is deterministic. `cover-letter`'s human-read-vs-ATS shape decision (the
playbook says "ask the candidate when genuinely unclear"), `fitment`'s blocking-or-not. The
resolver needs a node type beyond file-checks: **"this branch is a model decision -- call this
action, it returns a discriminated result, route on that."** That node type is the difference
between this being elegant and being a leaky mess. Design it against `cover-letter`'s shape
decision as the first real case.

## The tradeoff

The agent loses improvisation *within* a flow -- today it reads the whole orchestration and can
deviate mid-run. `workflow-resolver.md` already calls this phase-dependent: fine while this is
one developer's fast-iterating tool, weaker once there's a broader user base. Mitigation: the
`not_a_flow` escape hatch is first-class, so anything genuinely novel drops back to the agent
with raw capabilities, unaffected.

Development friction: changing a flow becomes a code change + package release, not a Markdown
edit. Counter: flows stabilise once right; actions (which change more) stay prose.

## Staging

1. **npm package, today's tools, today's prose playbooks copied by `init`.** Ships "no build
   friction, data local" now. No resolver yet.
2. **Formalise actions/flows in the prose.** Every playbook labelled one or the other. Doc
   refactor, zero code.
3. **Resolver for one flow** -- `cv-targeted` (nearly all-deterministic branching). Prove the
   contract including the judgment-branch node type, tested on `cover-letter`'s shape decision.
4. **Migrate flows one at a time.** Each migration shrinks `AGENTS.md` and the workspace.
5. **Collapse `AGENTS.md` to the stub.**

## Why not a server

A remote MCP would reintroduce the problem: flow resolution needs to read `data/` state, so a
remote server needs `data/` synced to it -- the exact co-location dilemma, back again. A local
subprocess reads local `data/` for free.

A server only earns its place under a specific want: **access the workspace from multiple
machines / a phone / a non-coding-agent chat client.** That is `hosted-mcp-saas.md` territory --
sync-replica or full multi-tenant -- and it accepts the loss of raw-filesystem flexibility *for
that access mode* while the local path keeps working unchanged. Not now, not without that want.

## Non-goals

- Multi-tenant, OAuth, billing -- `hosted-mcp-saas.md`.
- Serving actions over MCP resources vs embedding in the `resolve` response -- an implementation
  detail for stage 3+, not decided here.
- Auto-syncing `data/` -- the user picks a mechanism (git remote, Syncthing); career-space
  doesn't build one.
