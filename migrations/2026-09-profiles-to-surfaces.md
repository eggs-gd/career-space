# Migration: data/profiles/ + config.yaml platform blocks -> data/surfaces/

One-time, per-candidate. No code involved (every file here is agent-read). Run once against a
`data/` that predates the surfaces model.

## Detect

`data/profiles/*_PROFILE.md` exists, or `data/config.yaml` has top-level `linkedin:` / `djinni:` /
`upwork:` / `fiverr:` keys.

## Steps

For each of `linkedin`, `djinni`, `upwork`, `fiverr` that the candidate actually has:

1. `mkdir data/surfaces/<name>/`.
2. Move `data/profiles/<NAME>_PROFILE.md` -> `data/surfaces/<name>/output.md` (unchanged content).
3. Create `data/surfaces/<name>/context.md` from that surface's `config.yaml` block:
   - `pinned:` values -> a **Pinned** section (verbatim).
   - category-level strategy (`upwork.service_directions`, `role_emphasis_order`,
     `fractional_cto_explicit`, `djinni.pinned.current_target`, `linkedin.open_items`, …) ->
     **Emphasise / decisions** section.
   - `sections:` / `out_of_scope:` are platform facts -> drop; they now live in
     `reference/surfaces/<name>.md`.
   - **Role in strategy** and **Audience** -> best guess from `data/strategy.md`, marked for the
     candidate to confirm (`playbooks/surface-define.md` is the real way to set these).
4. Remove the `<name>:` block from `data/config.yaml`.

Then:

5. `rmdir data/profiles/` once empty.
6. Update `data/config.yaml`'s header comment to the `shared:`-only framing (match
   `examples/onboarding/config.yaml`).
7. Show the candidate each new `context.md` and confirm.
