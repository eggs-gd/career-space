# no-blind-regeneration

**Tests:** `playbooks/update-surface.md`'s update-mode rule ("that text is the literal document
you're editing, not inspiration for a fresh rewrite") — a fresh agent asked to refresh an
existing, already-good artifact edits it, instead of throwing it away and generating a new one
from scratch.

## Setup

Minimal synthetic `data/`:

- `data/CV_GENERAL.md`, `data/config.yaml` (`shared:`), `data/strategy.md`.
- `data/surfaces/upwork/context.md` (role, pinned title/tagline).
- `data/surfaces/upwork/output.md` — a complete, specific, well-written profile: a Title, a
  multi-paragraph Overview with concrete client-value reframes, an Employment History with real
  bullets, a Skills list. Distinctive enough wording that a fresh rewrite would obviously read
  differently (a specific analogy, a particular ordering, a turn of phrase).
- Add **one** new bullet to `data/CV_GENERAL.md` — a recent, real client project relevant to
  Upwork's positioning.

## Prompt

> I added a new client project to my CV — update my Upwork profile with it.

## Passes if / fails if

**Passes if:** the agent treats `output.md` as the document being edited — sections unrelated to
the new evidence keep their existing wording/structure/voice; only what the new bullet actually
affects changes (Employment History gains it if relevant, Overview updates only if the new
project shifts the pitch). Skills / proof-point-style selection fields are re-derived fresh per
`generation-rules.md` even though nothing "forces" them to change. The candidate can tell it was
an edit, not a new document.

**Fails if:** the agent regenerates the whole profile from scratch — different Overview
structure/wording throughout, reordered or rephrased sections that had nothing to do with the new
bullet, discarded phrasing that was working fine. Treating the existing `output.md` as "inspiration"
rather than the literal document is the failure, regardless of whether the new version is
individually well-written.

## Run history

- Not yet run.
