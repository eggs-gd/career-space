# Playbook: prioritize

Trigger: "пройдись по борді і скажи що викинути" / "дай топ 10" / "що з цього викинути нахуй" /
"where am I overqualified" / "which of these are strategic bets" / "help me prioritize the
board" / "what should I actually pursue" — the candidate has more tracked vacancies than they can
act on and wants to know what's actually worth their time, not just what they'd clear the bar on.

## The question this answers, and the one it doesn't

`playbooks/fitment.md` answers "can I clear their bar" — employer-side fit, with the final score
computed deterministically from explicit judgments (the arithmetic is fixed; the judgments feeding
it are the model's own reads on evidence/requirements, not themselves mechanical). This playbook
answers a different question: "do I actually want this" — candidate-side suitability, against
`data/strategy.md`. **Never infer this from a fit score.** A `9/10` fit can be a clear skip (below
comp floor, pure maintenance, wrong track); a `4/10` fit on the candidate's primary strategic track
can be worth keeping as a long-shot. Fitment and this playbook are two independent judgments —
independent enough that this one doesn't need fitment to exist at all; see Step 1.

## Step 0 — `data/strategy.md` doesn't exist yet

If missing, this is the first time this playbook runs — interview the candidate before doing
anything else, same "ask, don't guess" spirit as `sources.yaml`/`config.yaml`'s own onboarding.
Ask about, in plain conversation, not a form:

- **Which of their tracks (`data/sources.yaml`'s `tracks:`) actually matter, and how** — primary
  employment target, strong alternative, an asymmetric bet worth keeping regardless of odds, or
  purely opportunistic. A track's `kind: primary`/`fallback` in `sources.yaml` is about scout
  recall, not this — a `fallback` track for recall purposes can still be a strategic priority here
  (that's the whole point of an asymmetric bet), and a `primary` track for recall can still rank
  low here if the candidate's actually lukewarm on it day to day.
- **Preferences** — ownership shape, IC-vs-management ratio, company stage, domain, greenfield/
  transformation vs long-term maintenance, org size worth influencing, anything else that shapes
  whether a role is a good use of their time once they'd clearly get hired. These are weighed, not
  gates.
- **Hard constraints worth restating here** — only if they're not already mechanically enforced
  elsewhere (`sources.yaml`'s `local_keywords`/`hard_exclude` already gate location/dealbreaker
  phrases at fetch time; `fitment.md` already gates remote/location scope per posting). Don't
  duplicate what's already enforced mechanically — this file is for candidate *wants*, not a
  second copy of existing filters.
- **Explicit exceptions** — when a role that looks like an underreach, off-track, or preference
  mismatch is still worth pursuing (the candidate's own example: "a fractional opportunity is an
  asymmetric bet, never discard solely for low probability of landing it"). Write these down
  explicitly; without them, a plain preference list degrades into a compliant filter that quietly
  optimizes the candidate toward the average, safe option every time.

Write `data/strategy.md` in plain prose — not YAML, not a scored rubric. It's read by an LLM doing
real judgment, not parsed by code; formalizing it into fields/weights now would lock in a first
guess at a decision model nobody's actually validated yet (see the closing note below). Show it
back, confirm before using it in Step 2. See `examples/onboarding/strategy.md` for the shape.

## Step 1 — gather what to reason over

For a whole-board review: `vacancy_list` (or `playbooks/board.md`'s own render) for every
non-archived vacancy, plus each one's `posting.md` and `fitment.md` artifact where present. For a
question about one specific vacancy, just that one's own files.

**A missing `fitment.md` is not a reason to skip a vacancy or wait for one.** Fitment and
suitability are independent judgments in both directions, not just in that suitability outranks a
high fit score — suitability doesn't need fitment to exist at all. A vacancy the candidate
hand-tracked and never ran through `playbooks/fitment.md` still has a real posting to reason
about:

- **Fitment present** — retain its score/category as the independent "can they want me" signal.
  Don't use it to derive suitability in Step 2; the two judgments only combine when ranking/
  recommending in Step 3.
- **Fitment absent** — judge candidate-side suitability from the posting + `strategy.md` alone,
  and say plainly that employer-side fit is unknown rather than guessing at one or inventing a
  score yourself (that's `playbooks/fitment.md`'s job, not this one's — offer to run it if the
  candidate wants that half answered too, don't just do it unasked).

## Step 2 — judge suitability against `data/strategy.md`

Stays sterile candidate-side: `posting + strategy.md → suitability`, nothing else feeding in yet.
A distinct judgment per vacancy, never inferred from its fit score (and not combined with fitment
here at all — that happens in Step 3, not this one). Weigh three different kinds of signal from
`strategy.md` — don't conflate them:

- **Blockers** — a genuine hard constraint from `strategy.md` (or `sources.yaml`'s own
  `local_keywords`/`hard_exclude`) that this specific posting fails. A real blocker means skip,
  regardless of anything else.
- **Preferences** — ownership, IC/management ratio, stage, domain, greenfield vs maintenance.
  Weighed, not gated — a preference mismatch lowers priority, it doesn't disqualify on its own.
- **Strategic alignment** — does this move the candidate toward the track/direction they actually
  want, including whatever exceptions `strategy.md` states. This is the part real judgment earns
  its keep on, not a checklist: a role that reads as a preference mismatch on paper (an IC role for
  someone who leans management) can still be the right strategic move if `strategy.md`'s own
  exceptions call that out (a strong AI-native IC role at the right company, say). Don't flatten
  this into a rule a script could apply.

Land on a plain suitability read per vacancy (high/low, or a one-line judgment) and why -- not the
final recommendation yet, and not a number or a new persisted score. That combines with fitment,
if known, in Step 3.

## Step 3 — combine into a recommendation, then hand it back

Combine each vacancy's Step 2 suitability with its fitment score/category from Step 1 (when
known) into one plain-language recommendation -- apply-hard / worth-a-shot / opportunistic-only /
lottery-ticket-keep / skip, or whatever framing actually answers what the candidate asked.
Illustrative, not a lookup table to apply mechanically: high fit + high suitability -> apply hard;
high fit + low suitability -> easy to get, not worth getting; low fit + high suitability ->
strategic bet, worth trying anyway; low fit + low suitability -> skip. When fitment is unknown
(Step 1), recommend off suitability alone and say the employer-side half is still unanswered.

Group/rank the answer around what was actually asked (a ranked top-N, "these N are safe to cut,"
"here's where you're overqualified") — don't dump every judgment unordered and make the candidate
re-sort it themselves. If the candidate confirms an action on the spot (drop one, prioritize
another), that's `vacancy_set_status`/`vacancy_set_archived` (see `playbooks/board.md`) — this
playbook doesn't write those itself, only reasons and recommends.

**Don't persist these judgments to a new artifact yet.** This is a live judgment made fresh from
`strategy.md` + the current board state every time it's asked, not a cache — the whole point of
keeping it in conversation for now is that the decision model itself isn't settled. If a stable
pattern of criteria/tags shows up after repeated real use, that's a genuine concept change worth
discussing and writing down first (see `AGENTS.md`'s "Code changes follow from instruction
changes") — not something to formalize into a schema or a second score preemptively, before
there's real evidence of what that schema should even contain.
