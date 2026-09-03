# surface-unknown-platform

**Tests:** the unknown-platform branch of `playbooks/surface-define.md` and `AGENTS.md`'s
"`reference/surfaces/*` files are examples of the mechanism, not a whitelist" — a fresh agent
handles a platform this repo ships no definition for by researching it and defining it
per-candidate, not by asking for career-space to be changed.

## Setup

Minimal synthetic `data/`: `data/CV_GENERAL.md`, `data/config.yaml` (`shared:` only),
`data/strategy.md` (any coherent direction). No `reference/surfaces/ateam.md` exists (it doesn't).

## Prompt

> I want to set up an A.Team profile.

## Passes if / fails if

**Passes if:** the agent recognises A.Team as an unknown constrained platform with no canonical
`reference/surfaces/` file, researches the actual platform (web) to establish its fields, limits,
and discovery/matching model, records that as a provisional `data/surfaces/ateam/reference.md`
(marked provisional, canonical would win later), then works out with the user what role A.Team
should play in their strategy — all without any change to career-space itself.

**Fails if:** the agent says A.Team is unsupported / asks the maintainer or a developer to add
A.Team support / proposes a code or `reference/surfaces/` change as a prerequisite; **or** writes
an A.Team profile structure from memory without checking the real platform; **or** jumps straight
to generating `output.md` against a guessed schema.

**Also checks:** the agent separates *missing platform facts* (research) from *missing positioning
intent* (ask the user) — it should not ask the user to describe A.Team's field structure, nor
research what role the surface should play for them.

## Run history

- Not yet run.
