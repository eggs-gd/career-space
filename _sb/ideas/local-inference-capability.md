# Local inference as an optional MCP capability -- brainstorm, not started

Captured 2026-08-30. Refines/supersedes the mechanism (not the goal) of `_sb/roadmap.md`'s
"offload narrow, mechanical LLM sub-steps to a cheaper-model subagent" item -- same underlying
target (cheap steps shouldn't cost host-model prices), different, more agent-agnostic mechanism.

## The core idea

Don't build API-key/model-routing orchestration into career-space's core -- that's exactly the
application-level LLM-calling layer career-wizard had, and re-growing it back in is a real risk,
not a hypothetical one. What's cleaner: local inference as an *optional capability the MCP server
can discover*, not a host-specific mechanism.

Not this (application-level LLM orchestration, back to career-wizard's own shape):

```
career-space
  -> own LLM router
  -> OpenAI / Anthropic / Gemini / Ollama
  -> prompts / retries / parsing / fallback
```

This instead:

```
Agent host
   |
   +-- expensive reasoning -> current Claude/ChatGPT/Codex
   |
   +-- career-space MCP
          |
          +-- deterministic tools
          |
          +-- optional cheap_reasoner
                    -> local model
```

The MCP server exposes what it can do, not which model does it:

```
capabilities:
  local_inference:
    available: true
    model: qwen-whatever
    suitable_for:
      - classification
      - extraction
      - tagging
```

An action describes what it needs, not which executor should run it:

```
action: extract-vacancy-metadata
execution:
  requires: semantic
  tier: cheap
  fallback: host

action: strategic-fitment
execution:
  requires: judgment
  tier: host
```

Whatever resolves actions (see `_sb/ideas/workflow-resolver.md` -- this is meant as a slot inside
that same resolver, not a separate system) checks whether a capability matching the action's
requirement exists. No local inference configured -> the action goes to the host agent exactly
like today. Local inference configured -> a cheap/mechanical action runs there instead, and the
host agent never even sees it as a step.

## Why this beats the subagent version

The earlier subagent idea (spawn a cheap-model subagent via Claude Code's own `Agent`/Task tool)
hits a real wall: subagent spawning is a host capability, and Codex CLI/Gemini CLI/Cursor have no
confirmed equivalent -- the whole idea only works on one host. Capability discovery through MCP
doesn't have that problem: the MCP protocol itself is what every host already speaks, so this
works identically everywhere a career-space MCP connection exists, local model or not. This is
the actually agent-agnostic version of "route cheap steps to a cheap model."

## What this looks like for two different users

- **No setup**: everything runs through whichever host model the user already has open. More
  usage cost, zero configuration -- today's exact experience, unchanged.
- **Advanced**: stood up a local inference endpoint -> career-space sees it -> extraction/
  classification/tagging/prefiltering run locally, the expensive host model only ever sees
  genuinely hard judgment calls. A future hosted edition (see `_sb/ideas/hosted-mcp-saas.md`)
  could offer a shared cheap backend later -- same abstraction keeps working either way.

## Where in the pipeline this actually fits

Not fitment as a whole -- its lower layers:

```
vacancy
  |
[local]
normalize / extract requirements / extract tags / classify seniority /
classify role family / extract location policy
  |
[deterministic]
prefilter
  |
[host model]
personal strategic fit / evidence interpretation / final judgment
```

Evidence extraction from the Master CV is a candidate too, on one condition: its output can never
become unverified truth downstream. A local model can surface candidate evidence; the expensive
action still decides what's actually relevant and how strong it is. This is the same discipline
`score_fit.ts`'s whole design already depends on -- a deterministic formula over a judgment call
is only as good as that judgment, so whatever hands it structured input has to actually be
reliable, not just cheap. A weak model mis-tagging seniority is a minor problem; a weak model
mis-extracting requirement clusters that then get scored as if they were solid is a real one --
"which steps are safe to run cheap" needs the same real audit the subagent version already
flagged, and matters even more here since a genuinely weaker model, not just a smaller flagship
one, is now in play.

## Quality control -- not a hypothetical, this already happened

A real, previously-observed case, cited here as a general illustration of model degradation, not
a location-check bug specifically: career-wizard's deterministic OpenAI-API pipeline scored a
posting 8/10. The same posting, judged instead by a full conversational agent, came out 3/10. The
posting's location said "Remote" -- but specifically "Remote, America." The deterministic
pipeline saw the word "remote," ticked the location box, moved on: narrow context, no chat
history, no room to doubt itself. The conversational agent wasn't even told to scrutinize
location -- it noticed the inconsistency on its own, judged that it didn't have enough certainty,
and went and looked up how the company actually operates before finalizing a score. Expensive in
tokens; the correct verdict either way -- and the wrong one (8) would have sent the candidate
into an application that could never actually have worked. The specific mistake could just as
easily have been a different field entirely -- the actual lesson is about what a narrower/cheaper
pass structurally can't do (doubt itself, notice an inconsistency, go verify), not about location
checks in particular.

**The general answer isn't "pre-classify every step as safe or unsafe for cheap tier" -- that's
exactly the kind of judgment call this case shows is hard to get right in advance** (location
extraction looked obviously mechanical right up until it wasn't). The more robust pattern: cheap
tier proposes, host tier sanity-checks before accepting, as a standing part of consuming *any*
cheap-tier output, not a per-step audit decision made once at design time. The host model doesn't
need to redo the extraction -- it needs to glance at what came back and ask "does this look
right, or does something here deserve a second look" before treating it as settled input to a
judgment call. Cheap and wrong is worse than expensive and right for anything that gates whether
a real application happens.

**The sanity check has to be free, or close to it -- if it costs close to what the cheap tier was
supposed to save, the whole tier buys nothing.** A dedicated re-verification pass (a second real
call, re-reading the source specifically to check the first pass's work) defeats the point --
that's not a sanity check, that's just paying for the task twice. The check needs to ride along
on work the host model already has to do for its own reasons, not exist as its own separate
action: the host model's own `personal strategic fit`/`evidence interpretation`/`final judgment`
pass already has to read the posting for its own judgment call, so a location-scope
inconsistency (or any other cheap-tier miss) is something it can notice for free while already
looking at the source -- not something that needs its own dedicated verification step. If a
"sanity check" can't be folded into work the host model was already doing, it's not actually
cheap, and the honest conclusion is that step wasn't a good cheap-tier candidate after all.

(Confirmed live, while writing this down, that this exact blind spot already exists in
career-space's own current code, deterministic tier, no local model involved at all --
`scout_prefilter.ts`'s `_passes_location_gate` passes on the bare word "remote" with no scope
check. `fitment.md` picked up an explicit instruction to read the actual scope attached to
"remote" instead of pattern-matching the word alone, precisely because of this case.)

## Why this isn't being built now

The current property is worth protecting: clone the repo, open an agent, it works. Trading that
for "clone, install Ollama, pull a 12GB model, configure an endpoint, debug CUDA, now it's
cheaper" is a real cost most users shouldn't have to pay for a capability most won't use. Right
move for now: when the workflow resolver idea gets a real `executor`/`capability` concept, define
exactly two real ones (`deterministic -> MCP`, `reasoning -> host agent`) and leave `cheap
semantic -> optional local executor` as a named, empty third slot -- not built, not closed off
either. Worth actually building only once real usage data shows a real share of work is
mechanical extraction/tagging, not assumed ahead of that.
