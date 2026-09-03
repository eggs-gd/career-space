# Optional: Google Workspace reconciliation

`playbooks/reconcile.md` reads Gmail and Calendar to reconcile vacancy statuses against real
recruiter correspondence — "applied → interview" when there's an interview email plus a calendar
slot, "applied → rejected" on a rejection, and so on. It's optional: without it, everything else
works and reconciliation is simply skipped.

## What's wired

`.mcp.json` / `.codex/config.toml` / `.gemini/settings.json` / `.cursor/mcp.json` declare two
remote MCP servers alongside `career-space`:

| name | endpoint |
|---|---|
| `gmail` | `https://gmailmcp.googleapis.com/mcp/v1` |
| `google-calendar` | `https://calendarmcp.googleapis.com/mcp/v1` |

These are Google-hosted (Developer Preview) — not npm packages, not vendored here, no Google SDK
or OAuth code in this repo. The configs only name the URLs; authentication is the MCP host's job.
Until the one-time setup below is done, the host shows them as not connected — expected and
harmless, same as `design-patterns`/`ts-language` on a machine that never set those up.

## One-time setup

1. **Google Cloud project** with the APIs enabled:
   ```bash
   gcloud services enable gmail.googleapis.com gmailmcp.googleapis.com --project=PROJECT_ID
   gcloud services enable calendar-json.googleapis.com calendarmcp.googleapis.com --project=PROJECT_ID
   ```
2. **OAuth client** (Desktop or Web, per your host's docs). Scopes Google currently documents:
   `gmail.readonly` and `gmail.compose` for Gmail; the equivalent calendar read/write scopes.
   Reconciliation only reads — the compose/write scopes matter only if you later use draft or
   event creation.
3. **Connect it in your host:**
   - **Claude (Desktop / claude.ai, Pro/Max/Team/Enterprise):** Settings → Connectors → Add
     custom connector, paste each URL, supply the OAuth Client ID/Secret. Redirect URI:
     `https://claude.ai/api/mcp/auth_callback`.
   - **Claude Code:** the `.mcp.json` entries above are picked up automatically; approve the
     OAuth prompt on first use.
   - **Antigravity:** Google ships a native remote-MCP config (`~/.gemini/antigravity/mcp_config.json`).
   - **Codex / Gemini CLI:** remote HTTP + OAuth support is version-dependent — check the current
     client docs. Codex may need `experimental_use_rmcp_client`.

Never commit OAuth client secrets. The committed configs carry only the endpoint URLs.

## Boundary

`career-space` owns career state and deterministic operations. The Google MCP servers own Google
Workspace. The host agent composes the two — there is no `career-space` tool that proxies Gmail.
Reconciliation writes to `data/vacancies/*/record.yaml` (via `vacancy_set_status`); Gmail and
Calendar are read-only evidence and are never modified as part of it.
