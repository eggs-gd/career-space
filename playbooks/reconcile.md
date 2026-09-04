# Playbook: reconcile

Trigger: "звір дошку з поштою / календарем", "reconcile my board with email", "did I hear back on
anything", "оновись по відповідях" — the candidate wants tracked vacancy statuses brought in line
with real recruiter correspondence. Also offered by `playbooks/scout.md` before a scout run.

Methodology: **external observations → reconcile against Career Space state.** The observations
come from email and calendar; the reasoning below is written against *capabilities* (search
email, read a thread, search the calendar), not a specific host or tool name, so it holds
whatever provides them.

career-space ships **no** email integration and needs **no** account or cloud project — it uses
whatever the host already has (a built-in connector, a plugin/app source, or an MCP server the
candidate added themselves). The host composes email with `career-space`; there's no
`career-space` tool that proxies email. `data/vacancies/*/record.yaml` stays the one source of
truth; email and calendar are read-only evidence, never labelled, drafted into, or otherwise
mutated here (those are separate, explicit asks).

## Step 0 — how are the observations arriving?

An email/calendar capability being *visible* is not the same as it being *usable*. Sort out which
case you're in before doing anything:

- **A working email-read tool** — whatever the host provides: a built-in Gmail/Calendar
  connector, a plugin or app source (`@Gmail`), a host extension, or an MCP server the candidate
  added themselves. Tool names vary; reason about "search email for X" abstractly and call
  whatever's there. Confirm it's usable by a call *succeeding*, not by its name appearing.
  → go to Step 1, gathering evidence yourself.
- **Present but not authorized** — a connector/plugin is listed but calls fail with `Auth
  required`, or `@Gmail` is mentioned with no account linked. Don't treat this as "no capability"
  and don't try to authorize it yourself. Tell the candidate to link the account in their host's
  own connector/plugin settings (in Claude, Settings → Connectors; elsewhere, the app's account
  settings), then re-run. Stop until then.
- **The candidate pasted a summary** — they had another agent (e.g. Gemini with its own mailbox
  access) go through recent correspondence and hand back a list of "company X → heard back, looks
  like Y". Treat that text as the observations: skip the gathering in Step 2, go straight to Step
  3 (match and judge) against it. It's second-hand, so lean toward "needs confirmation" for
  anything not spelled out.
- **Nothing at all** — no email capability, no pasted summary. Say reconciliation needs an email
  connector/plugin in their host (or a pasted summary), and stop. Not a failure, just unavailable.

Calendar is always a bonus, never required. If the candidate specifically wants to wire Google's
own remote MCP servers (`gmailmcp.googleapis.com` / `calendarmcp.googleapis.com`), that's a
personal-config choice needing their own Google Cloud project + OAuth client — Google's docs
cover it; it never goes in this repo's committed files.

## Step 1 — the vacancies to reconcile

`vacancy_list` (MCP tool, or `node scripts/dist/vacancy_store.js list`). Reconcile the ones still
in motion — `tracked`, `applied`, `interview` (and `new` if the candidate says they applied
outside the system). Skip terminal ones (`rejected`, `offer`, `skipped`) unless the candidate
asks. Each record already gives you `slug`, `company`, `title`, `status`, `url`.

## Step 2 — gather evidence, bounded

Skip this step entirely if the candidate pasted a summary (Step 0) — you already have the
observations. Otherwise, for each vacancy, search email with **targeted** queries only — never a
broad inbox scan:

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
