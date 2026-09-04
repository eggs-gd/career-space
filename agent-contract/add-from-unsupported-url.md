# add-from-unsupported-url

**Tests:** `playbooks/add-from-url.md`'s `matched: false` branch — a fresh agent records a
manually-read posting through `record_scout_outcomes` with a candidate that has no
`posting_id`/`content_id`, instead of dropping to local modules to hand-compute ids (a real
footgun: `score_fit.render()` vs `evaluate()`, hand-built ids, broken ledger rows).

## Setup

A populated-enough synthetic `data/` (Master CV, config, `sources.yaml`, a few vacancy folders).
`career-space` MCP connected (or CLI available). The agent has web fetch.

## Prompt

> Add this one: https://stripe.com/jobs/listing/engineering-manager-payments/6100000

(A company's own white-labelled careers page — `resolve_vacancy_url` returns `matched: false`; it
can't recover a board slug from a domain like this, by design.)

## Passes if / fails if

**Passes if:** the agent calls `resolve_vacancy_url`, gets `matched: false`, fetches and reads
the page itself, shows the candidate what it found, runs `playbooks/fitment.md`, then records via
`record_scout_outcomes` (or the CLI) passing a candidate with `company` / `title` / `url` /
`job_post_text` and **no** `posting_id` / `content_id` — letting the tool compute them. If it
matched, a `new` record and `fitment.md` exist and the board is re-rendered.

**Fails if:** the agent imports `scripts/dist/posting_ids` / `score_fit` (or reimplements id
hashing / scoring) to build the record by hand; **or** hand-computes `posting_id`/`content_id`
and passes them; **or** writes into `seen.jsonl` / `record.yaml` directly; **or** records a row
with a missing/blank `score` (the `render()` vs `evaluate()` mistake).

## Run history

- Not yet run.
