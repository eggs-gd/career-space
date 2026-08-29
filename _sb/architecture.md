# career-space architecture

How things actually work under the hood -- mechanisms, invariants, and the reasoning behind
non-obvious design choices. `AGENTS.md`'s "Data layout" section covers what files exist and which
playbook touches them; this doc covers *how* the code that touches them actually behaves, for
whoever is next changing that code (including a future instance of the agent doing the changing).
`_sb/` = internal development material, not read during normal candidate-facing execution.

## Vacancy identity and reconciliation

Every posting -- scout-found or candidate-pasted -- gets a `posting_id` (per source+URL) and a
`content_id` (per company+title+description, catches the same role reposted under different
URLs). Both are blake2s hashes computed by `scripts/posting_ids.py`, shared between the scout's
own fetch pipeline (`scout_domain.Posting`) and the manual-paste path (`posting_ids.manual_ids`)
so the same real-world posting hashes identically regardless of which path found it.

`vacancy_store.upsert_vacancy` resolves these to a vacancy folder in one of three ways:

1. **Explicit ids given, and a folder already exists for that exact `posting_id`** -- updates it.
2. **No ids given** (manual/import path) -- looks up an existing folder by company+title
   (`find_by_company_title`) and reuses its ids if found; otherwise computes fresh ones via
   `posting_ids.manual_ids`.
3. **Explicit ids given, but nothing on disk matches yet** -- falls back to the same
   company+title lookup as (2), but ONLY if that existing record's `id_source` field isn't
   `"scout"`. This is what stops a candidate-tracked vacancy from getting silently duplicated
   when the scout later independently discovers the same real posting (its own hash never
   matches a hand-computed one) -- while still keeping two genuinely different scout-found
   postings that happen to share a company+title (a real repost, not a duplicate) from merging
   into each other. `id_source` (`"scout"` or `"manual"`) is written on every new record; a
   record predating this field defaults to eligible for the fallback.

`upsert_vacancy` also writes a `seen.jsonl` entry itself whenever it creates a brand-new record --
closes the gap where a manually-tracked vacancy (which never goes through the scout's own
`vacancy_mark_seen` call) would otherwise get re-judged by a later scout run finding the same
posting.

## `upsert_vacancy`'s field-preservation contract

Every enrichment field (`location`, `remote`, `source`, `posted_at`, `fit`, `track_label`,
`status`) follows "omit means no opinion" -- an update call that doesn't mention a field leaves
whatever's already there untouched, never resets it to a default. This is load-bearing: violating
it silently regressed real data twice before it was enforced (a `cover-letter.md` call with no
fit info wiped a scout-matched fit score; a bulk backfill script regressed 18 vacancies' status
back to "new"). `status` specifically also refuses to *ever* regress an existing record to `"new"`
even if a caller explicitly passes it -- `"new"` is only a legitimate status for a record being
created for the first time, never a real transition for one that already exists (this matters
because of the reconciliation fallback above: a scout call correctly saying `status="new"` for
what it believes is a first discovery must not overwrite a vacancy that reconciliation just
revealed was already `tracked`/`applied`). Both the MCP tool and the CLI default `status` to
`None`, not `"new"` -- they call the exact same `vacancy_store`/`rendering` functions, specifically
so the two interfaces can't drift the way they once did on this exact default.

## Scout pipeline

`scout_fetch.py`: fetch (13 sources, `scout_sources.py`) -> prefilter (`scout_prefilter.py`:
`title_exclude`/`hard_exclude` hard gates, a location gate against `sources.yaml`'s
`local_keywords`, then a track/`role_signals`/`strategic_signals` match -- all word-boundary-safe
substring checks, no LLM) -> same-role repost collapse -> drop anything already in `seen.jsonl`.
Returns candidates for the agent to judge exactly like a pasted posting (`fitment.md` +
`score_fit.py`), then `scout-record-outcomes.md` writes `seen.jsonl` + creates a vacancy folder
for anything that clears `min_fit_score`.

`fitment.md`'s own remote/local check (for a candidate-pasted posting, which never went through
the prefilter above) reuses the same `local_keywords` list rather than hardcoding a country/city,
so scout and manual paths can't drift on what counts as "in scope."

## Dashboard rendering

`render_board_html()` embeds every vacancy file's rendered content directly in the page inside
native `<details>`/`<summary>` per file, not a real `<a href>` and not JavaScript. Both alternatives
were tried first and both failed silently when opened inside a coding agent's own sandboxed
local-file preview pane: that pane serves local HTML under a CSP of `script-src 'none'` (strips
`<script>` entirely) and refuses even a same-page `#fragment` anchor as a disallowed top-frame
navigation (confirmed directly via the exact CSP string and a console error naming the blocked
navigation, not assumed). `<details>` needs neither a script nor a navigation to toggle, so
there's nothing left for that sandbox to strip or block.

Raw HTML in a rendered file's source (e.g. a candidate-pasted posting that happened to include
markup) is neutralized before embedding -- `<`/`&` get escaped, deliberately not `>` too, since
Markdown blockquotes (`> ...`, used by the CV template's aggregate-duration line) need a literal
`>` at line start to parse.

## Rendered CV/cover-letter filenames

`rendering.resume_output_stem`/`cover_letter_output_stem` build `<Full Name>_Resume[_<Role>]` /
`<Full Name>_Cover_Letter[_<Company>]` instead of using the source file's own name (`cv`/
`cover-letter`, identical across every vacancy folder). Name comes from `config.yaml`'s
`shared.full_name`; role/company come from the sibling `record.yaml` in the same folder (falls
back to parsing the filename itself for a universal, non-vacancy CV, which has no sibling
record). Both `render_resume.py`/`render_cover_letter.py` (CLI) and `mcp_server.py`'s tool
wrappers call these same two functions -- not each reimplementing the naming logic separately.

## MCP server

`scripts/mcp_server.py` wraps `vacancy_store.py`, `rendering.py`, `score_fit.py`, and
`scout_fetch.py` as 11 typed tools (`render_resume`, `render_cover_letter`, `score_fit`,
`scout_fetch`, `vacancy_mark_seen`, `vacancy_upsert`, `vacancy_set_status`,
`vacancy_attach_artifact`, `vacancy_list`, `linkedin_searches`, `render_board`) registered for
Claude Code / Codex / Gemini / Cursor. Every tool is a thin pass-through to the matching CLI
script's own module-level function -- no logic lives in the MCP layer itself, specifically so the
CLI fallback (when a client doesn't do MCP) can never behave differently from the tool.
