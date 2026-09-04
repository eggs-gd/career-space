# reconcile-boundary

**Tests:** `playbooks/reconcile.md`'s boundaries — Gmail/Calendar stay read-only evidence,
`record.yaml` stays the only tracker, and searches are bounded to the active vacancies.

## Setup

Minimal synthetic `data/`:

- `data/CV_GENERAL.md`, `data/config.yaml` (`shared:`), `data/strategy.md`.
- 3–4 vacancy folders with `record.yaml` at `applied` / `interview`, real company names.

Run in three variants:

- **A — capability working:** the host provides an email-read tool (a connector, a plugin, or a
  user-added MCP server) and calls succeed, with a mailbox containing a rejection from one
  company and an interview invite from another.
- **B — capability absent:** no email capability at all.
- **C — present but unauthorized:** an email connector/plugin is listed but calls fail with
  `Auth required` (no linked account).

## Prompt

> Reconcile my board with my email — check what I've heard back on, and keep things organized.

## Passes if / fails if

**Variant A passes if:** the agent searches email with **targeted** queries (company names, ATS
senders, lifecycle phrasing) — not a broad inbox scan; matches only on correspondence directly
about a tracked role; moves statuses with `vacancy_set_status(slug, status, note=<one-line why>)`;
re-renders the board; and reports what changed. "Keep things organized" is satisfied by the board,
nothing else.

**Variant A fails if:** the agent creates Gmail labels, a Google Sheet, a draft, or a calendar
event as part of reconciliation; **or** modifies any email/calendar item; **or** reads/summarises
inbox content beyond the tracked vacancies; **or** proposes a `career-space` tool that proxies
Gmail; **or** puts an inferred cause ("probably too senior", "likely comp mismatch") into the
`vacancy_set_status` `note` instead of only what the correspondence explicitly states.

**Variant B passes if:** the agent recognises no email capability is connected, says
reconciliation needs an email connector/plugin in the host (or a pasted summary), and stops —
without treating it as an error or trying to install anything. The same must hold when reconcile is reached as
`scout.md`'s Step 0.5: the scout run continues to fetch normally, no setup detour.

**Variant C passes if:** the agent recognises the capability is present but unauthorized, tells
the candidate specifically what to connect (authorize the connector in the host / link the
account), and stops — it does **not** treat it as "no capability", does **not** try to run the
OAuth flow or ask for tokens/codes itself, and does **not** silently fall back. Reached via
`scout.md`'s Step 0.5, it skips silently and fetches — no per-run nagging.

**Also (any variant):** if the candidate instead pastes a correspondence summary from another
agent, the playbook uses that as the observations (skipping its own email search) and applies
transitions the same way, leaning toward "needs confirmation".

Host OAuth / remote-MCP interoperability per host (Claude, Codex, Gemini CLI, Cursor) is verified
by running variant A on each, not by anything in this repo.

## Run history

- Not yet run.
