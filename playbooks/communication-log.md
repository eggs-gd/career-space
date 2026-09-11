# Playbook: communication-log

Trigger: "збережи переписку", "log this communication", "додай це в історію по вакансії/проєкту" —
the candidate wants correspondence, interview notes, approvals, confirmations, feedback, or
client/recruiter messages preserved under one tracked opportunity.

Store the raw communication, not a summary artifact. `communication.md` is a long readable log:
one short `Summary:` block at the top, then every preserved event below as quoted text. The
summary is an index for future agents; the event bodies are the source of truth.

## Step 1 — resolve the opportunity

Work out whether this belongs to Employment (`data/vacancies/<slug>/`) or Engagement
(`data/engagements/<slug>/`). Use the candidate's slug if they gave one; otherwise list the
relevant board (`vacancy_list` or `engagement_list`) and match by company/client + title.

If the match is ambiguous, ask before writing. Never create a vacancy or engagement just to store
communication; the communication log attaches to an already-known opportunity.

## Step 2 — prepare the entry

Keep the original text as intact as the host provides it: sender words, approval text,
confirmation text, rejection text, interview invite, candidate reply, or pasted call notes. Do not
replace it with a paraphrase. Trim only irrelevant transport noise (tracking footers, repeated
quoted thread history the candidate did not ask to preserve, empty signature clutter).

Prepare:

```
kind          vacancy | engagement
slug
title         short event title
source        Gmail, LinkedIn, Upwork, pasted notes, etc.
observed_at   email/message/event date if known
direction     inbound | outbound | meeting | note
status        related pipeline status if there is one
summary       one paragraph covering the whole communication.md so far
raw_text      the event text to preserve as quotes
```

## Step 3 — append

Call `opportunity_log_communication` (MCP tool, or `node scripts/dist/communication_log.js` if the
server isn't connected). It writes/updates:

`data/vacancies/<slug>/communication.md` or `data/engagements/<slug>/communication.md`

The tool updates only the top `Summary:` block and appends the new event section below it. It
quotes the raw text line by line; don't hand-write or overwrite the file when the tool is
available.

## Step 4 — status impact

If the same communication also directly supports a pipeline transition, call the relevant status
tool after logging it: `vacancy_set_status` or `engagement_set_status`. The status note stays one
observed line; the detailed correspondence stays in `communication.md`.

Do not infer a rejection reason or client motive just because the raw message is preserved.
