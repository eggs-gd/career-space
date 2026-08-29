# Playbook: cv-universal

Trigger: "згенеруй CV під роль X" — no specific vacancy, a general role-type framing (e.g.
"management CV", "technical lead CV", "fractional CTO CV") or just "generate my CV".

Not tied to one posting — this is the CV variant for a general professional posture, reusable
across many similar applications. For a specific vacancy, use `playbooks/cv-targeted.md` instead.

Read `policies/generation-rules.md` and `policies/cv-writing-policy.md` first.

## Step 1 — pick the role profile

Use `data/role-profiles/*.md`. If the candidate named one explicitly, use it. Otherwise ask, or
infer from context (what kind of roles they've mentioned wanting) and confirm before writing.

If `data/role-profiles/` doesn't exist or is empty, run the role-profile part of
`playbooks/onboard.md` first. The example profiles under `examples/role-profiles/` are onboarding
inspiration only, not runtime profiles to use directly.

## Step 2 — select evidence fresh from the Master CV

Read the chosen role profile's "Evidence selection"/"Positioning" guidance and
`data/CV_GENERAL.md` in full. Select and emphasize per the profile's own rules — this is a
selection field, not a cache
(see `policies/generation-rules.md`): even if a CV for this role profile was generated before, re-derive
the selection from the current Master CV rather than reusing the old draft's choices, in case
something stronger has been added since.

## Step 3 — write, following `policies/cv-writing-policy.md`'s structure and length exactly

Apply the chosen role profile's specific rules (skills group names, experience-emphasis guidance,
positioning constraints — especially its "never invent X" lines, these are profile-specific
anti-fabrication guardrails on top of the universal ones).

## Step 4 — self-check against `policies/generation-rules.md` before showing it

Specifically: does every bullet trace to something in `data/CV_GENERAL.md`? Is ownership language
preserved? Does the positioning match `data/config.yaml`'s `shared:` block rather than
whichever evidence was most detailed?

## Step 5 — save and show

Save to `data/cv/universal-<role-profile-slug>.md`. Show the full document in chat. If the candidate wants
a PDF, call the `career-space` MCP server's `render_resume` tool on it if connected, otherwise run
`node scripts/dist/render_resume.js data/cv/universal-<role-profile-slug>.md` (see AGENTS.md's "Scripts and
the MCP server" section) — either way, don't attempt to produce styled output yourself.
