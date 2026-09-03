# Playbook: cover-letter

Trigger: "напиши кавер на цю вакансію" / "write a cover letter for this" — the candidate pastes a
job posting (or a link/description) in the same message or the one before.

Three explicit passes — plan, write, self-check — in one conversation. You are all three roles,
but keep them genuinely separate steps, don't blend them into one pass. The split exists because
"write a persuasive letter" and "only say things you can prove" pull against each other in one
undifferentiated pass — asked to both analyze and persuade at once, it's easy to invent specifics
nobody gave you: a diagnosis of the client's internals, a deliverable nobody asked for, a CV
fragment that only shares a word with the posting. Keeping analysis (Step 2) structurally separate
from persuasion (Step 3) means the writing step has nothing to invent from — it only has the plan.

Read `policies/generation-rules.md` first.

The steps below (Plan/Write/Self-check) use one structure -- Problem/Differentiator/Evidence/
Scope/Core Message -- for both modes Step 1 infers, weighting emphasis differently but not
switching shape.

## Step 0 — Resolve the vacancy

Run `playbooks/vacancy-resolve.md`. Continue only once you have a `slug` and the full posting
text. The cover letter will be saved into that vacancy folder, never into `data/cover-letters/`.

## Step 1 — Infer the application mode

Every downstream step reads differently depending on whether this is a **task-based bid** (a
single deliverable, Upwork-style — fixed price/hourly, a defined piece of work with an end) or a
**long-term role** (an ongoing position — a standing job description, "join our team," expected
to continue past any one deliverable). Most postings give enough signal to tell: task postings
describe one thing to build, fix, or deliver; long-term postings describe a role with ongoing
responsibilities, a team, and no defined end — phrasing like "We are seeking a [title],"
"Responsibilities include," or "the ideal candidate will have" is standard long-term/full-time
language even when the posting never says "full-time." If it's genuinely ambiguous even after
weighing both readings (rare — most postings aren't), ask the candidate rather than guessing.

This mode sets the balance between "what you'll get" (task) and "who you are" (long-term) — the
same distinction between Upwork (client-driven, sells a specific solved problem — see
`reference/surfaces/upwork.md`) and LinkedIn (broad professional identity). Carry it through every step
below, not just as a label: a task-mode letter should read closer to an Upwork Overview reframe
("if you have problem X, I've solved exactly that"); a long-term-mode letter should read closer to
"here's the pattern I repeatedly bring to a role like this."

## Step 2 — Plan (analysis only, no persuasive writing yet)

Work through these five, in order, and write them down before drafting anything. Weight each one
per Step 1's mode — task mode leans toward the concrete deliverable and a specific solved-problem
story; long-term mode leans toward the recurring pattern and who the candidate is day to day:

1. **Problem** — the type of problem underneath what the posting says, 1-2 sentences, framed as a
   pattern, not a diagnosis of this specific client's internals. If the posting gives real signal,
   name the pattern with that grounding. If it's generic/thin, say so plainly rather than
   manufacturing specifics.
2. **Differentiator** — one sentence on what makes this candidate a fit, grounded in
   `data/CV_GENERAL.md` and `data/config.yaml`. In task mode, prefer a differentiator framed
   as "I've solved exactly this before"; in long-term mode, prefer one framed as a recurring
   professional pattern (closer to `shared.core_identity_line`).
3. **Evidence** — decompose the posting's real requirements into underlying capabilities first
   (don't search for literal keyword matches). Then search the whole Master CV for entries
   demonstrating that pattern, regardless of vocabulary, role, or age. Pick at most 2 items, on
   fit not word-overlap. **Abstraction matters most here:** every piece of evidence has three
   levels — (1) the candidate's internal method/personal tool, (2) the underlying capability it
   demonstrates, (3) the client-facing value that capability produces for this posting. Hand
   yourself level 3, sometimes level 2, almost never level 1 — naming a personal working method
   reads as jargon, whether it's old or something they still use today.
4. **Scope** — what the engagement's concrete deliverable/shape actually is, based strictly on
   what the posting says. Task postings usually state this explicitly — paraphrase it briefly. If
   unstated (common for long-term/broad postings), say plainly that scope isn't defined and don't
   invent one; the letter should close by inviting the client to share their actual next step
   instead of proposing a deliverable nobody asked for.
5. **Core message** — the single thought the client should remember five minutes after reading
   the letter, one short sentence. Every paragraph in the draft has to earn its place by
   reinforcing this.

Also note any raw terms from the search that are close-but-not-selected — old product names,
internal terminology, niche tech names — so you don't accidentally reach for them while writing.

## Step 3 — Write (from the plan only, not from re-reading the raw CV)

Deliberately constrain yourself here: write using only the Plan from Step 2 plus general
professional judgment, as if you no longer had the raw Master CV open — this is what makes the
split actually work, not just a formality.

- Max 4 short paragraphs, 1-3 sentences each, well under 150 words total.
- Vary sentence openings — don't start three-plus sentences with "I can"/"I start"/"I have" in a
  row.
- No "Dear Hiring Manager," no signature block, no restating the job post back at them, no
  listing every skill — pick 2-3 relevant ones and tie each to an outcome.
- Plain text only — no markdown formatting, this gets pasted into platforms/emails that don't
  render it.
- Never mention anything the Plan didn't include. Preserve ownership scope from the Plan's
  evidence exactly (never upgrade "contributed to" into "led").
- If the posting asked specific written-answer questions, answer them directly and factually —
  don't fabricate an answer `data/CV_GENERAL.md` doesn't support; say so and ask the candidate.

## Step 4 — Self-check (an independent pass against the plan and the full Master CV)

Now switch hats deliberately — re-read the draft as if checking someone else's work against the
real Master CV (open it again in full) and this file's own rules. Check specifically:

1. **Invented facts** — any employer, number, outcome, deliverable, or mechanism not actually
   supported by `data/CV_GENERAL.md`.
2. **Ownership inflation** — "led"/"built"/"drove" for something the Master CV shows was
   contributed to, not owned.
3. **Indefensible or self-contradictory claims** — would the candidate stand behind the hook if
   pushed on a call? Does it contradict something their own history documents as a value
   elsewhere?
4. **Genericness** — could this exact hook have come from a generic "AI automation expert"
   proposal mill?
5. **Structure/voice violations** — banned corporate phrasing, an achievement list instead of a
   told story, over ~150 words, an invented deliverable.

If you find a real issue, fix that specific paragraph/claim and re-check — don't rewrite the whole
letter from scratch chasing a "perfect" version. A letter that's 90% right and sent beats one
polished forever; but a genuine invented fact or ownership inflation must be fixed, not shipped
with a caveat.

## Step 5 — Save and show

Save to `data/vacancies/<slug>/cover-letter.md`, using the slug Step 0 returned, and show the
final letter in chat. Mention briefly what Step 4 caught and fixed, if anything — the candidate
should see that check happened, not just the polished result.

Some application forms have a file-upload field for the cover letter instead of a text box. Produce
a downloadable version as part of finishing: call `render_cover_letter` (MCP tool, or
`node scripts/dist/render_cover_letter.js <file>.md`). It writes `.txt`, `.html`, and `.pdf` next
to the saved draft.
