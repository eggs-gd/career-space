# pedigree-requirement-cluster

**Tests:** `playbooks/fitment.md`'s rule (added 2026-09-07) that a **"who we're looking for" /
"ideal candidate" / background** section is a requirement cluster, not colour — and that a
posting whose *vocabulary* matches the candidate's own positioning does not get a free pass on
the *context* (client-facing vs internal, external enterprise vs own product, advising vs
building). Also `playbooks/engagement-fitment.md`'s win-probability cluster and its
crowded-pool → `critical` escalation of the pedigree cluster.

Found this way: a fractional AI-consulting posting ($100–200/hr) scored 10/10 `good_bet` because
the agent matched the AI-agent/discovery/architecture vocabulary and folded the "candidates with
experience at Palantir / PwC / Deloitte / McKinsey …" section into "strong overlap" instead of
judging it against the candidate's actual role history (product engineering leadership, no
enterprise-consulting background). See run history.

## Setup

A synthetic candidate whose history is product engineering leadership (~20 yrs, no
Palantir/Big-4/McKinsey/forward-deployed consulting) with strong recent hands-on AI/agent work.
`career-space` MCP connected or CLI available. Two variants, each its own fresh agent:

- **Engagement:** a pasted commercial-work posting whose body wants AI agents / discovery /
  architecture / executive-facing work (vocabulary the candidate's positioning uses), with a
  prominent "WHO WE ARE LOOKING FOR" section naming enterprise-consulting firms and a
  forward-deployed / digital-transformation background as "preferred, not required", and
  crowded-pool signals (50+ proposals, invites already sent, client interviewing a couple).
- **Employment (mirror):** a pasted vacancy for a role the candidate's skills fit, with an
  "ideal candidate" paragraph naming a background the candidate lacks (e.g. "you've scaled
  engineering at a high-growth B2B SaaS company from Series A to C").

## Prompt

> Should I take this one? [engagement] / Am I a fit for this? [employment]
> [respective posting pasted]

## Passes if / fails if

**Passes if:** the agent extracts the pedigree / background section as its own requirement
cluster, anchored on real role history (naming the specific stale/tangential entries it judged
against, or stating none exist), scores it `direct_partial` / `transferable` / `none` honestly —
not `direct_strong` off a vocabulary match — and does not let a strong match on the rest of the
posting absorb it. On the engagement variant it also builds a win-probability cluster reflecting
the crowded pool, and bumps the pedigree cluster to `critical` when the field is visibly
filtering on that axis. The final score and `fit_category` reflect the gap (a `stretch` /
`thin_margin`-shaped result, not a clean `good_bet`).

**Fails if:** the pedigree section is treated as flavour / folded into "strong overlap" / scored
`direct_strong` because the posting's wording echoes the candidate's positioning; **or** no
cluster is created for it at all; **or** (engagement) a 50+ proposal pool the client is stocking
with a background the candidate lacks moves the score zero points.

## Run history

- 2026-09-07: **Found a real miss, fixed across three reruns.** Run against real candidate `data/`.

  **Before:** the FDE-style engagement ($100–200/hr) scored **10/10 `good_bet`** — the agent
  never built a cluster for the "WHO WE ARE LOOKING FOR" enterprise-consulting/forward-deployed
  section; its `appeal` line ("asks almost word-for-word for the candidate's current positioning")
  shows it matched vocabulary and let that carry the score. A second, lower-rate engagement
  (Principal AI Architect advisory, $30–60/hr) scored **8/10 `thin_margin`** — the number
  contradicted the category because a `critical` economics gap (`evidence: none`, the rate) only
  weighted the average, it didn't cap.

  **Fix 1:** the "background section is a requirement cluster, not colour" paragraph +
  vocabulary-vs-context warning in `fitment.md`; `engagement-fitment.md` adds the win-probability
  cluster and the crowded-pool → `critical` pedigree bump.

  **Rerun 1:** FDE **10 → 9** (pedigree now extracted, `important`/`transferable`, grounded in the
  candidate's stale/tangential consulting-shaped history); advisory **8 → 6** (economics
  `critical`/`none` drags it, number and category agree).

  **Rerun 2** (win-probability + pedigree bump): FDE **9 → 8**, category flips to `thin_margin`.
  Win-probability cluster built `critical`/`none` (quoting "Proposals: 50+", "Invites sent: 11").
  The agent itself flagged the residual: *"the 8/10 headline overstates it — the formula dilutes a
  single zeroed critical cluster."*

  **Fix 2:** `score_fit.ts` `CRITICAL_GAP_SCORE_CAP = 5` — a non-`blocking` `critical` cluster with
  primary `evidence: none` caps the score at 5. Shared by both playbooks.

  **Rerun 3:** FDE **8 → 5 `thin_margin`**. All six clusters built as intended, the cap fired
  ("Uncapped weighted score would have been ~8"), verdict "Pass, or bid only with a genuinely
  sharp discovery-led angle — bought on consulting pedigree the candidate doesn't have, into a
  pool that's already interviewing."

  **Net: 10 → 9 → 8 → 5.** The number matches the honest read. Case passes; keep it as the
  regression guard for pedigree-cluster extraction and the two `score_fit` caps.
