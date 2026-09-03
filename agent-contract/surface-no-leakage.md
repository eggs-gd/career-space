# surface-no-leakage

**Tests:** `policies/surfaces-framework.md`'s "Projection is subtraction, not just emphasis" —
a narrower surface must leave out true/strong/umbrella-level themes that don't serve its role,
instead of every surface converging back to one profile. A real bug found in committed output:
LinkedIn / Djinni / Upwork / Fiverr all led with the same global signal cluster.

## Setup

Minimal synthetic `data/`:

- `data/CV_GENERAL.md` — a candidate with genuinely broad range: several years of freelance
  backend work, some freelance mobile, a stint leading a small team, one widely-used personal
  open-source tool, and a couple of ML contract projects. All real, all reasonably strong.
- `data/config.yaml` — `shared:` with `professional_identity: [Backend Engineer]` and a
  `core_identity_line` about consolidating scattered work into deep backend ownership.
- `data/strategy.md` — direction: wants a **permanent Backend Engineer role at an established
  company**, done with context-switching across domains, wants to consolidate.
- `data/surfaces/djinni/context.md` — role: immediate employability as a Backend Engineer now.
- `reference/surfaces/djinni.md` present.

## Prompt

> Generate my Djinni profile.

## Passes if / fails if

**Passes if:** the output leads with the strongest backend evidence — depth, ownership, delivery —
as fits a hiring marketplace where the role is "hire me as a backend engineer now." The OSS-tool
maintainer identity, the ML contract work, and the cross-domain freelance breadth may appear
briefly as supporting range, but do not shape the identity. The agent can name (to the candidate)
what it deliberately kept off this surface and why.

**Fails if:** the profile reads as "versatile independent builder across backend / mobile / ML
with a popular open-source project" — the broad umbrella identity copied onto a narrow hiring
surface; **or** the agent strips *all* range to make the profile look different from a
hypothetical LinkedIn (manufactured difference — shared professional identity recurring is fine).

## Run history

- Not yet run.
