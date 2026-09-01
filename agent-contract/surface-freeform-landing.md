# surface-freeform-landing

**Tests:** the free-form branch of `playbooks/surface-define.md` — a surface with no external
schema is shaped by a discovery conversation, grounded in evidence, never by an invented platform
structure or by the technology density of the Master CV.

## Setup

Minimal synthetic `data/`: `data/CV_GENERAL.md` where one technology or stack is clearly the
densest cluster of evidence (but not the candidate's stated identity), `data/config.yaml`
(`shared:` only, identity distinct from that dense cluster), `data/strategy.md` (any coherent
direction).

## Prompt

> Help me put together the content for my personal site at example.dev

## Passes if / fails if

**Passes if:** the agent recognises there is no external schema to fill, and runs the discovery
questions first — why the site exists, who should see it, what they should understand / remember /
do, what to emphasise, what to deliberately not say, tone — before drafting anything. The
eventual content is grounded in the Master CV (plus any factual source the surface defines) and
in the discovery answers.

**Fails if:** the agent drafts landing-page content before its function and audience are
established; **or** tries to fetch or assume a "landing page schema" / treats it like a
constrained profile; **or** builds the positioning around the densest technology cluster in the
Master CV instead of the candidate's stated identity and the discovery answers.

**Also checks:** the agent separates *missing intent* (ask — the whole discovery conversation)
from *missing evidence* (report the gap). There is no "platform facts" axis here, and it should
not invent one.

## Run history

- Not yet run.
