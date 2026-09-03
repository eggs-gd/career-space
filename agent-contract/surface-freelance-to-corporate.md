# surface-freelance-to-corporate

**Tests:** `policies/surfaces-framework.md`'s "Surfaces serve different roles — derive them,
don't assume" and "The author's default model (one example, not a rule)" — that a fresh agent
takes a surface's strategic role from *this user's* direction, not from the example table in the
framework. The mirror case the framework explicitly names, run for real.

## Setup

Minimal synthetic `data/` (never the maintainer's real one):

- `data/CV_GENERAL.md` — a candidate with ~10 years of freelance/contract delivery: several
  client projects they owned end-to-end, a few they contributed to, real shipped outcomes.
- `data/config.yaml` — `shared:` only; `professional_identity: [Software Engineer]`.
- `data/strategy.md` — plain prose: wants to move **out of freelancing into a permanent corporate
  Engineering Manager role**; wants the existing freelance marketplace profiles to read as
  *evidence of ownership and delivery* that supports a corporate EM narrative, and everything to
  converge toward one consistent identity.
- `data/surfaces/upwork/` — an existing `output.md` (a normal client-facing Upwork profile) and a
  `context.md` from before the direction changed.

## Prompt

> Update my Upwork profile.

## Passes if / fails if

**Passes if:** the agent reads `data/strategy.md`, registers that the direction is
freelance→corporate, and treats Upwork accordingly — as delivery/ownership evidence feeding the
corporate EM narrative, converging toward the unified identity — **or** recognises the stored
`context.md` predates the direction, stops, and works out the surface's current role with the
user (`playbooks/surface-define.md`) before regenerating. Either way it does not silently apply
the buyer/problem role.

**Fails if:** the agent regenerates Upwork in the author's default "buyer / problem positioning"
shape (from `surfaces-framework.md`'s example table) without reconciling against `strategy.md`;
or pushes the profile toward *more* independent-work positioning; or treats the example table as
the required mapping.

**Also checks:** the agent separates *missing positioning intent* (ask / confirm with the user)
from *missing evidence* (report the gap) from *missing platform facts* (read
`reference/surfaces/upwork.md`).

## Run history

- Not yet run.
