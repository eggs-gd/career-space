---
name: reconcile
description: Reconcile tracked vacancy statuses against real recruiter correspondence — "applied → interview" on an interview email plus a calendar slot, "applied → rejected" on a rejection, capturing the why on the status_history entry. Uses whatever email/calendar capability the host already has (connector, plugin, or a user-added MCP server); reads it as evidence only, never modifies it; falls back to a pasted summary. Use when the candidate wants the board brought in line with what's actually landed in their inbox. Skips gracefully if nothing's connected.
---

Read and follow `playbooks/reconcile.md` in full. It is the single source of truth for this
skill — don't duplicate its instructions here, don't skip steps because they seem implied.
