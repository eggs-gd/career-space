# Developing career-space itself -- tooling and verification

Use this only in Developer mode, when changing `scripts/`, `playbooks/`, `policies/`, `examples/`,
`reference/`, or `_sb/`. Operator-facing playbooks do not read this file. For the `scripts/`+MCP
reference itself (what each script does, MCP vs CLI, setup), see `_sb/reference/runtime.md`.

## Developer MCP tools

These tools help edit the repo itself. They are optional; if unavailable, use the normal local
files and npm commands.

- **Design Patterns MCP** (`design-patterns`) -- search by problem description before adding a
  non-trivial abstraction or reshaping a playbook flow. It suggests options; `AGENTS.md` remains
  the authority.
- **TS Language MCP** (`ts-language`) -- TypeScript diagnostics and navigation for `scripts/`.
  Useful for focused iteration; `npm run build` remains the full check.

## Verification

Use the smallest check that covers the change:

- `npm run build` -- after any TypeScript or MCP schema change.
- `npm test` -- after changing `scripts/` behavior or tests.
- `node scripts/dist/workspace_validate.js` -- after changing `data/` layout rules or validators.
- `git diff --check` -- after any tracked-file edit.
- Manual doc review -- after playbook, policy, example, reference, docs, or `_sb/` edits:
  check current-state wording, role boundaries, cited file paths, and whether a fresh agent can
  follow the route without chat history.
- `agent-contract/` -- run manually when `AGENTS.md` routing, role boundaries, playbook triggers,
  or known fresh-agent failure modes change. Do not include `agent-contract/` or `data/` in the
  throwaway repo copy used for a run.

Never verify Developer-mode code changes by regenerating real candidate artifacts under `data/`
unless the task explicitly asks to test against runtime data.
