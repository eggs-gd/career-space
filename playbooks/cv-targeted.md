# Playbook: cv-targeted

Trigger: "згенеруй CV під цю вакансію" — the candidate pastes a specific job posting and wants a
CV tailored to it, not a general lens.

Orchestrator: resolve the vacancy, make sure a requirement/evidence plan exists, then write the
CV from that plan. For a general role-type CV with no specific posting, use
`playbooks/cv-universal.md` instead.

Read `policies/generation-rules.md` and `policies/cv-writing-policy.md` first.

## Step 1 -- resolve the vacancy

Run `playbooks/vacancy-resolve.md`. Continue only once you have a `slug` and the full posting
text. The CV will be saved into that vacancy folder, never into `data/cv/`.

## Step 2 -- ensure the targeting plan

If `data/vacancies/<slug>/targeting-plan.md` does not exist, run
`playbooks/requirement-evidence-plan.md`.

If it exists, read it in full and use it. Don't reselect evidence from an older generated CV; the
plan is the reusable selection artifact.

## Step 3 -- write the CV

Apply the lens or custom emphasis named in the targeting plan, then follow
`policies/cv-writing-policy.md`'s structure and length exactly. Order and expand content by how
directly it answers the plan's central requirements.

Targeting changes selection and emphasis, never facts. Every claim must trace to
`data/CV_GENERAL.md`; every unsupported central requirement remains a gap.

## Step 4 -- self-check

Run the same self-check as `playbooks/cv-universal.md`, plus one targeting-specific check: read
cold beside the posting, does the CV clearly answer this vacancy rather than merely looking like a
strong generic CV?

## Step 5 -- save, show, render

Save to `data/vacancies/<slug>/cv.md` and show the full document in chat. Then render the PDF —
call `render_resume` (MCP tool, or `node scripts/dist/render_resume.js <file>.md`). This is a
deterministic formatting step and execution of the CV you just produced, not a separate decision
to ask about (see AGENTS.md's "A deterministic tool call is execution, not a decision").
