# Surfaces framework

How to reason when generating or revising any **public career surface** — a profile on a
constrained platform (LinkedIn, Djinni, Upwork, Fiverr, …), a free-form surface (portfolio,
personal site, GitHub profile README, speaker bio), or a platform this repo doesn't ship a
definition for yet.

Read `policies/generation-rules.md` first — the writing discipline this sits on top of. Where the
two seem to conflict, `generation-rules.md` wins.

## Three independent axes

Keep these separate — mixing them is the main way surface work goes wrong.

```
reference/surfaces/<name>.md   WHAT THIS PLACE IS      facts only: fields, order, limits,
                                                       discovery mechanics. No positioning advice.
                                                       (falls back to data/surfaces/<name>/reference.md
                                                       when there is no canonical file)
this file                      HOW TO THINK ABOUT      generic methodology + the author's default
                               PUBLIC SURFACES         model, offered as one example, not a rule
data/strategy.md + config      WHERE THIS USER         career direction
  shared:                      IS GOING
data/surfaces/<name>/context.md WHAT ROLE THIS SURFACE  derived collaboratively from the user's
                               PLAYS FOR THIS USER     direction, plus their specific decisions
data/CV_GENERAL.md             WHAT IS TRUE            canonical career-evidence source
                                        ↓
                               data/surfaces/<name>/output.md
```

`data/CV_GENERAL.md` is the canonical career-evidence source and the only one for constrained
profiles. A free-form surface may legitimately state facts that don't belong in a Master CV — a
portfolio's real project list and URLs, published talks, public artifacts. A surface may draw on
additional factual sources it explicitly defines; the mechanism for recording those is worked out
when a surface first needs it, not pre-built here. `context.md` itself never creates evidence, and
`generation-rules.md`'s facts-and-integrity rules govern how any evidence is used.

A canonical `reference/surfaces/<name>.md` always takes precedence over a private
`data/surfaces/<name>/reference.md`. The private file is user-local provisional knowledge, not a
definition of the surface type; if a canonical one later appears, offer to reconcile or drop the
private copy.

A platform's mechanics are stable. What a user is trying to accomplish through it is not — never
carry a strategic role over from the reference file or from another user.

## Surfaces serve different roles — derive them, don't assume

Do not assume every surface must present the user identically, and do not assume a given platform
has a fixed strategic function. The same platform, same fields, can play opposite roles:

- Someone moving from employment toward fractional/advisory work might use hiring marketplaces for
  immediate employability and freelance marketplaces to build consulting positioning.
- Someone moving from years of freelancing toward a corporate EM role might use those same
  freelance profiles as evidence of ownership and delivery, and converge everything else toward
  one corporate-compatible identity on LinkedIn and hiring platforms.

The strategic role of each surface comes from the user's career direction (`data/strategy.md` and
`config.yaml`'s `shared:`), worked out with them in `playbooks/surface-define.md` — never assumed
here.

## The author's default model (one example, not a rule)

Offered as a reasonable starting point for someone moving from employment toward independent work.
Present it as a suggestion; replace any part of it that doesn't fit the user's direction.

| Surface kind | A possible role |
|---|---|
| LinkedIn | broad professional identity, discovery |
| Hiring marketplace (Djinni, …) | immediate employability, role fit now |
| Client freelance marketplace (Upwork, …) | buyer / problem positioning |
| Productized marketplace (Fiverr, …) | bounded, purchasable offers |
| Portfolio / personal site | user-defined narrative and proof |

This is not a universal mapping.

## Shared principles (every surface)

1. Never invent facts or strengthen ownership beyond what the Master CV — or a factual source the
   surface explicitly defines — supports.
2. Market-normalize titles and terminology where useful, without changing the underlying meaning.
3. Select and compress evidence by the surface's role for this user — use judgment, don't
   mechanically copy structures, counts, or examples from anywhere.
4. Prefer concrete evidence and measurable outcomes over generic claims.
5. Skills and keywords must be supported by the Master CV.
6. Don't repeat the same point unless repetition serves search or positioning.
7. Every generated claim must stay defensible in an interview.
8. Don't modify the Master CV while generating a surface.
9. If useful evidence is missing, report the gap — don't invent to fill it.
10. Selection fields (proof points, skills lists, gig ideas) are re-derived from the current
    Master CV every generation, never carried over from a previous draft — see
    `generation-rules.md`'s "Selection fields are not a cache".
11. Check the generated identity against the user's direction and `context.md`, never against
    whichever technology cluster the Master CV has the most evidence for — see
    `generation-rules.md`'s "Technology density is not identity".

**Generation principle:** don't make surfaces identical. Preserve facts and ownership; adapt
selection, emphasis, abstraction level, terminology, and tone to the role this surface plays for
this user. When an existing surface already communicates something well, keep it unless there's a
concrete reason to change.

**Projection is subtraction, not just emphasis.** A surface that carries everything the umbrella
identity carries isn't a projection of it, it's a copy. A narrower surface is defined by what it
deliberately leaves out as much as by what it leads with — content that's true, strong, and part
of the umbrella identity but doesn't serve *this* surface's assigned role belongs on the surface
whose role it does serve, not here. The test for a substantial theme on a narrower surface: does
it serve this surface's role, or is it here only because it's true / strong / umbrella-level?
Shared professional identity recurring across surfaces is expected and fine — that's not leakage;
unrelated breadth riding along on the strength of the umbrella is. Don't manufacture differences
between surfaces for their own sake either; the goal is each surface doing its own job, not
looking distinct.

## Cross-surface technique

- **A headline/title on a searchable surface is search positioning first.** Its job is to be
  found by the people who matter for this surface's role, using the market's own search words —
  not to sound clever. When a field feeds discovery (`reference/surfaces/<name>.md` says so),
  treat keyword fit as the primary constraint.
- **On a buyer-driven surface, reframe evidence as the buyer's problem.** Don't restate Master CV
  achievements as resume bullets — express each as "if you have problem X, here's comparable work
  I've done." A reframe, not an invention.
- **Umbrella identity vs sub-offers.** When a surface has one seller/profile identity plus several
  narrower offers underneath (Fiverr seller + Gigs, a consulting page + service lines), the
  umbrella identity is the projection of `shared:` — never let the single most detailed sub-offer,
  or the densest technology cluster in the evidence, become the umbrella. Individually strong
  sub-offers are fine; one promoting itself to the whole identity is the failure to watch for.
- **Free-form surfaces are still evidence-bound.** `context.md` sets purpose, audience, emphasis,
  and tone; it never introduces a fact the Master CV doesn't support.

## What `context.md` holds

Committed positioning and content decisions needed to regenerate the surface — its strategic
role, audience, emphasis, tone, any pinned wording, and the themes that deliberately don't belong
here (at the topic level — "independent-lab and self-hosted-infra work is LinkedIn + portfolio,
not this hiring surface" — never a sentence-by-sentence outline of the output). Not presentation implementation that
belongs to the surface artifact itself (layout, fonts, navigation, screenshots, per-section HTML)
— that lives in `output.md`. If `context.md` starts accumulating fields that describe how the
artifact is built rather than what it should say, it's turning into a second `output.md`.

Any value marked pinned (headline, CTA, tagline, target title, top skills) is reproduced verbatim
— never shortened, simplified, or "improved". A shorter headline is a positioning decision, not a
wording fix. Where a pinned value would normally exist but doesn't, derive it from `shared:` +
`context.md` and flag it as not-yet-committed.
