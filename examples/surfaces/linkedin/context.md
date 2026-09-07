<!-- Fictional example candidate (Alex Morgan -- matches examples/onboarding/). Shows the shape,
sections, and level of specificity a surface's context.md should have. Not a positioning worth
copying, and not facts about the current candidate. Written by playbooks/surface-define.md;
generating output.md from it is playbooks/update-surface.md. -->

# LinkedIn -- positioning intent

## Role in strategy

The primary discovery surface. This is where a recruiter searching for backend roles finds Alex
in the first place, and the first thing they open to decide whether to reach out. It carries the
broad "here's who I am professionally" identity; the targeted CV does the per-vacancy argument.
Djinni is the narrower employment-matching surface and can be blunter about the exact target;
LinkedIn stays a little broader so it doesn't read as only-looking-for-one-title.

## Audience

Recruiters and hiring managers filling senior backend IC roles, mostly Berlin-based or remote
within the EU. They skim; they search by title and stack keywords first, read the About only if
the headline and current role look right.

## Emphasise

- Steady delivery inside existing, actively-maintained codebases -- taking a backend ticket from
  vague to shipped without much hand-holding (the `core_identity_line`).
- Depth where it's real: Postgres-centric services, API design, the day-to-day of a
  Python/TypeScript backend.
- Current, senior-IC framing -- "Senior Backend Engineer", not "Software Engineer" and not a lead
  title.
- Berlin + remote-EU availability, stated plainly.
- The AWS Developer Associate cert (it's a genuine keyword match for a chunk of the target roles).

## Doesn't belong here

Topics to keep off this surface, not phrasings:

- Any engineering-management / team-lead framing. Alex is deliberately not pursuing that
  (`rejected_broader_titles`, `strategy.md`) -- a headline or About that hints at "IC-to-EM path"
  works against the actual search.
- The occasional frontend-framework work. It's real but thin, and leading with it invites
  full-stack roles that aren't the target; a single "comfortable across the stack when it helps"
  line in Experience is the most it should get.
- One-off/side projects. Nothing here is strong enough to earn profile space and they dilute the
  "reliable backend IC" read.

## Tone

Plain and competent. No "passionate", no "results-driven", no adjective stacks. It should sound
like Alex actually talks -- understated, specific about what the work involved.

## Pinned

Verbatim values Alex has decided on -- reproduce exactly, don't "improve":

- **Headline:** `Senior Backend Engineer / Python · TypeScript · PostgreSQL / Berlin & Remote (EU)`
- **Target title:** `Senior Backend Engineer`
- **CTA (closes the About):** `Open to senior backend roles -- remote in the EU, or on-site/hybrid in Berlin. Best reached on LinkedIn or at alex.morgan@example.com.`
- **Top Skills (the pinned three):** `Backend Development`, `PostgreSQL`, `API Design`

The broader searchable skills list is not pinned -- it's re-derived from the Master CV each time
the profile is generated.
