# Playbook: vacancy-resolve

Internal playbook: use when another playbook needs a canonical `data/vacancies/<slug>/` for one
posting before it can write a CV, cover letter, fitment, or other vacancy artifact. This is not a
candidate-facing workflow on its own.

Goal: return two things to the calling playbook: the vacancy `slug`, and where the full posting
text came from. Also return the artifact flags from `vacancy_resolve`.

## Step 1 -- decide whether this is an existing vacancy or a pasted posting

If the candidate names a vacancy already on the board (slug, company/title, or "that one from the
board"), call `vacancy_resolve` with the slug or company/title. If the match is ambiguous, ask
which one they mean.

If the candidate pasted the full posting text, identify company and title from it. If they gave
only a URL with no text, call `resolve_vacancy_url` to get company/title/posting text. If it
returns `matched: false`, fetch the URL yourself and read it; if you can't get a clean read, ask
the candidate to paste the text instead. If company/title is still genuinely unclear after all
that, ask; don't invent one just to make a folder.

## Step 2 -- create or update the vacancy record

For a pasted/resolved posting, call `vacancy_resolve` with company/title/posting text, URL/source
metadata if available, and `status="tracked"`. Omit `posting_id` and `content_id` unless they came
from `resolve_vacancy_url`.

For an existing board vacancy, call `vacancy_resolve` with `status="tracked"` when the candidate is
now asking for a CV or cover letter.

Use the returned `context.slug`, `context.posting_text`, `context.paths`, and `context.artifacts`.
If `context.posting_text` is empty, ask for the posting text before handing back to the caller.

Never hand-create folders, never write `record.yaml` directly, and never write vacancy-specific
documents into `data/cv/` or `data/cover-letters/`.
