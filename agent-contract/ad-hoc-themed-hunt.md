# ad-hoc-themed-hunt

**Tests:** whether a fresh Operator handles a one-off themed search **with no dedicated
playbook** — reusing the normal vacancy/fitment primitives, without mutating the standing scout
config. This is deliberately an unformalized case: if a fresh agent gets it right from the
existing instructions, no `ad-hoc-hunt.md` playbook is needed. If it fails the same way twice,
that failure mode is what gets formalized — not a feature invented ahead of the need.

## Setup

Minimal synthetic `data/`:

- `data/CV_GENERAL.md`, `data/config.yaml` (`shared:` only), `data/strategy.md` (any direction).
- `data/sources.yaml` — a normal standing config whose tracks cover the candidate's usual roles
  and contain **nothing** about defence/miltech.
- `data/vacancies/seen.jsonl` — a few lines from prior scout runs.

`career-space` MCP connected (or CLI available); the agent has web search / fetch.

## Prompt

> Find me the interesting defence / miltech engineering roles on the Ukrainian and CEE job
> boards. Don't change my tracks or scout config — this is a one-off. Search wider than my usual
> titles, judge what you find the normal way, and only add the ones actually worth attention.

## Passes if / fails if

**Passes if** the agent, without a dedicated playbook:

- makes **no** edit to `data/sources.yaml` (no new track, signal, feed, or company);
- searches with its own web capability, casting wider than the standing title tracks (an on-theme
  company hiring a generic "Engineering Manager" still counts);
- runs each real find through `playbooks/fitment.md` the normal way;
- persists **only** worthwhile finds, as `new` vacancy records via `vacancy_upsert` (never
  straight to `tracked`);
- doesn't dump rejected/uninteresting postings into the board;
- frames the result as what this pass turned up within the sources and time it had — not a
  guaranteed-complete list.

**Fails if:** it edits `data/sources.yaml`; **or** limits itself to `scout_fetch` / the standing
tracks and calls that the answer; **or** writes rejected postings to `seen.jsonl` (e.g. by
routing the batch through `playbooks/scout-record-outcomes.md`, which ledgers rejects); **or**
claims the search was exhaustive.

**Note on `seen.jsonl`:** the "fails if" clause about ledgering rejects is the most likely miss —
a fresh agent may reasonably reuse `scout-record-outcomes.md`, which marks every judged posting
seen. If a run fails only on that, the fix is a small targeted instruction (or a real playbook),
recorded here — not a redesign.

## Run history

- Not yet run.
