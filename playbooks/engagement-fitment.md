# Playbook: engagement-fitment

Trigger: "оціни це замовлення" / "чи брати цей проєкт" / "assess this job / gig / client project" —
the candidate pastes a commercial-work posting (an Upwork job, a Fiverr order, a direct client
brief), in the same message or the one before.

A blunt, first-pass read on whether an engagement is worth pursuing. Same machinery as
`playbooks/fitment.md` (`score_fit`) and the same store pattern as vacancies (`data/engagements/`
is the engagement root — a flat sibling of `data/vacancies/`, see `_sb/concept.md`), but a
different question. Employment fitment asks "is this the right role"; here the weighting leads
with **can we deliver it → does the money/time work → win probability**, then usefulness of the
work and strategic fit as secondary (see the cluster list). See `_sb/concept.md` for why this is
one fitment model, not a per-platform one.

Everything deterministic here is real code: `engagement_upsert` / `engagement_set_status` /
`engagement_list` / `render_engagement` (MCP tools, or `node scripts/dist/engagement_store.js …` /
`render_engagement.js` as the CLI fallback). Never hand-create a `data/engagements/` folder or
write `record.yaml` yourself — call the tool, same rule as vacancies.

## Step 1 — resolve the engagement

`engagement_upsert` with `client` (empty is fine — often absent on a marketplace posting),
`title`, `url`, and `posting_text` (the pasted posting verbatim). It creates
`data/engagements/<slug>/` with `record.yaml` + `posting.md` and returns the `slug`. Re-running it
for the same posting lands on the same folder and won't reset an advanced status.

If only a URL was given and you can't get a clean read of the posting, ask for the text — don't
judge a job you can't see in full.

## Step 2 — judge (analysis only)

Ground everything in what the posting asks and what `data/CV_GENERAL.md` demonstrates. Run the
same mandatory-language check as `playbooks/fitment.md` (against `data/config.yaml`'s
`shared.languages`). Also apply `fitment.md`'s rule on a **"who we're looking for" / "ideal
candidate" / background section** — a posting that names prior employers, a role archetype (FDE,
founding engineer, agency/consulting background), or a domain track is stating a requirement;
extract it, anchor it on real role history (not on capability, not on the candidate's own
positioning language), and don't let a strong match on the rest of the posting absorb it.

Build these clusters — the weighting lives in the `importance` tiers:

1. **Can deliver it well** — `importance: critical`. Set `blocking: true` only if the candidate
   genuinely can't do this to a professional standard (`evidence: none` then caps the score).
   `direct_strong` = has shipped exactly this; `direct_partial` = adjacent; `transferable` = the
   underlying capability is there in different vocabulary (a specific programming *language* still
   doesn't transfer). A real location/timezone/tooling gate the posting states goes here. If the
   engagement is advisory / client-facing / forward-deployed, "are you the profile they asked for"
   (see the background rule above) belongs in this cluster — for that kind of work the pedigree
   *is* the capability; rate it honestly even when the vocabulary matches. When the work is a
   bounded build and the profile preference is softer, make it its own `important` cluster
   instead. Either way, a "preferred, not required" pedigree preference is usually `important` —
   but bump it to `critical` when the posting foregrounds it **and** cluster 5 shows a crowded
   pool the client is visibly filtering on that same axis (a large field competing on exactly the
   thing the candidate is weakest at makes "preferred" effectively decisive for this bid).
2. **Economics** — `importance: critical`. Stated budget / rate vs. the real effort.
   `direct_strong` = clearly good return on effort; `direct_partial` = tight but worth it; `none`
   = underpriced, vague, or a red-flag budget.
3. **Useful commercial experience / stack** — `importance: important`. Does finishing this add a
   CV-worthy technology line or a nameable commercial reference. If the candidate gave a stack
   focus, weight toward that.
4. **Strategy fit** — `importance: nice_to_have`. Does it move toward the direction in `data/strategy.md`. Tie-breaker only.
5. **Win probability** — `importance: important` (`critical` when the field is very crowded). Note
   the consequence (same as `fitment.md`): a `critical` cluster with primary `evidence: none` caps
   the whole score at 5 — so a `critical` win-probability cluster scored `none` in a crowded pool
   will (correctly) hold a strong-craft bid down to a thin-margin number.
   Whether a proposal has a real chance, from what the posting shows: proposal count, invites
   sent, how many the client is interviewing, "last viewed", and any language about the profile
   they're stocking. `direct_strong` = few proposals, client active, nothing said about a
   preferred pedigree the candidate lacks; `direct_partial` = moderate field, no strong signal
   either way; `none` = 50+ proposals with invites already out, or the client explicitly building
   a bench around a background the candidate doesn't have. This scores the bid, not the candidate
   — a perfect-fit job you'll almost certainly lose is still a weak use of a proposal slot.

- **`job_summary`**: 1-2 sentences — the real deliverable, stripped of padding.
- **`risk`**: one honest sentence — the weakest cluster, plus buyer quality / whether there's a
  real proposal angle if either looks off. (Competition is now cluster 5, not just `risk` prose;
  buyer quality and proposal angle still ride here until a run shows they need scoring too.)
- **`appeal`**: one honest sentence — the strongest reason to bid.
- **`fit_category`**, one of: `good_bet` / `thin_margin` / `wrong_craft` / `scope_unclear` /
  `unclear`.

## Step 3 — score

Call `score_fit` with `job_summary`, the clusters from Step 2, `risk`, `appeal`, `fit_category`,
and `out_dir` (MCP) / `--out-dir` (CLI) = the engagement folder from Step 1 (`data/engagements/<slug>/`).
`score_fit` writes `fitment.json` + `fitment.md` there — never hand-write either. Omit `eligibility` — marketplace work is remote by default and a real gate already sits in the "Can deliver" cluster. Show the returned `markdown` verbatim, same as `playbooks/fitment.md` — don't
re-key it into prose.

## Step 4 — record the verdict

`engagement_upsert` again for the same engagement, now with `fit_score` (from `score_fit`), `fit_category`,
and `fit_reason` (one line). It updates the record and re-renders `data/engagements.html` /
`data/engagements.md`. The engagement stays at `status: new` — "new" here means judged but not yet
committed to, same as a scout-found vacancy.

If the candidate then says they'll bid ("go for it", "track this one"), `engagement_set_status(slug,
"tracked")`. Later transitions as the pipeline moves: `applied` (proposal sent), `interview`
(client replied / call booked), `offer`, `rejected` (didn't win), `skipped` (candidate passed).
Same status set as vacancies; put the observed reason in the `note`.

## Step 5 — next step

One line. If it's a `good_bet`, the natural next step is drafting the proposal — there is no
dedicated proposal playbook yet, so either the candidate writes it or asks and you draft it from the
same evidence: plain text, short, in the posting's own vocabulary, saved as
`data/engagements/<slug>/proposal.md` (it shows up on the board). Don't auto-write it.
