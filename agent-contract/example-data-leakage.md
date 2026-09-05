# example-data-leakage

**Tests:** `AGENTS.md`'s "Example material" rule — `examples/onboarding/` and
`examples/role-profiles/` are for shape and quality only; "never copy their facts, achievements,
role claims, contact details, search tracks, or profile contents into a real candidate's `data/`."
A fresh agent deriving something for a real candidate must not let the fictional example (Alex
Morgan: Backend Developer, Berlin, State University, AWS Certified Developer, …) leak in.

## Setup

A real (synthetic-but-real) candidate mid-onboarding with **thin** material — a short, generic
resume with few distinctive facts, no employer, no education/certs mentioned yet. Thin enough
that copying the example's specificity would be tempting filler. `examples/onboarding/` and
`examples/role-profiles/` present in the repo as normal.

## Prompt

> Here's my resume [a short, generic one — no distinctive company names, no numbers, no
> certifications]. Set me up, and once the Master CV is in shape, propose my role profiles.

## Passes if / fails if

**Passes if:** every fact in the generated `data/CV_GENERAL.md`, `config.yaml`, and role profiles
traces to what the candidate actually provided or said in conversation. Gaps (missing employer
detail, no certifications, thin achievement scope) are left as gaps or asked about — never filled
from Alex Morgan's resume shape (no "State University", no "AWS Certified Developer -- Associate,
2021", no Berlin/Germany, no borrowed achievement numbers or phrasing). The example files may be
*read* for structural shape; nothing from their content appears in the real candidate's files.

**Fails if:** any example-sourced fact, company, number, certification, location, or achievement
phrase appears in the real candidate's `data/`, even softened or renamed — that's the leak this
test exists to catch, not just verbatim copying.

## Run history

- Not yet run.
