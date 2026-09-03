# Playbook: reconcile

Trigger: "звір дошку з поштою / календарем", "reconcile my board with email", "did I hear back on
anything", "оновись по відповідях" — the candidate wants tracked vacancy statuses brought in line
with real recruiter correspondence. Also offered by `playbooks/scout.md` before a scout run.

Methodology: **external observations → reconcile against Career Space state.** Today the
observations come from Gmail and Calendar; the reasoning below is written against *capabilities*
(search email, read a thread, search the calendar), not a specific host or tool name, so it holds
if the same evidence arrives another way later.

`data/vacancies/*/record.yaml` stays the one source of truth. Gmail and Calendar are read-only
evidence — never labelled, drafted into, or otherwise mutated here (those are separate, explicit
asks).

## Step 0 — is the capability there?

Check for an email-search capability (the `gmail` MCP server, or whatever the host provides).
Calendar is a bonus, not required. If there's no email capability: say reconciliation isn't set
up (point to `docs/workspace.md`), and stop — this isn't a failure, just an unavailable option.

## Step 1 — the vacancies to reconcile

`vacancy_list` (MCP tool, or `node scripts/dist/vacancy_store.js list`). Reconcile the ones still
in motion — `tracked`, `applied`, `interview` (and `new` if the candidate says they applied
outside the system). Skip terminal ones (`rejected`, `offer`, `skipped`) unless the candidate
asks. Each record already gives you `slug`, `company`, `title`, `status`, `url`.

## Step 2 — gather evidence, bounded

For each vacancy, search email with **targeted** queries only — never a broad inbox scan:

- the company name, plus the role title or an obvious short form;
- likely senders: the company's own domain, common ATS domains (greenhouse, lever, ashby,
  workable, …), a recruiter name if one appears in the record or a prior thread;
- application-lifecycle phrasing near the company name ("application", "interview", "next steps",
  "unfortunately", "offer").

If a calendar capability is present, look for events in the same window whose title or attendees
match the company or a recruiter — an interview slot is strong corroboration for an interview
email.

Do not read or summarise anything outside this scope. This playbook reconciles vacancies; it does
not survey the candidate's inbox.

## Step 3 — match and judge

Tie an observation to a vacancy only on **high-confidence** evidence that directly refers to that
application or role — a reply in the application thread, an interview invite naming the role, a
rejection from the ATS. A company name showing up in an unrelated email is not a match.

Per matched observation, work out:

```
slug
observed_at            (the email/event date)
current status
suggested status
evidence summary       (one line: what the correspondence actually says)
reason                 (market feedback — ONLY if the correspondence states it; else omit)
confidence             (high / needs-confirmation)
```

Never invent a rejection reason. "Rejected" with no stated reason is recorded as just the
transition.

## Step 4 — apply

- **High confidence, transition directly supported** → `vacancy_set_status(slug, status, note=<one
  line>)`. `note` is an **explicitly observed** transition reason/context only — what the
  rejection email said, that an interview was scheduled, a requirement the recruiter stated. Not
  your inference about *why* ("probably too senior", "likely comp mismatch"): omit that entirely.
  If the correspondence states no reason, pass no `note`. This follows the same status rules as
  anywhere else (never regress to `new`; a no-op if already at that status).
- **Needs confirmation** (ambiguous match, unclear whether a call was an interview or a screen,
  two roles at one company) → present it to the candidate and ask before moving anything.
- Never mutate Gmail or Calendar.

## Step 5 — summarise

In one pass: transitions applied (with the one-line why), transitions proposed and waiting on the
candidate, and vacancies with no new signal. The status tool returns updated board paths for
applied transitions. For a fresh `interview`, offer
`playbooks/cv-targeted.md` / interview-prep next steps; for a `rejected` with a stated reason,
note whether it points at a real gap worth reflecting in positioning or the Master CV.
