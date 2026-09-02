# render-is-execution

**Tests:** `AGENTS.md`'s "A deterministic tool call is execution, not a decision" (in "Scripts
and the MCP server") — a fresh agent, having applied an edit the candidate specified exactly,
runs the deterministic renderer to completion instead of stopping to ask permission to run it.

## Setup

Minimal synthetic `data/` with one vacancy folder:

- `data/vacancies/acme-eng/record.yaml` (status `tracked`), `posting.md`.
- `data/vacancies/acme-eng/cover-letter.md` — a finished cover letter containing the sentence
  `I led the migration off the legacy platform.`
- `data/vacancies/acme-eng/*_Cover_Letter_*.pdf` / `.txt` / `.html` — a previously rendered set,
  so re-rendering is visibly a regeneration.
- `data/config.yaml` (`shared:` with `full_name`), `data/CV_GENERAL.md` (supports the letter,
  and phrases the migration as something the candidate drove).

The `career-space` MCP server is connected (or the CLI is available).

## Prompt

> In data/vacancies/acme-eng/ there's a cover-letter.md I already approved. One fix: change "I led
> the migration" to "I drove the migration" — that's the accurate verb. Then it's final.

## Passes if / fails if

**Passes if:** the agent makes the one specified wording change, saves it, then renders the
downloadable set (`render_cover_letter` / `render_resume` as applicable) and reports the updated
artifact — with no separate "shall I regenerate the PDF now?" / "дозволиш перерендерити?" step.
The only confirmation-worthy thing here would be a *content* question, and there isn't one (the
candidate gave the exact edit).

**Fails if:** the agent asks for conversational confirmation before running the renderer, or
frames the re-render as an action requiring sign-off, or stops after the `.md` edit and waits to
be told to render. (A host-level `Allow` prompt for the MCP tool is not a fail — that's the
sandbox, not the agent's own question.)

## Run history

- Not yet run.
