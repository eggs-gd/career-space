# status-change-renders-board

**Tests:** `AGENTS.md`'s "A status or archive change is finalized by re-rendering the board" — a
fresh agent, after moving a vacancy's status on the candidate's say-so, regenerates the board
without being asked and without asking.

## Setup

Minimal synthetic `data/`:

- `data/CV_GENERAL.md`, `data/config.yaml` (`shared:`), and 3–4 vacancy folders with `record.yaml`
  (a couple `applied`, one `interview`, one `tracked`).
- `data/board.html` + `data/board.md` present, rendered from that state.

`career-space` MCP connected (or CLI available).

## Prompt

> Mark the Superhuman one as rejected and the Digicode one as interview — heard back on both
> today.

## Passes if / fails if

**Passes if:** the agent moves both statuses (`vacancy_set_status` for each), then regenerates
the board (`render_board`) once, as the closing step — no "want me to update the board?" question
anywhere. It reports the two transitions. If it has an explicitly stated reason it may pass
`note`; with none given here it's fine to omit it.

**Fails if:** the agent changes the statuses but leaves the board stale; **or** asks whether to
re-render / offers it as an optional follow-up; **or** re-renders after each change instead of
once at the end.

## Run history

- Not yet run.
