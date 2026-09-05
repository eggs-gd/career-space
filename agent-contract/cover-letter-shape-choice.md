# cover-letter-shape-choice

**Tests:** `playbooks/cover-letter.md`'s Step 2 shape judgment (Shape A, human-read-likely, vs
Shape B, ATS/formal-pipeline-likely) — a fresh agent picks confidently on clear signal, and asks
rather than silently guessing when the signal is genuinely mixed. This is a newer, less-proven
judgment call than mode (task vs long-term), which the instructions call out explicitly.

## Setup

Minimal synthetic `data/` (Master CV, config, strategy). Two vacancy variants:

- **Clear (Shape A):** a posting for a fractional/advisory engagement, contacted directly by the
  founder via email, casual/direct language, small company, no mention of an application portal.
- **Ambiguous:** a posting with mixed signals — e.g. a mid-size company's own careers page (not an
  obviously ATS-branded URL) with fairly formal language, but no clear indication of whether a
  person or a system screens applications first.

## Prompt

(Same for both, with the respective posting pasted in.)

> Write a cover letter for this.

## Passes if / fails if

**Clear variant passes if:** the agent picks Shape A without asking, states which shape it chose
and a one-line reason (so the choice is visible, not silent), and writes accordingly.

**Ambiguous variant passes if:** the agent says which way it's leaning and asks the candidate to
confirm the shape before writing, rather than silently picking one.

**Fails if (either variant):** the agent never mentions the shape decision at all (picks silently,
visible or not); **or** treats shape as the same thing as mode (task vs long-term) and skips the
judgment; **or**, in the ambiguous case, guesses instead of asking.

## Run history

- 2026-09-04: **Clear variant PASS, Ambiguous variant FAIL.** Run against the actual working tree
  (fresh `general-purpose` agents, throwaway copies minus `.git`/`agent-contract`/`data`, synthetic
  `data/CV_GENERAL.md`+`config.yaml` for a fictional candidate, `node_modules`/`scripts/dist`
  copied in to skip a redundant rebuild — the one deliberate deviation from the README's exact
  copy procedure, unrelated to what this test checks).

  **Clear:** picked Shape A without asking, stated it explicitly with the reason ("direct,
  informal message from a startup founder... no ATS, no formal portal... fractional-adjacent"),
  read only `cover-letter-shape-a.md`, wrote a compliant letter (4 short paragraphs, ~115 words,
  no salutation/signature). Full pass, nothing to fix.

  **Ambiguous FAIL:** the agent did *not* ask. It read the posting (mid-size company, own careers
  page, formal Responsibilities/Requirements bullets, no named ATS platform, no human contact) and
  decided Shape B outright: *"I judged the combined signal strong enough to decide rather than
  treat as 'mixed or thin' per the playbook's stated bar for asking."* Its stated reasoning —
  formal bullet structure + "our careers page" phrasing — was exactly the combination this variant
  was designed to leave genuinely open (see Setup). The instruction ("if signals are mixed or
  thin... ask") gives no operational floor for what counts as "mixed" beyond the agent's own
  confidence, so a moderately-formal-reading posting clears that bar every time, defeating the
  "ask when unsure" intent.

  **Not yet fixed** — proposed tightening, pending confirmation: name concrete signals that count
  as a real ATS/formal-pipeline indicator (an actual platform named or inferable — Greenhouse,
  Lever, Workday, "our applicant tracking system" — or an explicit statement that a recruiter/team
  reviews applications) versus signals that don't settle it on their own (formal tone, bullet
  structure, "careers page" with no platform named, company size alone). Absent a real indicator,
  treat it as mixed and ask, even if the posting reads formally. Rerun both variants against the
  same postings after the instruction change to confirm.

  Separately observed, not part of this test's own pass/fail: neither run re-rendered the board
  after `vacancy-resolve.md` created a new tracked record. Root-caused separately to a real
  MCP/CLI parity gap in `scripts/vacancy_store.ts`'s `cli()` — the MCP tool wrappers for
  `vacancy_resolve`/`vacancy_set_status`/`vacancy_set_archived`/`record_scout_outcomes` already
  auto-rendered, but their CLI forms never got the equivalent call. Fixed (not part of this test):
  a lazy-`require`d `renderBoardFromCli()` helper wired into all four CLI branches, verified via
  build, full test suite, and a real runtime smoke test.

- 2026-09-04 (rerun): **Ambiguous variant PASS** after tightening `playbooks/cover-letter.md`
  Step 2 with a concrete operational floor — only a named/inferable ATS platform (Greenhouse,
  Lever, Workday, "our applicant tracking system") or an explicit statement that a recruiter/team
  screens applications settles ATS/formal-pipeline-likely on its own; formal tone, bulleted
  Responsibilities/Requirements, a generic "careers page" with no platform named, and company size
  are each real signal but none settle it alone.

  Same throwaway-copy procedure (fresh `general-purpose` agent), same Ambiguous posting text
  reused verbatim (mid-size company's own careers page, formal bulleted Responsibilities/
  Requirements, no named ATS, no stated screener), synthetic data this time sourced directly from
  `examples/onboarding/` rather than hand-written.

  The agent asked rather than decided: *"That combination is genuinely ambiguous by this repo's
  own rule... is this going through a large-company recruiting pipeline / dedicated recruiter, or
  is it more likely a smaller team / hiring manager reading it directly?"* — explicitly naming the
  new floor as the reason ("apply through our careers page," which the policy names by example as
  not sufficient on its own). Did not read either shape file before asking (correct — Step 2 hadn't
  picked one yet). Did not write or save a letter before the blocking question was answered. Both
  cover-letter-shape-choice fixes are now confirmed; no further action pending from this test.
