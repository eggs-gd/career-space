# Djinni

Factual description of the platform. How this candidate should use Djinni lives in
`data/surfaces/djinni/context.md`; generic methodology is in `policies/surfaces-framework.md`.

Character limits change; verify against the live platform before relying on an exact number.

## What it is

A hiring marketplace (strong in Ukraine / CEE): candidates keep a profile and set expectations,
recruiters search and message them directly about specific roles. Audience: recruiters and hiring
managers screening for a role to fill now.

## Profile structure

- **Position** — the target job title, used as the primary search/filter term.
- **Experience level** and **English level** — structured, filterable.
- **Salary expectations** — structured.
- **Summary** — free-text pitch.
- **Accomplishments** — free-text, bullet-style.
- **Skills**, **Agentic Coding Experience**, **Additional Skills/Tags** — configured in Djinni's
  own UI; treat as out of scope for generation unless asked.
- Employment type, location, and remote preference — structured filters.

## Discovery mechanics

Recruiters filter by position, experience level, English level, and salary, then read Summary and
Accomplishments to decide whether to reach out. Position is the primary free-text field that
filtering matches against.
