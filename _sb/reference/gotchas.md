# Gotchas

One line each: a constraint we hit the hard way and re-hit whenever it's not written down. The
trap and the rule -- not the story.

- Board links: absolute `file://` only. A Claude client's local-file preview rewrites relative
  URLs against its own hosted-content domain, pointing nowhere.
- Board must work with no JavaScript and no same-page `#fragment` navigation -- sandboxed
  preview panes strip `<script>` and block top-frame anchor navigation.
- Fitment (employer-side score) and Prioritize (candidate-side, `data/strategy.md`) are
  independent. Dependency only ever `prioritize -> fitment`, never back.
- Write a fetcher only after curl/WebFetch of a real sample. Never guess API/HTML shape.
- `macos-13` GitHub runner is retired -- keep it out of CI matrices.
- `reference/surfaces/<name>.md` is facts only -- fields, order, limits, discovery mechanics. No
  positioning advice (that's `surfaces-framework.md` methodology + the user's own `context.md`). A
  shipped file with any "should" in it is the bug -- it must be contributable by someone who
  disagrees with how to build a career.
- The strategic role a surface plays is user-specific and lives in `data/surfaces/<name>/context.md`
  -- derived from `data/strategy.md` + `shared:`, never assumed from the platform or another user.
- Canonical `reference/surfaces/<name>.md` always wins over a private `data/surfaces/<name>/reference.md`.
- A generated surface identity is checked against the user's direction + `context.md`, never against
  whichever tech cluster the Master CV has most evidence for.
