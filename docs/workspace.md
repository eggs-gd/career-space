# Optional: email/calendar reconciliation

`playbooks/reconcile.md` reads recruiter correspondence to bring vacancy statuses in line with
reality — "applied → interview" on an interview email plus a calendar slot, "applied → rejected"
on a rejection, and so on. It's optional and needs no setup inside this repo.

## How it gets at your email

career-space ships **no** Google integration and mandates **no** account or cloud project —
that would break the "no server, no app, no account" idea the whole workspace runs on. Instead,
`reconcile.md` uses whatever email/calendar capability **your chat host already has**:

- a built-in connector (Claude's Gmail / Google Calendar connector),
- a plugin or app source (a Codex `@Gmail`, a Gemini extension),
- an MCP server you added to your own host config yourself,
- or, failing all of that, a summary you paste in from another agent that has mailbox access.

If your host has one of these **and it's authorized**, reconcile uses it. Tool names differ per
host; the playbook reasons about "search email for X" abstractly and calls whatever's there.
"Authorized" matters: a connector merely *appearing* in the host UI can still fail with `Auth
required` until you actually link the account — do that in the host's own connector/plugin
settings (career-space can't and won't run the OAuth flow for you).

If nothing is connected, reconcile skips cleanly — it never blocks anything else, and you can
always fall back to pasting a summary.

## If you want to add Google's own remote MCP server

Entirely optional and not something this repo sets up. Google hosts remote MCP servers for Gmail
(`https://gmailmcp.googleapis.com/mcp/v1`) and Calendar
(`https://calendarmcp.googleapis.com/mcp/v1`). They have no dynamic client registration, so using
them means creating a Google Cloud project and your own OAuth client — see Google's own docs
(`developers.google.com/workspace/gmail/api/guides/configure-mcp-server`). Add the result to your
personal host config, never to this repo's committed files (secrets don't get committed). For
most people a host connector or plugin is the easier path.

## Boundary

`career-space` owns career state and deterministic operations. Whatever provides email/calendar
owns that. The host agent composes the two — there is no `career-space` tool that proxies Gmail.
Reconciliation writes to `data/vacancies/*/record.yaml` (via `vacancy_set_status`); email and
calendar are read-only evidence, never modified as part of it.
