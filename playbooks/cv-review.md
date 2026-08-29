# Playbook: cv-review

Trigger: "проаналізуй мій CV" / "review my CV" — defaults to `data/CV_GENERAL.md`; if the candidate
names a specific generated file (a role-profile CV under `data/cv/`, or a targeted CV under
`data/vacancies/<slug>/cv.md`), review that one instead, against the same standard.

A blunt diagnostic of what the document itself currently proves, where it overclaims,
where it underuses real evidence, and what range of roles it credibly supports — no specific job
posting involved (that's `playbooks/fitment.md`). The candidate sees this directly; be honest
rather than encouraging for its own sake — an inflated read that leads to a bad application is
worse than an honest one that leads to a stronger one. A harsh score is a signal, not something to
soften.

Read `policies/generation-rules.md` and (if reviewing a generated CV rather than the Master CV
itself) `policies/cv-writing-policy.md` first.

## Be disciplined about length

The candidate should read the whole review in under a minute and know exactly what to fix first.
Hit every section below, but don't pad past what the document actually supports — if there are
only three real strengths, name three. Every numeric cap below is a ceiling, never a target.

## Check specifically for

- **False ownership** — a bullet claiming personal authorship of something that reads like
  pre-existing structure, a team effort, or someone else's decision.
- **Excuse-making/hedging language** — "since none existed before," "wasn't yet..." — justifying
  a gap instead of stating a fact.
- **Keyword/tag dumping instead of a generalization claim** — a comma-separated tool list standing
  in for a real capability statement.
- **Indefensible or self-contradicting hooks/claims** — anything the candidate couldn't stand
  behind if pushed, or that contradicts a value the document states elsewhere.
- **Evidence rhythm** — a summary/role description stacking every biggest win back to back reads
  exhausting rather than credible.
- **Manufactured precision** — demanding a specific number for an outcome never actually measured.
  A real, concrete outcome (what shipped, what changed, over what rough timeframe) is solid
  evidence without a metric — only flag it as weak if it lacks *any* concrete, checkable detail.

## Then assess positioning range

What level of responsibility (IC depth, local technical/team leadership, cross-team/architectural
scope, executive/business-facing ownership) does the evidence actually, clearly support — and
separately, what higher range is plausible as a stretch but currently under-evidenced (missing
*proof*, not missing ability — say so explicitly, don't conflate the two).

A headline naming a target role the candidate hasn't held yet is not itself a defect — a CV is
allowed to state where it's aiming. The real question is whether the bullets beneath it make clear
what's demonstrated versus targeted; if they blur that line, that's a headline-clarity gap, not an
instruction to lower the headline to only what's already fully proven.

## Output format, exactly this shape, no preamble

```
SCORE: <integer 1-10>   (8-10 = ready to send as-is for a well-matched role; 5-7 = solid,
                          real fixable gaps; below 5 = a structural problem, not just wording)

READINESS: <3-6 word plain-language read, not a restatement of the number>

TOP_IMPROVEMENTS:
1. <headline> -- <1-2 sentences on why it matters and roughly what fixing it looks like>
(exactly 1-2 items, ranked by impact -- everything else found goes in RISKS, not here)

STRENGTHS:
- <specific strength, naming the actual evidence>
(up to 10, ranked strongest first -- fewer if that's genuinely all there is)

RISKS:
- <specific issue -- what's wrong and where, point at the actual bullet/section>
(0-10 lines, most consequential first; omit the section only if there's truly nothing)

RECOMMENDED_TARGET_SLICES:
- Primary: <role framing this CV solidly supports today>
- Strong: <another role framing this CV solidly supports today>
- Stretch: <the next level up, plausible but not yet fully proven>
(add "- Fallback: <role>" only if there's a level already fully, repeatedly proven worth naming
as a safer backup -- never as Primary; if the evidence shows repeated proof at a level, Primary/
Strong should already be the next level up from that, not a re-certification of what's already
been done several times over)

INTERVIEW_QUESTIONS:
1. <sharp, specific question this document's current wording would invite>
(3-5 questions, sharpest first -- the most concrete progress signal here: if a revision makes
this list shorter or blunter next time, that revision worked)
```
