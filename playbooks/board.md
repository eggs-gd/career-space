# Playbook: board

Trigger: "покажи дошку" / "show me the board" / "як справи з вакансіями" / "what's the status of
everything" -- the candidate wants an overview of every tracked vacancy, not one specific posting.

## Step 1 -- render

Call `render_board` (MCP tool, or `node scripts/dist/render_board.js` if the server isn't
connected). It writes `data/board.html` and a flat `data/board.md` twin -- every non-archived
vacancy (see "Archiving" below), grouped by status, sorted by fit score. Each HTML row shows:
whatever files actually exist in that
vacancy's folder (`fitment.md`, `posting.md`, `cv.md`, `cover-letter.md`, `targeting-plan.md`)
behind a click-to-expand badge; a `📁 Folder` panel with `file://` links to every file in that
vacancy's directory (for grabbing the CV/cover-letter files to attach to an application); a link
to the original posting URL; and a "📍 Local" badge when it matches `data/sources.yaml`'s
`local_keywords`.

If a candidate says a `📁 Folder` link goes nowhere, the likely cause is viewing `data/board.html`
through some client's own in-app file preview rather than a real browser tab -- suggest that
first. Same caveat for the status buttons
(jump to that section) and each row's "Copy" button
(copies just enough to name the vacancy unambiguously -- title/company/URL/status/fit/slug, not
the posting text -- meant for pasting into a new chat so an agent can resolve the rest itself)
-- both need a real browser tab with JavaScript; they're absent without it, everything else on
the page still works.

Don't hand-summarize `data/vacancies/` into a table yourself instead of calling this -- that
means re-reading every `record.yaml` to reproduce, in plain text with no working links, what
this tool already does deterministically in one call. If you only need the raw numbers/rows for
something else (not to show the candidate a page), `vacancy_list` returns the same underlying
data without writing a file.

## Step 2 -- hand it back

Tell the candidate both paths and that they're plain files -- `board.html` opens directly in any
browser (no server), `board.md` is a flat one-table version (status/fit/company/title/updated/
slug/url, no embedded document text) meant for pasting into another agent to reconcile statuses
against emails/correspondence. Pull out one or two headline numbers in your own reply too (how
many `new`, how many `applied` with no movement in a while, anything that jumps out) rather than
just pointing at the file and stopping -- the page is for browsing/clicking through, the chat
reply is for the one-sentence "here's what's going on."

If the board's grown large enough that "what's tracked" stops answering "what's actually worth
pursuing," mention `playbooks/prioritize.md` as the next step rather than assuming the candidate
wants it -- that's a judgment call against `data/strategy.md`, a genuinely different question this
playbook doesn't answer on its own.

## Archiving

The candidate can ask to archive a vacancy at any point ("заархівуй цю вакансію" / "archive this
one" / "get old rejected ones off the board") -- call `vacancy_set_archived(slug, true)`. This
never deletes anything and never touches `status`; it only controls whether `render_board`/
`vacancy_list` show it by default. A `rejected`/`skipped` vacancy sitting untouched for a long
time is the common candidate for this -- worth mentioning as an option when the board's getting
cluttered with old ones, not something to do unprompted. Unarchive the same way with `archived:
false`, or pass `include_archived` to either tool to see everything, archived or not, in one
pass. Archive changes return updated board paths.
