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
