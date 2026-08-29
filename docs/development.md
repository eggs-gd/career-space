# Developing career-space itself -- tooling and verification

Only relevant once you're actually in developer mode (see `AGENTS.md`'s "Two roles you can be
in") and working with `scripts/`/`playbooks/`/`policies/`. Not something an operator-facing
playbook reads or needs.

## MCP tools for working on this repo itself

These two are for editing `playbooks/`/`policies/`/`examples/`/`scripts/` themselves, not for
anything a candidate-facing playbook does — separate from the `career-space` server (see `docs/
runtime.md`). Both are registered in the committed `.mcp.json`/`.codex/config.toml`/`.gemini/
settings.json`/`.cursor/mcp.json` alongside `career-space`, same as it, but optional the way
`career-space` itself is optional before its own one-time setup: if a host can't connect to one,
that's expected until you've actually set it up (see each tool's own setup note below), not a
sign anything is broken -- same "unreachable -> fall back" shape already used for `career-space`
(prefer the MCP tool if connected, otherwise the CLI form) applies here too.

- **Design Patterns MCP** (`design-patterns`) — search over a large pattern library by problem
  description before adding any non-trivial new abstraction to `scripts/` or restructuring a
  playbook's flow. Suggests options, doesn't mandate one; `AGENTS.md`'s own rules (real code for
  deterministic work, nothing speculative) still override. If the server isn't reachable, don't
  block on it — read a neighboring file instead. Third-party project (MIT-licensed), not vendored
  here — it's a full Node.js app with its own vector-embedding database, hundreds of MB with
  dependencies installed, not something to bundle into this repo's own history for a dev-only
  tool most people working on this repo will never need. One-time setup: clone
  `https://github.com/apolosan/design_patterns_mcp`, follow its own README to build/seed it, then
  add to your own local MCP config (not committed):
  ```json
  "design-patterns": {
    "command": "sh",
    "args": ["-c", "AGENTS_TOOLS_DIR=\"${AGENTS_TOOLS_DIR:-$HOME/.agents}\"; exec env DATABASE_PATH=\"$AGENTS_TOOLS_DIR/design_patterns_mcp/data/design-patterns.db\" node \"$AGENTS_TOOLS_DIR/design_patterns_mcp/dist/mcp-server.js\""]
  }
  ```
  (adjust the path to wherever you actually cloned it -- `AGENTS_TOOLS_DIR` defaults to
  `$HOME/.agents` if unset).
- **TS Language MCP** (`ts-language`) — replaces the old `pyright` entry now that `scripts/` is
  TypeScript, not Python. Wraps the TypeScript Compiler API directly (no separate LSP process to
  manage) -- `get_diagnostics`/`get_all_diagnostics` for type errors on a changed `.ts` file
  (same check `npm run build`/`npx tsc --noEmit` does, just per-file and faster to iterate on),
  plus navigation/refactoring tools (`get_definition`, `get_references`, `rename_symbol`,
  `organize_imports`, and more -- ~30 tools total). `npx -y ts-language-mcp .` -- zero setup
  beyond having `node`, same as `career-space` itself. Small, single-maintainer project (real,
  actively published on npm, not abandoned) rather than an official/first-party one -- there's no
  first-party MCP server for TypeScript diagnostics as of this writing, same situation `pyright`
  was in for Python. If it ever stops working or gets abandoned, `npx tsc --noEmit` alone is
  always the fallback, same graceful-degradation posture as everything else in this section.

## Verifying a change to this repo's own tracked files

No LLM API to call from here and no test suite (there's no code to run — `scripts/` is the one
exception, see its own notes). When you edit a playbook, policy, or example file, sanity-check it
against `AGENTS.md`'s Ground rules and against the sibling files it cites.
