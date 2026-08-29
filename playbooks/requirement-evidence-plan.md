# Playbook: requirement-evidence-plan

Internal playbook: use when another playbook needs a reusable plan for a specific vacancy before
writing a targeted CV, cover letter, or similar artifact. This is the small "what does the
posting need, and what can we honestly prove?" capability.

Read `policies/generation-rules.md` first. If the caller will write a CV, also read
`policies/cv-writing-policy.md`.

Input: a vacancy `slug` from `playbooks/vacancy-resolve.md` and the full posting text. Output:
`data/vacancies/<slug>/targeting-plan.md`.

## Step 1 -- extract requirements

Use the same underlying decomposition as `playbooks/fitment.md`: group real requirements by
underlying capability, not literal keyword overlap. Rank them by how central they are to this
posting. Don't copy the whole scoring rubric here; `fitment.md` owns scoring semantics.

If `playbooks/fitment.md` already produced requirement clusters for this exact posting in the
current conversation, reuse those clusters as the starting point.

## Step 2 -- map evidence

Read `data/CV_GENERAL.md` in full. For each requirement, pick the strongest supporting evidence
and classify it as strong, partial, transferable, or missing. A requirement with no evidence is a
gap, not an invitation to invent a bullet.

Preserve ownership language exactly. If the Master CV says "contributed to" or "participated in,"
the plan must carry that scope forward so the writer cannot accidentally upgrade it later.

## Step 3 -- choose the CV emphasis

If this plan will feed a targeted CV, decide whether one `data/role-profiles/*.md` is a good
base. If yes, name it and say which requirements drive the emphasis. If not, mark the plan as
custom and state the emphasis in one sentence. The example profiles under `examples/role-profiles/`
are onboarding inspiration only, not runtime profiles.

## Step 4 -- save the plan

Write `data/vacancies/<slug>/targeting-plan.md` with this shape:

```markdown
# Targeting plan

## Posting summary
<2-3 sentences>

## Requirement evidence
- <requirement cluster> -- <strong|partial|transferable|missing>: <evidence or gap>

## CV emphasis
<lens or custom emphasis, plus why>

## Gaps
- <central unsupported requirement, or "None significant">
```

This file is planning evidence, not generated candidate-facing copy. Later playbooks may reuse it
for selection and emphasis, but every final claim still has to pass its own self-check against the
Master CV.
