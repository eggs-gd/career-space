# Playbook: update-surface

Trigger: "онови мій LinkedIn/Upwork/Djinni/Fiverr", "перепиши профіль", "підкрути лендос", "update
my portfolio" — one already-defined surface named, the candidate wants its content generated or
refreshed against current evidence.

If the intent for the surface is changing (more EM-focused, different audience, new tone), that's
`playbooks/surface-define.md` first — this playbook keeps the intent fixed and re-projects the
current Master CV through it.

Read `policies/generation-rules.md` and `policies/surfaces-framework.md` in full before generating
anything.

## Step 1 — read the inputs

- `data/config.yaml`'s `shared:` block, and `data/strategy.md` if it exists (the candidate's
  direction — the surface's role in `context.md` is grounded in it). If there's no `shared:`
  block, stop and run `playbooks/onboard.md`.
- `data/surfaces/<name>/context.md` — this surface's role, emphasis, and pinned wording. If it
  doesn't exist, run `playbooks/surface-define.md` first.
- The platform facts: `reference/surfaces/<name>.md` if it exists (canonical wins), otherwise
  `data/surfaces/<name>/reference.md` — fields, order, limits, mechanics only. A free-form surface
  may have neither; its shape is `context.md` alone.
- `data/CV_GENERAL.md` in full.
- `data/surfaces/<name>/output.md` if it exists — this is update mode; the existing text is the
  document you're editing, not inspiration for a fresh rewrite.

## Step 2 — generate

Follow `policies/surfaces-framework.md` for method, `context.md` for this surface's role and
emphasis, and — for a constrained platform — the field list, order, and limits in its
`reference/surfaces/<name>.md`.

If updating: keep wording, structure, and voice that still hold up; change only what's stale,
missing, or inconsistent — **except** selection fields (proof points, the broader skills list,
Gig ideas), which are re-derived from the current Master CV every time regardless of what the
existing text has (`generation-rules.md`, "selection fields are not a cache"). An existing
document can carry an unsupported claim from an earlier draft — check every bullet against the
Master CV (or the surface's defined factual source), new or not.

Reproduce every pinned value from `context.md` verbatim — never shorten, simplify, or improve the
wording. If a pinned value would normally exist but doesn't, derive it from `shared:` and flag it
as not-yet-committed.

## Step 3 — self-check before showing anything

- Every claim traces to the Master CV, or to a factual source the surface explicitly defines —
  never invented. (For a constrained profile the Master CV is the only source.)
- Ownership language preserved (`policies/generation-rules.md`).
- No unresolved placeholder text.
- The generated identity (headline / tagline / position) matches the candidate's direction and
  `context.md`, not whichever technology cluster had the most detailed evidence
  (`policies/surfaces-framework.md`'s "Umbrella identity vs sub-offers" has the failure shape).
- **Leakage check** (`policies/surfaces-framework.md`'s "Projection is subtraction"): for each
  substantial theme in the output, does it serve *this* surface's assigned role, or is it here
  only because it's true / strong / umbrella-level? Shared professional identity recurring is
  fine; unrelated breadth riding along on the umbrella's strength is leakage — cut it or move it
  to the `context.md`'s "don't belong here" note. Don't add artificial differences from sibling
  surfaces to compensate.
- Constrained platform: every field is within its character/structure limits.

## Step 4 — show sections + gaps, ask before saving

List each section, and separately any gaps (a positioning dimension with no committed pinned
value, evidence too thin for a claimed differentiator, a section skipped because nothing in the
Master CV supported it). Ask before overwriting `data/surfaces/<name>/output.md` — the candidate
reviews before anything is treated as ready to paste into the real surface.
