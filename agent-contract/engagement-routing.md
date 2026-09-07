# engagement-routing

**Tests:** the Employment vs Engagement split (`_sb/concept.md`) — `AGENTS.md`'s trigger row
("оціни це замовлення" / "assess this job / gig / client project" → `playbooks/engagement-fitment.md`)
and the two data roots. A fresh agent should route a "should I take this project" ask to
`engagement-fitment.md` (not `fitment.md`), use the `engagement_*` tools, write under
`data/engagements/` (not `data/vacancies/`), and lead the weighting with deliverability + economics
+ win-probability. The mirror check: an ordinary employment posting must still route to
`fitment.md` and `data/vacancies/`, not get pulled into the engagement path just because the row
exists.

## Setup

Minimal synthetic `data/` (Master CV, `config.yaml` `shared:`, `strategy.md`). `career-space` MCP
connected or CLI available. Two variants, each its own fresh agent:

- **Engagement:** a pasted commercial-work posting — fixed-price or hourly, a defined deliverable,
  a client handle, "submit a proposal", no ongoing-role language.
- **Employment (mirror):** a pasted standard vacancy — "We're hiring a [title]", ongoing
  responsibilities, a team, a company careers page.

## Prompt

**Engagement variant:**

> Should I take this one? [pasted posting: "Fixed price $2,500. Need an experienced Go developer
> to build a service that syncs Stripe invoices into NetSuite. ~2 weeks. Send a proposal with
> relevant examples." — client: "FinFlow (payments startup)"]

**Employment variant:**

> Am I a fit for this? [pasted vacancy: "Nimbus Data is hiring a Senior Backend Engineer. You'll
> own our ingestion services, mentor two engineers, and work with product on the roadmap. Apply
> via our careers page."]

## Passes if / fails if

**Engagement variant passes if:** the agent reads `playbooks/engagement-fitment.md`, judges with
the engagement clusters (deliverability + economics as `critical`, experience and win-probability
as `important`, strategy as `nice_to_have`), runs `score_fit`, and records it via
`engagement_upsert` (folder under `data/engagements/<slug>/`, an engagement `fit_category` like
`good_bet` / `thin_margin`). It does **not** create a `data/vacancies/` folder for it.

**Employment variant passes if:** the agent routes to `playbooks/fitment.md`, judges with the
normal weighting, and (if it records anything) uses the vacancy path — `data/vacancies/`,
`vacancy_*` tools. It does **not** route to `engagement-fitment.md`.

**Fails if (either):** the engagement is run through `playbooks/fitment.md` with employment
weighting or lands in `data/vacancies/`; **or** the employment posting is routed to
`engagement-fitment.md` / `data/engagements/`; **or** the agent conflates the two paths (e.g.
writes an engagement record with `vacancy_upsert`, or invents a combined board).

## Run history

- 2026-09-07: **Both variants PASS.** Fresh `general-purpose` agents, separate throwaway copies,
  MCP not connected so CLI fallback throughout. (This run predates the freelance -> engagement
  rename and the trigger-row rewording; behaviour is unchanged by either, worth a re-run when
  convenient.)

  **Engagement:** matched the trigger row, followed `playbooks/engagement-fitment.md` (also read
  `fitment.md` for the cluster mechanics, nothing under `_sb/`). Ran the engagement store's CLI —
  *not* `vacancy_store.js` — creating `data/engagements/<slug>/` (`record.yaml` + `posting.md`,
  never `data/vacancies/`); the upsert auto-re-rendered the engagements board. Clusters:
  can-deliver `critical`+`blocking`, economics `critical`, useful-experience `important`,
  strategy-fit `nice_to_have`. Passed `fit_category: wrong_craft`, got 3/10. Re-upsert with the
  score landed on the same folder (idempotent). Clean pass.

  **Employment (mirror):** matched "assess my fit" → `playbooks/fitment.md`. Saw
  `engagement-fitment.md` in the directory listing and explicitly declined it ("this is an
  employer job posting, not a client engagement"). Normal weighting, no record written, no
  `data/engagements/` or `data/vacancies/` folder. Clean pass — the engagement row does not pull a
  standard vacancy into the engagement path.
