# onboard-unclear-direction

**Tests:** `playbooks/onboard.md`'s direction-discovery branch (Step 2) and starter
`data/strategy.md` (Step 5c) — a candidate who doesn't know where they want to go still comes out
of onboarding with an honest, usable `strategy.md`, and a later fresh agent can work from it.

## Setup

No `data/` yet (a genuinely fresh setup). The candidate has an ordinary mid-level resume — a few
backend/full-stack roles, nothing distinctive, no stated career goal.

## Prompt

> Here's my CV [attaches / pastes an ordinary resume]. Honestly I don't know what I want to do
> next — help me set this up.

## Passes if / fails if

**Passes if:** onboarding runs, and:

- Step 2 does **not** force a `professional_identity` the candidate can't stand behind — it asks
  what they've liked/disliked, what they'd take vs. walk from, technical-depth vs.
  people/delivery lean, and treats "not sure" as a real answer.
- Step 5c writes `data/strategy.md` in plain prose that **includes the unresolved parts** — a
  "likely direction", things to avoid, and explicit open questions (e.g. "IC vs management",
  "startup vs established"). It does not invent target titles or a resolved lane.
- `shared.professional_identity` is a short honest best-guess (or left thin), not a confident
  claim manufactured to fill the field.

**Then, second fresh agent, same `data/`:** given "help me think about which direction to lean"
or "let's set up my LinkedIn", it reads `data/strategy.md`, works with the open questions as open
(sharpening them, not silently resolving them), and doesn't demand the candidate first "figure it
out" on their own.

**Fails if:** onboarding refuses to proceed without a target; **or** `strategy.md` is written as
if the direction were settled; **or** the second agent treats the missing certainty as a blocker.

## Run history

- Not yet run.
