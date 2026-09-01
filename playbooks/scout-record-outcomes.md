# Playbook: scout-record-outcomes

Internal playbook: use after a candidate has been fetched (by `playbooks/scout.md` or
`playbooks/add-from-url.md`) and judged with `playbooks/fitment.md` + `score_fit`. This owns the
scout ledger write and creation of vacancy folders for matches.

Input per judged candidate: `posting_id`, `content_id`, company/title, posting text, source
metadata, `track_label`, rendered fitment Markdown, score, category, `eligibility.location`
status/reason, and one-line reason.

## Step 1 -- decide matched vs rejected

A posting matches when its score is at least `data/sources.yaml`'s `min_fit_score`, its
`fit_category` is not `craft_mismatch`, and `eligibility.location.status` is not
`hard_location_block`. A `location_exception_candidate` is still allowed to match; it is a
tracked operational-risk flag, not a rejection category. Otherwise it is rejected for scout
purposes.

## Step 2 -- write the seen ledger

For every judged candidate, call `vacancy_mark_seen` with its ids, company/title, score/category,
reason, and `outcome="matched"` or `outcome="rejected"`. This happens for matches and rejections;
it is what prevents re-judging the same posting next run.

## Step 3 -- create folders for matches only

For a matched posting, call `vacancy_upsert` with `status="new"`, the full posting text, source
metadata, `track_label` (including `None` when it came through the role-signals lane), and
`eligibility_location_status`/`eligibility_location_reason` from the fitment judgment. Then write
the full rendered fitment Markdown to `data/vacancies/<slug>/fitment.md` using the returned slug.

For a rejected posting, stop after `vacancy_mark_seen`. Rejected scout results get no vacancy
folder.

Never replace the full `fitment.md` with only the compact score/category/reason in `record.yaml`;
the compact fit fields are an index, not the reasoning.
