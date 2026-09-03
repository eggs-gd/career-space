---
name: reconcile
description: Reconcile tracked vacancy statuses against real recruiter correspondence in Gmail/Calendar — "applied → interview" on an interview email plus a calendar slot, "applied → rejected" on a rejection, capturing the why on the status_history entry. Reads email/calendar as evidence only, never modifies them. Use when the candidate wants the board brought in line with what's actually landed in their inbox. Skips gracefully if no email capability is connected.
---

Read and follow `playbooks/reconcile.md` in full. It is the single source of truth for this
skill — don't duplicate its instructions here, don't skip steps because they seem implied.
