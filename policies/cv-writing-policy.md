# CV writing policy

Shared by `playbooks/cv-universal.md`, `playbooks/cv-targeted.md`, and `playbooks/cv-review.md`
(the review checks output against this same standard). Read `policies/generation-rules.md` first
— that's the universal writing discipline; this file is CV-specific structure and length on top
of it.

## Scale selection

When the Master CV offers multiple scale signals (org size, team size, mentorship circle,
multi-team reach) for the same achievement, choose whichever best matches the target lens/role,
and keep the others available rather than dropping them.

## Role-specific framing

When generating a role-specific CV, prefer framing achievements through the candidate's recurring
pattern and transition evidence: what state was the work in, what changed structurally, and what
state did it reach afterward. Choose the 2-4 pattern instances that best match the target role or
posting, and lead with those instead of flattening the CV into responsibilities or a technology
list.

## Length

Target 750-850 words total across the whole document; 900 words is the hard maximum. If a draft
runs over, cut in this order: redundancy and explanatory context first, then weak or secondary
achievements, then early-career detail — never cut a strong, quantified achievement to hit the
count.

## Bullet ordering and density

- Fully-owned, driven-end-to-end achievements go first, as the most detailed bullets.
  Contributed-but-not-owned bullets go last, phrased in one concise line — supporting evidence of
  range, not headline achievements.
- Result-first bullets where the Master CV supports it: start with what changed, then explain the
  action. Never create fake abstraction metrics ("30x agility") or unsupported scale words
  ("high-load", "enterprise-grade", "50+") to make a bullet sound stronger than the source does.
- Markdown `-` bullets only, no decorative Unicode bullets. Prefer concise bullets over long prose.

## Document structure

Reverse-chronological by default (a lens file may define a different structure — e.g.
non-role-oriented profiles — follow that instead when it does).

- Never merge non-contiguous tenures at the same company; keep separate periods as separate
  entries.
- Ongoing ("Present") experience stays near the top in reverse chronology even when secondary to
  the current lens — compress it, don't move it below older flagship roles.
- Condense roles older than 10 years into an "Early Career" section, except when a role belongs to
  a tenure that continues within the last 10 years.
- Don't fully omit an experience entry just because it's secondary — compress to 1-3 bullets
  instead of dropping it, especially for ongoing entries. At most 2-3 bullets per role; compress
  secondary roles to 1 bullet; move background-only older roles into Early Career instead of
  expanding them.

Required shape (Markdown, English, no code fences):

1. `# <Full Name> — <Role-focused title>` — the title identifies the target role only. No years
   of experience, no seniority marketing ("experienced", "seasoned"), no industry name, no
   aspirational titles. Contact block immediately below: only fields present in
   `data/config.yaml`'s `shared.contacts` and allowed by that candidate's contact strategy —
   omit anything not available, never invent contact info.

   **Title, for a per-vacancy CV (`cv-targeted.md`) only** — match the vacancy's own posted job
   title as closely as the Master CV honestly supports, not the lens's own default title: an ATS
   scanning for that exact phrase is a real, practical reason to echo it, and `cv-universal.md`
   has no such posting to match in the first place. This is still bounded by "no aspirational
   titles" above — if the posting's title claims materially more scope or seniority than the
   Master CV backs up, keep the lens's own honest title instead of borrowing an unsupported one;
   matching the posting's phrasing is never a license to override what the evidence actually
   shows.

   **Location/phone, for a per-vacancy CV (`cv-targeted.md`) only** — `cv-universal.md` always
   uses `shared.contacts` as written, no vacancy to check against. For targeted CVs, follow the
   candidate's contact strategy in `data/config.yaml` for whether to show local location, remote
   location, phone, landing page, or portfolio links. If the strategy doesn't cover the vacancy's
   location context, ask the candidate rather than guess.
2. `## Summary` — doesn't repeat the title, years of experience, or chronology. Answers: what
   recurring problems does this person solve, what evidence proves it, why credible today.
   Structure: 2-4 short sentences of situation/pattern framing relevant to this lens, then a
   compact bulleted list of 3-4 already-quantified proof points most relevant to it (selected
   fresh from the Master CV every time — see `policies/generation-rules.md`'s "selection fields
   are not a cache"), optionally one short closing line about current technical practice. The
   headline should read in under 6 seconds — no multi-paragraph prose wall with numbers buried
   mid-sentence.
3. `## Experience`, one `###` block per employment period, reverse chronological: `### <Company>
   — <City, Country>`, optional `> <aggregate duration>` line, `#### <Job Title>`, `<Start> – <End>
   · <duration>`. If company and title are effectively identical (e.g. self-employment), merge
   into one `###` heading and skip the `####` line. If the Master CV frames a role with a short
   "situation I stepped into" narrative, include one compact paragraph (1-3 sentences) before the
   bullets — preferred over dropping that context. No per-role "Skills:" line — skills appear once,
   in the final `## Skills` section.
4. `## Skills`, grouped by category (max 3 groups, exact group names per the current lens),
   deduplicated, never a claim not supported by the source. Each group is 1-2 compact lines, not a
   nested inventory. Select only what supports the current lens — not every technology the Master
   CV mentions.
5. `## Education`, one line per `data/config.yaml`'s `shared.education` entry, verbatim (already
   formatted there — don't reformat or invent structure). Always included, every lens, even a
   senior/technical one — omitting it reads as a gap to a Western reader more often than it reads
   as unnecessary for a senior candidate.
6. `## Languages`, one line per `shared.languages` entry as `<Language> — <Level>` (Title Case
   both, e.g. `English — Professional`, not `english: professional` or a CEFR code like `B2/C1`
   unless that's literally what `config.yaml` stores). Skip the section entirely only if
   `shared.languages` is empty — never invent a language or level not in `config.yaml`.

Both sections are one or two short lines each — they should not visibly eat into the 750-850 word
budget above; if `shared.education`/`shared.languages` is missing or empty for some reason, skip
the section rather than guessing a placeholder.

## Style

- The situational lead-in described above is the one exception to "prefer bullets over prose,"
  and even that stays to 1-3 sentences.
- Explicit `#`/`##`/`###`/`####` headings with a blank line after each — no plain-text section
  titles.
