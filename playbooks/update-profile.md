# Playbook: update-profile

Trigger: "онови мій профіль на LinkedIn/Djinni/Upwork/Fiverr" (or similar, one specific platform
named).

Follow `policies/profiles-framework.md` closely — its rules exist because of specific, real
generation failures (see that file's own incident notes), not speculative caution.

Read `policies/generation-rules.md` and `policies/profiles-framework.md` (the whole file, not
just the named platform's section — the shared principles and authority hierarchy at the top
apply regardless of platform) before generating anything.

## Step 1 — read the inputs

- `data/config.yaml`'s `shared:` block (identity/strategy — the same for every platform).
- `data/config.yaml`'s platform-specific block, if it exists (`pinned:` values plus any
  category-level strategy fields like `upwork.service_directions`).
- `data/CV_GENERAL.md` in full.
- The existing `data/profiles/<PLATFORM>_PROFILE.md`, if one exists — this is update mode; if not,
  this is cold-generate.

If `data/config.yaml` has no `shared:` block at all, stop and run `playbooks/onboard.md`
first — every platform projection depends on it.

## Step 2 — generate, following `policies/profiles-framework.md`'s section for this platform

Read `<platform>.sections` in `data/config.yaml` for the exact list and order to produce, and
`<platform>.out_of_scope` for what to leave untouched if the existing document already has it —
don't reproduce, summarize, shorten, or comment on an out-of-scope section.

If updating an existing document: that text is the literal document you're editing, not
inspiration for a fresh rewrite. Keep wording/structure/voice that still holds up, change only
what's stale, missing, or inconsistent — **except** any selection field (proof points, the
broader Skills list, Fiverr Gig ideas), which gets re-derived from the current Master CV
regardless of what the existing text already has (see `policies/generation-rules.md`'s
"selection fields are not a cache"). An existing document can itself contain an unsupported claim
carried over from an earlier draft — check every existing bullet against the Master CV same as a
new one; don't keep something just because it's already there.

For any `pinned` value in `data/config.yaml` (headline, CTA, top skills, banner line, Djinni
target), reproduce it verbatim — never shorten, simplify, or improve the wording on your own
judgment. If a platform section has no pinned value where one would normally exist, derive it from
`shared:` and flag it as not-yet-committed rather than silently treating your own derivation as
permanent.

## Step 3 — self-check before showing anything

- Every claim traces to `data/CV_GENERAL.md`.
- Ownership language preserved (see `policies/generation-rules.md`).
- No unresolved placeholder text.
- The generated identity (headline/tagline/position) matches `shared:`, not whichever technology
  cluster had the most detailed evidence — see `policies/profiles-framework.md`'s Fiverr section
  for why this specifically needs checking, not assumed correct by default.
- (Fiverr specifically) the Seller Tagline/Description never collapsed into one Gig's own pitch.

## Step 4 — show sections + gaps, ask before saving

List out each section, and separately, any gaps you found (a positioning dimension with no
committed pinned value, evidence too thin to support a claimed differentiator, a section you
skipped because nothing in the Master CV supported it). Ask before overwriting
`data/profiles/<PLATFORM>_PROFILE.md` — the candidate reviews before anything is treated as ready
to paste into the real platform.
