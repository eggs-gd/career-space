# Public Profile Positioning — Framework Notes

For `playbooks/update-profile.md`. Technique/format only — *how* to derive a positioning,
headline, CTA, or skills list for each platform, not *what the current ones are*. The candidate's
actual current
titles, differentiators, headline, CTA, skills, and other current-state facts live in
`data/config.yaml` — every section below that used to state a current fact points there
instead. See `policies/generation-rules.md` first for the writing discipline this all sits on
top of.

## Shared principles (all platforms)

The Master CV (`data/CV_GENERAL.md`) is the canonical source of truth. LinkedIn, Djinni, Upwork,
and Fiverr are different public *projections* of that source, not copies of it and not a rigid
template to fill in.

1. Never invent facts or strengthen ownership beyond what the Master CV supports.
2. Market-normalize titles and terminology where appropriate without changing the underlying
   meaning.
3. Select and compress evidence according to the purpose of the platform — use judgment, don't
   mechanically reproduce examples, counts, or section structures from this document.
4. Prefer concrete evidence and measurable outcomes over generic claims.
5. Skills and keywords must be supported by the Master CV.
6. Avoid repeating the same information unless repetition serves search or positioning.
7. Generated claims must remain defensible in an interview.
8. Do not modify the Master CV while generating a public profile.
9. If useful evidence is missing, report the gap instead of inventing it.
10. These rules restate the operating assumption, not a competing policy:
    `policies/generation-rules.md` is the authoritative source for *how* to interpret evidence
    (ownership language, quantification-vs-ownership, verb choice, business-outcomes-ban). If this
    document and that one ever seem to conflict, `generation-rules.md` wins.

**Generation Principle:** do not attempt to make the platforms identical. Preserve facts and
ownership, but adapt selection, emphasis, abstraction level, terminology, and tone per platform.
When an existing profile already communicates something well, preserve it unless there's a
concrete reason to change it.

**Authority hierarchy:** `data/config.yaml`'s `shared:` tier defines WHO this person is and
WHY that's their positioning; a platform's own section in `config.yaml` (`pinned` values plus
any category-level strategy fields) defines WHAT TO EMPHASIZE for that platform's market; this
file defines HOW to express it structurally; the Master CV provides the EVIDENCE that any of it is
true. Mixing these up — e.g. letting the Master CV's own evidence density override what `shared:`
already decided the identity is — is the single most common way this goes wrong (see the
Fiverr incident below).

**Technology density is not identity.** A dense, specific cluster of evidence around one
particular technology in the Master CV is evidence supporting the positioning — it never
independently defines the candidate's professional identity or target market. See
`policies/generation-rules.md`'s section of the same name.

**Selection fields are not a cache.** Proof points, a skills list, Gig ideas — anything whose job
is to *demonstrate* a positioning dimension with evidence — is re-selected from the current Master
CV every generation, never reused from a previous draft. `data/config.yaml` only ever holds
`shared:` strategy and each platform's `pinned:` (committed, verbatim, human-approved) values —
never a cached list of what a previous generation produced.

**Platform distinction** — the same career fact gets expressed differently because each platform
answers a different question:

| Platform | Primary function | Main question |
|---|---|---|
| LinkedIn | Discovery + positioning | Who is this person professionally? |
| Djinni | Employment matching | Should I interview this candidate? |
| Upwork | Commercial sales (client-driven) | Can this person solve my problem? |
| Fiverr | Commercial sales (specialist-driven) | Does this packaged service solve my specific problem? |

**Upwork vs. Fiverr:** Upwork is client-driven — a buyer posts a job, freelancers submit
proposals, the buyer picks one. Fiverr is specialist-driven — the seller pre-packages fixed-scope
services as "Gigs" a buyer purchases off the shelf. The same underlying capability projects
differently: an Upwork Overview bullet reframes evidence as "if you have problem X, I've solved
exactly that" for a specific buyer's job post; a Fiverr Gig packages the same capability as a
standing, priced offer nobody has to request first.


## LinkedIn

**Purpose:** professional discovery and recruiter search. Make the candidate easy to find for the
current target market, and make the career trajectory understandable once someone opens it. Broad
positioning, not a vacancy-specific resume.

**Current positioning:** `data/config.yaml`'s `shared.professional_identity`/
`shared.differentiators`/`shared.commercial_directions` — shared across every platform.

**Headline = search positioning, not a slogan.** Primary job: get found in recruiter search, not
to sound clever. Formula: current/confirmed role + next target role + at most one strategic
differentiator, only if load-bearing. If `linkedin.pinned.current_headline` exists in
`data/config.yaml`, use it verbatim — don't shorten, simplify, or drop differentiators on
your own judgment; a shorter headline is a positioning decision, not a wording improvement. If
none is pinned, build one from `shared.professional_identity` + `shared.differentiators`, never
from whichever technology is most represented in the Master CV, and never one of
`shared.rejected_broader_titles` — flag the gap. Homogeneous `/` separators read cleaner than
mixing `—`/`|`.

**About needs aggregate proof, not adjectives.** Open on `shared.core_identity_line` close to
verbatim — a claim about who this person is, not a capabilities summary. Then: a short narrative
→ a real CTA ("here's what to come to me for"), not a biography that trails off. A compact
scannable shape (short opening, "What I do" list, proof-points list, closing CTA) beats one long
paragraph. Pick the strongest 3-4 proof-point numbers **fresh from the Master CV, every time** —
this is a selection field, never cached. If `linkedin.pinned.current_cta` exists, use it verbatim
and check it covers the same breadth as everything else you just wrote above it.

**Keywords aren't just a headline concern.** Target-role vocabulary should naturally recur in
About and Experience too — not stuffing, just consistently calling real things by the market's
own search words.

**Experience doubles as evidence for headline/About claims.** If the headline claims a capability,
at least one role needs to actually demonstrate it. Recent leadership roles get the most detail;
older roles compress progressively while preserving unusual evidence that stays relevant. Order by
end date descending — for overlapping roles, by end date specifically, not start date.

**Skills are atomic search terms, not a CV taxonomy.** Composite category labels ("0→1 /
Greenfield Delivery & Engineering Turnarounds") read well as prose but don't match what a
recruiter types into search or what LinkedIn's own skill-suggestion taxonomy recognizes. Two
tiers: a small, explicitly-pinned "Top Skills" (`linkedin.pinned.top_skills` — verbatim, curated,
don't regenerate) and a broader searchable pool selected **fresh from the Master CV every
generation** (never pinned) — atomic terms, a competency/technology/practice someone could be
evaluated on, never a role or positioning label ("Fractional CTO" is a role, not a skill;
"Engineering Turnarounds" is a positioning category, not a competency). If Headline advertises a
differentiator, Skills needs a matching atomic term.

**Banner is a separate positioning surface from the headline.** Works like a business card —
`linkedin.pinned.banner_tagline` / `banner_visual_concept`, use verbatim, don't invent a new one.
Headline answers "what roles to find me under"; banner answers "what makes me different." Note:
current-generation image models reliably garble rendered text in banners — plan on a separate
text pass rather than trusting one-shot generation for anything with words on it.

**Out of scope, on purpose:** Contact info, Languages, Certifications, Education — if the existing
profile text has these, leave them untouched.


## Djinni

**Purpose:** employment matching and conversion into interviews — narrower than LinkedIn's broad
identity. Answers: what can this candidate realistically be hired to do now?

**Position:** `djinni.pinned.current_target` if set, verbatim — deliberately without the
differentiator string a LinkedIn headline carries (Accomplishments prove that directly). If unset,
build from `shared.professional_identity`, never from technology density, and flag the gap.

**Summary:** more compact and employment-focused than LinkedIn About — lead with positioning +
years + hands-on/management combination + strongest scale/delivery evidence, then stop. Treat AI
work as a technical competency layered onto the primary identity, never a competing one — "I still
build software myself, with recent hands-on work around AI-assisted engineering" keeps AI
supporting; "my current focus is AI" reads as AI displacing the primary identity. A selection
field, not a cache — re-pick every generation.

**Accomplishments:** 5-6 bullets, each mapping cleanly onto the current positioning (scale / 0→1 /
architecture / turnaround / org design). A bullet that doesn't map onto any of those categories
weakens the set — cut it rather than pad to a round number. If Summary claims a differentiator not
evidenced by any Accomplishment, that's a real gap.

**Out of scope:** Skills, Agentic Coding Experience, Additional Skills/Tags — if the existing
profile text has these (already configured in Djinni's own UI), leave them untouched.


## Upwork

**Purpose:** selling expertise and solving client problems — not primarily an employment profile.
Answers: can this person solve the problem I am paying for? Employment history is supporting
evidence, not the main product.

**Title:** relevant service directions from `upwork.service_directions` in `data/config.yaml`,
where the Master CV actually supports them — a productization of `shared.commercial_directions`/
`differentiators` for this outbound market, never a fresh identity. Unlike LinkedIn/Djinni,
Fractional CTO / Technical Advisor positioning can be explicit and prominent here
(`upwork.fractional_cto_explicit`) — put it directly in the title line.

**Overview: translate evidence into client value.** The one technique genuinely specific to
Upwork: don't restate Master CV achievements as resume bullets — reframe each as "if you have
problem X, I've solved exactly that." Worked example:

> Master CV evidence: `Built an engineering department from 1 engineer to ~50 people.`
> Upwork interpretation: `If your engineering team is outgrowing you as the bottleneck: I built
> one department from 1 engineer to ~50, across multiple cross-functional teams, while building a
> structure that could keep scaling without depending on me personally.`

Stay grounded in actual evidence — a reframe, not an invention. Watch for accidentally restating
the same point twice in different places (a client-value bullet and a nearby narrative paragraph
saying near-identical things). Structure: problems solved → what can be owned → evidence of
comparable problems solved → technical breadth → concrete engagement models → CTA. Tone can be
more direct and personality-forward than LinkedIn/Djinni. Avoid generic agency language
("innovative solutions", "cutting-edge technologies", "passionate professional",
"results-driven leader") — prefer concrete problems, decisions, systems, ownership, outcomes.

**Employment History — hard 1000-character limit.** Each entry's description (everything after
the date line, including achievements and the Technologies line) is capped at 1000 characters on
the real platform — check every entry before calling a role finished. A role that runs over needs
real compression, not just trimming. Order/expand roles by commercial relevance to the current
positioning (`upwork.role_emphasis_order`), not by title prestige — preserve chronology where
possible, allow compression/grouping where needed. Every remaining role gets bullets
(`Key achievements`/`Key contributions`), never prose paragraphs.

Whether a role belongs in Employment History or Other Experience isn't about title/seniority — it
depends on whether that role's strongest evidence maps onto a positioning category and is
personally-owned (not team-shared). Keep chronologically-adjacent roles together when in doubt.

**Other Experience — real platform structure.** Title + description only, no separate date/company
fields, and only three titles show above the fold. Fold date ranges into the description; group
related short stints under one combined title; break dense prose into an intro line + bullets even
inside one entry.

**Skills:** commercially useful capabilities, not every technology ever touched — a skill is a
competency/technology/practice, not a role/positioning label restated as a tag. One exception:
"Fractional CTO" here is itself a real, searchable service category buyers filter by — keep it if
`upwork.fractional_cto_explicit` is set; that's not the same mistake as listing it on LinkedIn.

**Out of scope:** Languages, Certifications, Education — leave untouched if already present.


## Fiverr

A service catalog, not an employment or client-matching profile — see "Upwork vs. Fiverr" above.
Answers: does this specific packaged service solve my specific problem, at this price, on this
timeline? Not: should I hire this person generally?

**Seller profile ≠ Gig.** The core distinction this section enforces. The seller (Seller Tagline,
Seller Description) is one umbrella professional identity — a projection of `shared:`, the same
WHO/WHY every other platform projects. A Gig is a specific, narrowly-scoped, purchasable product
underneath that identity. One seller, several Gigs — never a seller whose whole identity collapses
into their single most detailed Gig.

**Real incident this rule exists because of:** a live generation with no `fiverr:` positioning
data produced both the seller identity and Gig ideas from one undifferentiated pass over the
Master CV. It picked the densest technology cluster in the evidence (Unity/CI-CD/Burst/ECS) and
let that become the Seller Tagline itself ("I will set up a production-grade Unity CI/CD
pipeline..."), collapsing an Engineering-Manager/Technical-Lead identity into "Unity freelancer" —
the same keyword-matching mistake a junior recruiter skimming for the densest tech cluster would
make. The Gig ideas it found in that run were individually good; the bug was letting one of them
promote itself to seller identity.

**Gig Concepts: derived fresh, never cached as a category list.** Upwork and Fiverr share nearly
the same underlying mapping (`capability + evidence -> client problem -> service proposition`),
differing mainly in discovery direction. A second attempt tried to exploit that literally — a
fixed, pre-generated category list stored in `config.yaml` — which turned out to be the same
"cache masquerading as input" mistake LinkedIn's proof points and skills had. Instead: for each of
`shared.commercial_directions` and `shared.differentiators`, check whether the Master CV has
strong enough evidence to support a genuinely bounded, purchasable client outcome. Where it does,
propose one or two concrete Gigs, framed as "I will ...", grounded in that specific evidence. Where
evidence is too thin, skip it and say so rather than forcing a weak Gig into existence. Favor a
concrete deliverable shape (audit → diagnosis → plan → execution artifacts) over a vague capability
pitch. A specific technology may appear as one Gig's own scope or a variant nested under a broader
dimension — never as the dimension itself, never the thing that makes one Gig outshine the rest.
If `fiverr.pinned` ever has committed Gig copy (a Gig the candidate actually published and decided
to stop regenerating), reproduce that verbatim instead.

**Structure:** Seller Tagline (umbrella "I will ..." line, never naming a specific technology or
narrowing to one Gig's scope) → Seller Description (short, umbrella-level, must not read as a bio
for whichever Gig has the richest evidence) → Gig Concepts (one or two per well-evidenced shared
dimension) → Work Experience (Fiverr's own real profile section — credibility support, not the
sales surface; compress far harder than LinkedIn/Upwork, a handful of roles at one or two lines
each, ordered by relevance to the Gigs above rather than strict chronology) → Skills (scoped to
what the Gigs need for search, drawn roughly evenly across dimensions).

**Out of scope:** Languages, Certifications, Education — leave untouched if already present.
