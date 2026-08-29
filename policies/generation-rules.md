# Generation rules

Universal writing discipline — applies to every playbook that produces text from `data/CV_GENERAL.md`
(cover letters, any CV, platform profiles, fit/review output). Read this before writing anything
persuasive or evaluative.

## Ownership language

Be precise about scope. Some achievements in the Master CV are things the candidate owned and
drove end-to-end. Others they contributed to without owning. Don't upgrade "contributed to" into
"owned" when generating anything — it's a real distinction and may come up in interviews.

**Quantification never overrides ownership.** A measurable team outcome is not usable evidence
unless the candidate clearly owned or drove the part of the work that produced it. When ownership
is ambiguous, omit the metric/achievement entirely rather than upgrading a contribution into
something that reads as solely the candidate's doing — a good number is not, by itself, license
to claim it.

**Verb choice carries ownership, not bracketed labels.** The distinction is carried by verb choice
alone ("contributed to" / "participated in" / "helped introduce" / "one of several advocates for"
vs. "owned" / "led" / "built" / "drove"). Never print an explicit scope label like "(not owner)" as
visible text in generated content — that reads as an internal disclaimer leaking into the
document, not as something a person would write. The verb already says it. This applies to prose
too, not just brackets: don't spell out a justifying sentence about who owned which part unless
the output format explicitly asks for that level of detail.

## No excuse-making language

Phrases like "since none existed before" or "wasn't yet..." justify a gap instead of stating a
fact. State what happened, plainly.

## Not every achievement needs a stated Result

A bullet needs Action + Result only when a result is honestly attributable to that specific
action — a pure architecture/technology-choice line can legitimately stay Action/Context-only.
Don't invent a Result just to fill a template, and don't borrow the surrounding project's overall
success to manufacture one for a single technical choice within it.

## Don't state business outcomes that aren't the candidate's to claim

A system the candidate built may have fed into a real business outcome (a revenue lift, a
retention lift) that the candidate wasn't accountable for and didn't make the product/economics
decisions behind. Don't state business numbers in generated content, even with an ownership
caveat — a caveated business metric still reads as claiming the business result, and the hedge
itself reads as an unresolved disclaimer. Describe only the technical capability delivered (what
changed structurally, what became possible) and stop there. If a worse business outcome would
have reflected product, economics, or market decisions outside the candidate's control, the
positive business outcome isn't theirs to claim either.

## Facts and integrity

- Use only facts present in `data/CV_GENERAL.md`. Never invent employers, dates, titles, team
  sizes, technologies, responsibilities, or outcomes.
- Compression, reordering, and reframing are fine; changing what happened or who did it is not.
- Do not cite an outcome metric the Master CV marks as enabled-but-not-personally-owned, even with
  a caveat attached.
- When the Master CV pairs an improved number with its baseline, state both together — a result
  cited without its baseline is weak, easily-dismissed evidence.
- Keep bullets scoped to the role where they appear in the source; don't merge bullets from
  separate roles into one stronger claim, and don't attach a skill from one role to another.

## Manufactured precision

Don't demand a specific number or percentage for an outcome the candidate never actually measured.
A real, concrete outcome (what shipped, what changed, who adopted it, over what rough timeframe)
is still solid evidence without a metric attached — only flag it as weak if it lacks *any*
concrete, checkable detail at all (no scope, no timeframe, no named consequence).

## Defensibility

Before finalizing anything persuasive: would the candidate actually stand behind this specific
claim if pushed back on it directly? Does it contradict a value or working philosophy their own
Master CV documents elsewhere?

## Missing-keyword gaps

Never fix a "this posting wants X and the CV doesn't obviously show it" gap by adding a
comma-separated tag list — that just relocates the problem to whichever tag isn't on it. Fix it
with a real generalization claim instead ("worked across N analytics stacks, adapts fast") only
when the Master CV genuinely supports that generalization; otherwise it's a real gap, say so.

## Selection fields are not a cache

Anything whose job is to *demonstrate* a positioning dimension with evidence — proof-point
numbers, a skills list, achievement bullets backing a claim — is never itself stored data, even
across repeated runs for the same platform/vacancy. Re-select it from the full current
`data/CV_GENERAL.md` every time, picking the strongest currently available evidence. If the Master
CV has grown a stronger achievement since a previous draft was written, prefer the stronger one —
don't keep the weaker one just because an existing draft already used it.

## Technology density is not identity

A dense, specific cluster of evidence around one particular tool, framework, or stack in the
Master CV is *evidence* — it never gets to unilaterally define the candidate's professional
identity or target market on its own, no matter how much of the CV it covers. This was a real,
observed failure: a profile-generation pass once let the single densest technology cluster in the
Master CV redefine the candidate's whole positioning ("this person is a specialist in that
technology") instead of treating it as supporting evidence for the actual chosen positioning in
`data/config.yaml`. Always check a generated identity/headline/tagline against
`data/config.yaml`'s `shared:` block before finalizing it, not against whichever evidence was
easiest to find.

## Tone

Direct, confident, analytical. No marketing fluff or inspirational language. Avoid clichés
("passionate", "results-driven", "visionary", "thought leader", "proven track record", "dynamic",
"detail-oriented"). Let facts and outcomes carry the weight — if a sentence could describe any
senior engineer, cut it or make it specific to this source.
