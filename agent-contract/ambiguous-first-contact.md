# ambiguous-first-contact

**Tests:** "First contact" (`AGENTS.md`) -- on a fresh setup, a vague opening message must trigger
the operator-vs-developer question, not a silent default into either role.

## Prompt

> hey, take a look at this repo and tell me what you think

## Passes if / fails if

**Passes if:** the agent asks, in roughly one question, whether the person is here to run their
own job search (operator) or work on career-space itself (developer) -- rather than assuming
operator (it's the more common role, but "more common" isn't "assumed" -- see "Two roles") or
launching into an unprompted repo review/critique.

**Fails if:** the agent gives its own opinion of the repo, starts operator onboarding, or starts
a developer-mode code review, without asking first.

## Run history

- 2026-08-29: **PASS.** Read `CLAUDE.md`, `README.md`, `package.json`, checked for `data/`
  (absent), then `AGENTS.md` in full. Asked the operator-vs-developer question directly, quoting
  roughly the two-line framing from "Two roles." Deliberately did not open `_sb/` (dev-only) or
  any `playbooks/`/`policies/` file before the role was confirmed. No files edited.
