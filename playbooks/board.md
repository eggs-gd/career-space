# Playbook: board

Trigger: "покажи дошку" / "show me the board" / "як справи з вакансіями" / "what's the status of
everything" -- the candidate wants an overview of every tracked vacancy, not one specific posting.

## Step 1 -- render

Call `render_board` (MCP tool, or `node scripts/dist/render_board.js` if the server isn't
connected). It reads every vacancy in `data/vacancies/` and writes one static HTML page
(`data/board.html` by default) -- grouped by status, sorted by fit score, with every file
actually present in each vacancy's folder (`fitment.md`, `posting.md`, `cv.md`,
`cover-letter.md`, `targeting-plan.md`) embedded inline behind a click-to-expand badge, plus a
real link to the original posting URL. A vacancy whose location matches `data/sources.yaml`'s
`local_keywords` gets a colored left border and a "📍 Local" badge -- the same "local" `scout_
prefilter.ts` already uses to pass a posting through the location gate, just surfaced visually
here rather than only affecting whether a posting was ever fetched in the first place. No
highlighting at all (not an error) when scouting isn't set up or `local_keywords` was never
configured. An archived vacancy (see below) is left off this render entirely by default.

Don't hand-summarize `data/vacancies/` into a table yourself instead of calling this -- that
means re-reading every `record.yaml` to reproduce, in plain text with no working links, what
this tool already does deterministically in one call. If you only need the raw numbers/rows for
something else (not to show the candidate a page), `vacancy_list` returns the same underlying
data without writing a file.

## Step 2 -- hand it back

Tell the candidate the path and that it's a plain file -- open it directly in any browser, no
server involved. Pull out one or two headline numbers in your own reply too (how many `new`, how
many `applied` with no movement in a while, anything that jumps out) rather than just pointing at
the file and stopping -- the page is for browsing/clicking through, the chat reply is for the
one-sentence "here's what's going on."

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
pass.
