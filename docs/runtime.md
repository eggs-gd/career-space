# Scripts and the MCP server -- full reference

Not something you need to read to run a playbook -- `AGENTS.md`'s own "Scripts and the MCP
server" section already has the behavioral rule (prefer the MCP tools, never hand-produce a
document or score yourself). This file is what you need once you're actually calling one of these
tools/scripts directly, debugging a connection, or setting things up manually. See `docs/
development.md` instead for `design-patterns`/`ts-language` (editing this repo's own
playbooks/scripts) and how to verify a change to this repo.

## The scripts

The deterministic, non-LLM steps in this repo — real code, not something a playbook should ask
you to eyeball or improvise. TypeScript, compiled to `scripts/dist/*.js` (see `npm run build`).
`scripts/rendering.ts` holds the shared Markdown→HTML/PDF logic; everything else is a thin
interface over it or over `score_fit.ts`'s scoring formula:

- `scripts/render_resume.ts` — Markdown → HTML → PDF for a CV a playbook wrote.
- `scripts/render_cover_letter.ts` — a cover letter draft → plain `.txt` + styled HTML/PDF, same
  source. Exists specifically because some application forms have a file-upload field instead of
  a text box — the candidate needs an actual file, chat text alone isn't attachable.
- `scripts/score_fit.ts` — the 1-10 fitment score + grouped rendering, a fixed weighted formula
  over requirement clusters (see the module's own docstring for the exact weights). `playbooks/
  fitment.md` writes the structured judgment and runs this on it — never compute or state the
  score yourself, see that playbook for why.
- `scripts/scout_fetch.ts` — fetch public ATS/job-board postings, run the cheap prefilter and
  repost-collapse, drop anything already in `data/vacancies/seen.jsonl`. `scout_domain.ts`/
  `scout_sources.ts`/`scout_prefilter.ts` are its supporting modules (config shape, per-source
  fetchers, filter/dedup logic respectively) — `playbooks/scout.md` is the only caller.
- `scripts/vacancy_store.ts` — the seen-log ledger and each vacancy's own `<slug>/` folder's
  *metadata*: slug generation, `record.yaml`, `posting.md`, status transitions. Called by
  `playbooks/scout.md` for a scout-found posting and by `playbooks/cover-letter.md`/
  `playbooks/cv-targeted.md` for a candidate-pasted one -- see `posting_ids.ts` for how both
  resolve to the same vacancy when it's actually the same posting. Never hand-edit `record.yaml`
  or `seen.jsonl` yourself — call the tool. This does NOT mean every file in a vacancy's folder:
  a *generated artifact* for an already-known vacancy (`cv.md`, `cover-letter.md`, `fitment.md`,
  `targeting-plan.md`) is written directly into `data/vacancies/<slug>/` by the playbook that
  generated it — that's the intended, documented pattern (see `attachArtifact`'s own docstring),
  not a shortcut around this tool.
- `scripts/linkedin_searches.ts` — writes `data/linkedin-searches.md`: LinkedIn Boolean search
  deep-links built from `data/sources.yaml`'s `tracks`. No fetching, no network call at all --
  see `playbooks/linkedin-search.md` for why this is deliberately not part of the scout.
- `scripts/render_board.ts` — writes `data/board.html`: every vacancy grouped by status, sorted
  by fit score, with every file present in its folder embedded inline behind a click-to-expand
  badge, plus a real link to the original posting URL. No server, static file, open it directly
  in a browser. Don't hand-summarize `data/vacancies/` into a table yourself instead of calling
  this -- see `playbooks/board.md`.

## MCP vs. CLI

**Prefer the MCP tools if the `career-space` MCP server is connected** — typed arguments, no
shell-escaping a JSON blob, no constructing a `node ...` invocation by hand. `scripts/
mcp_server.ts` wraps the exact same functions (`render_resume`, `render_cover_letter`,
`score_fit`, `scout_fetch`, `vacancy_mark_seen`, `vacancy_upsert`, `vacancy_set_status`,
`vacancy_attach_artifact`, `vacancy_list`, `linkedin_searches`, `render_board`); nothing behaves
differently between the two interfaces. If the server isn't connected (not set up yet, or an
agent without MCP support), fall back to the CLI form documented in each script's own docstring
(`node scripts/dist/render_resume.js <file>.md`, `node scripts/dist/render_cover_letter.js
<file>.md`, `node scripts/dist/score_fit.js <file>.json`, `node scripts/dist/scout_fetch.js`,
`node scripts/dist/vacancy_store.js <mark-seen|upsert|set-status|attach-artifact|list> ...`,
`node scripts/dist/linkedin_searches.js`, `node scripts/dist/render_board.js`) -- run `npm run
build` first if `scripts/dist/` doesn't exist yet.

## How the automatic setup works

**Setup is normally automatic -- the operator should never need to open a terminal.** `.mcp.json` /
`.codex/config.toml` / `.gemini/settings.json` / `.cursor/mcp.json` point `career-space` at `node
scripts/mcp_bootstrap.js` -- one layer, since `node` is already what every one of these configs
assumes (it's also what `design-patterns`/`ts-language` run through). `mcp_bootstrap.js` checks
whether `scripts/dist/mcp_server.js` already exists and `node_modules` actually has what it needs
(a real check, not just "the file is there"); if not, runs `npm ci` then `npm run build`, then
hands off to the real server. If that setup fails, it says so with the underlying error and stops
-- nothing here silently retries or works around a real failure. First connection is slower than
normal for this reason (`npm ci` also pulls down Puppeteer's own Chromium, used for the PDF step)
-- expected, not a hang. Every connection after that is as fast as launching the server directly,
since it detects `scripts/dist/` is already built and skips straight to it.

The one thing this can't self-install is `node` itself -- structurally can't, since the bootstrap
script that would need to detect and explain that is itself a Node script. Not a real gap in
practice for a candidate: every agent this repo documents supporting (Claude Code, Codex CLI,
Gemini CLI, Cursor) is Node-based or bundles Node, so if they can hold this conversation at all,
`node` is already there. Only relevant if you're a developer wiring up a non-Node MCP client that
isn't in that list -- install `node` yourself first in that case, same as any other prerequisite.

If the PDF step (Puppeteer, a headless Chromium print-to-PDF) fails at runtime -- rare, but
possible on a minimal Linux image missing some system libraries Chromium needs -- `render_resume`/
`render_cover_letter` degrade to HTML-only rather than failing the whole call.

Manual setup still works, for a host that doesn't do MCP or if you'd rather control this
yourself:

```bash
npm install
npm run build
```
