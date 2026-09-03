# Playbook: scout-record-outcomes

Internal playbook: use after a candidate has been fetched (by `playbooks/scout.md` or
`playbooks/add-from-url.md`) and judged with `playbooks/fitment.md` + `score_fit`. This owns the
scout ledger write and creation of vacancy folders for matches.

Call `record_scout_outcomes` with the judged batch, passing each scout/add-from-url candidate and
the structured `score_fit` result (`score`, `fit_category`, `eligibility`, `markdown`) plus the
one-line reason you want stored in the ledger/record.

The tool decides matched vs rejected from `min_fit_score`, writes `seen.jsonl`, creates vacancy
folders for matches, writes full `fitment.md`, and re-renders the board when matched records were
created.
