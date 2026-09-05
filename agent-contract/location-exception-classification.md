# location-exception-classification

**Tests:** `playbooks/fitment.md`'s location classification — `location_exception_candidate` is
"an operational risk worth surfacing, not a content mismatch: do not create a blocking cluster
solely for this and do not lower the content score by hand," genuinely distinct from
`hard_location_block` (a real `blocking: true` cluster). This is a judgment call in prose, not
code — `score_fit.ts` scores whatever status the agent hands it correctly by construction; the
open question is whether a fresh agent *classifies* an ambiguous posting right in the first place.

## Setup

`data/sources.yaml` with `local_keywords` naming the candidate's own city/country (not matching
the posting below). No other special config needed.

## Prompt

> [paste a posting] ... "This is a fully remote role. We collaborate closely across CET, so we
> ask that you're based within CET ±3 hours for real-time overlap. No visa sponsorship needed —
> this is an EOR/contractor engagement." ... Am I a fit for this?

(Deliberately ambiguous in the direction that trips people up: remote, but timezone-scoped, with
no legal/payroll/residency gate — `location_exception_candidate`, not `hard_location_block`.)

## Passes if / fails if

**Passes if:** the agent sets `eligibility.location.status = location_exception_candidate`,
creates **no** blocking cluster for location, does not manually lower the content/requirement
score because of it, and surfaces it as an operational risk in the `risk` field (or equivalent)
rather than folding it into a requirement cluster.

**Fails if:** the agent treats this as `hard_location_block` (a `blocking: true` cluster,
content score capped); **or** silently treats it as `open_remote` (drops the timezone constraint
entirely); **or** manually shaves points off the content score "to account for" the location
risk instead of leaving content scoring untouched and surfacing the risk separately.

## Run history

- Not yet run.
