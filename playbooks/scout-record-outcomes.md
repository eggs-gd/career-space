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
  `matched: false` for, read by hand) has neither — omit both and the tool computes them the same
  way a hand-pasted posting is handled. Don't reach for the local `posting_ids` module.
- For a **large batch** (many full posting texts), write the `items` array to a JSON file and
  pass `items_file` (or `--input` on the CLI) instead of a giant inline call.

The tool decides matched vs rejected from `min_fit_score`, writes `seen.jsonl`, creates vacancy
folders for matches, writes full `fitment.md`, and re-renders the board when matched records were
created.
