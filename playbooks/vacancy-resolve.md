# Playbook: vacancy-resolve

Internal playbook: use when another playbook needs a canonical `data/vacancies/<slug>/` for one
posting before it can write a CV, cover letter, fitment, or other vacancy artifact. This is not a
candidate-facing workflow on its own.

Goal: return two things to the calling playbook: the vacancy `slug`, and where the full posting
text came from (`data/vacancies/<slug>/posting.md` or the pasted text in the current turn).

## Step 1 -- decide whether this is an existing vacancy or a pasted posting

If the candidate names a vacancy already on the board (slug, company/title, or "that one from the
board"), resolve it with `vacancy_list` (MCP tool, or `node scripts/dist/vacancy_store.js list`).
If the match is ambiguous, ask which one they mean. Once resolved, read that vacancy's
`posting.md`; don't ask the candidate to paste the posting again.

If the candidate pasted the full posting text, identify company and title from it. If they gave
only a URL with no text, call `resolve_vacancy_url` (MCP tool, or `node scripts/dist/
resolve_vacancy_url.js <url>`) to get company/title/posting text -- same mechanism `playbooks/
add-from-url.md` uses, resolved directly here instead since asking for a document (a CV, a cover
letter, a fitment check) is itself the "I've decided this is worth a look" signal `add-from-url.md`
would otherwise get from a fitment pass. If it returns `matched: false`, fetch the URL yourself and
read it (same fallback `add-from-url.md`'s Step 1 describes); if you can't get a clean read, ask
the candidate to paste the text instead. If company/title is still genuinely unclear after all
that, ask; don't invent one just to make a folder.

## Step 2 -- create or update the vacancy record

For a pasted posting, call `vacancy_upsert` with `company`, `title`, the full `posting_text`,
`url` if one was given, and `status="tracked"`. Omit `posting_id` and `content_id`; the tool
computes them so the same posting resolves to the same folder later.

For an existing board vacancy, don't call `vacancy_upsert` unless the candidate gave new posting
text or URL that should update the record. If the existing status is `new` and the candidate is
now asking for a CV or cover letter, call `vacancy_set_status(slug, "tracked")`.

Never hand-create folders, never write `record.yaml` directly, and never write vacancy-specific
documents into `data/cv/` or `data/cover-letters/`.
