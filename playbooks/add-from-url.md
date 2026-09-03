# Playbook: add-from-url

Trigger: the candidate gives a bare vacancy URL, no pasted posting text -- "додай цю вакансію:
<url>", "перевір цю: <url>", "track this one" plus a link.

Different in kind from `playbooks/vacancy-resolve.md`'s existing paste handling: pasting the
*full posting text* means the candidate already read it and decided (goes straight to `tracked`).
A bare URL is closer to an unreviewed scout signal -- it goes through the same fitment judgment as
a scout-found posting, landing at `new` (or nowhere, if it doesn't clear the bar), never `tracked`
directly.

## Step 1 -- resolve the posting

Call `resolve_vacancy_url` (MCP tool, or `node scripts/dist/resolve_vacancy_url.js <url>`).

- **`matched: true`, `already_seen: true`** -- this exact posting has already been judged before.
  Say so; if it has a vacancy folder, point at it (`vacancy_list`) instead of re-judging.
- **`matched: true`, a `candidate`** -- continue to Step 2 with it.
- **`matched: true`, an `error`** -- the URL is from a known source but the fetch itself failed
  (dead link, removed posting, malformed ID). Tell the candidate plainly, stop.
- **`matched: false`** -- this URL isn't from a source this repo fetches precisely. Fetch it
  yourself (your own web-fetch/browsing capability) and read the page. Show the candidate what you
  found -- title, company, the posting text -- before doing anything else; don't silently trust a
  generic fetch the way a verified source's own API is trusted. If you can't get a clean read
  (JS-rendered page, paywall, bot-block), say so and ask the candidate to paste the text instead.

## Step 2 -- judge it, same as a scout candidate

Run `playbooks/fitment.md`'s judgment on the resolved posting exactly as if the scout had found
it -- `candidate.job_post_text` is already shaped like a pasted posting. Skip the scout's own
prefilter (title_exclude/hard_exclude/location gate) entirely; that exists to cut noise from a
broad automated scan, and the candidate already chose this specific URL on purpose. Keep
`score_fit`'s structured result for Step 3, same as `playbooks/scout.md`'s Step 2.

## Step 3 -- record the outcome

Run `playbooks/scout-record-outcomes.md` for this one judged candidate -- same
`min_fit_score`/`fit_category` matched-vs-rejected split, same `vacancy_mark_seen`/`vacancy_upsert`
calls, `candidate.track_label` passed straight through. A match lands at `new`, exactly like a
scout-found one -- never jump it straight to `tracked`.

## Step 4 -- tell the candidate

If it matched, a new `new` record now exists. Show the fitment result the same way
`playbooks/fitment.md`'s own Step 3 does, and mention the natural next steps
(`playbooks/cv-targeted.md`, `playbooks/cover-letter.md`) the same way `playbooks/scout.md`'s
Step 4 does. If it didn't clear `min_fit_score`, say so plainly -- it's logged in `seen.jsonl`,
not lost, no vacancy folder was created, and the board is unchanged.
