# Playbook: scout-record-outcomes

Internal playbook: use after a candidate has been fetched (by `playbooks/scout.md` or
`playbooks/add-from-url.md`) and judged with `playbooks/fitment.md` + `score_fit`. This owns the
scout ledger write and creation of vacancy folders for matches.

Call `record_scout_outcomes` with the judged batch, passing each scout/add-from-url candidate and
the structured `score_fit` result — its `evaluate()` output (`score`, `fit_category`,
`eligibility`, plus the rendered `markdown`), not `render()` alone (that's markdown with no
`score`) — plus the one-line reason you want stored in the ledger/record.

- A **scout-fetched** candidate carries real `posting_id`/`content_id` — pass them through.
- A **manually-obtained** candidate (an `add-from-url` URL that `resolve_vacancy_url` returned
  `matched: false` for, read by hand) has neither — omit **both** (one alone is rejected) and the
  tool computes them the same way a hand-pasted posting is handled. Don't reach for the local
  `posting_ids` module.
- For a **large batch** (many full posting texts), write the items to a JSON file — a bare array
  or `{ "items": [...] }`, both accepted — and pass `items_file` (MCP) or `--input` (CLI) instead
  of a giant inline call. A file-loaded batch is validated exactly like an inline one; a malformed
  item fails the whole call before anything is written.

The tool decides matched vs rejected from `min_fit_score`, writes `seen.jsonl`, creates vacancy
folders for matches, writes full `fitment.md`, and re-renders the board when matched records were
created.
