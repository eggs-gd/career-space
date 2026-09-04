# Playbook: scout

Trigger: "пошукай вакансії" / "run the scout" / "find me matches" / "перевір нові вакансії" --
the candidate wants public job boards checked against their own profile instead of pasting one
posting at a time. Manually triggered every time (there's no background scheduler here); running
it regularly is on the candidate, or on whatever their agent's own scheduling nicety offers on
top of this playbook.

Everything deterministic here is real code, reachable via the `scout_fetch`/`vacancy_*` MCP
tools (or the equivalent CLI scripts if the server isn't connected) -- see AGENTS.md's "Scripts
and the MCP server" section. Never fetch a job board, dedup, or hand-edit `data/vacancies/*`
yourself; call the tool.

## Step 0 -- one-time setup: `data/sources.yaml`

If `data/sources.yaml` doesn't exist yet, this is the first scout run -- interview the candidate
and write it before doing anything else (same "ask, don't guess" spirit as `playbooks/onboard.md`
for `data/config.yaml`). Ask about:

- **Tracks** -- named groups of title phrases worth searching for (e.g. "Engineering
  Leadership": "engineering manager", "head of engineering"). Each track is `primary` (a title
  match alone is enough to surface a posting) or `fallback` (needs a `strategic_signals` hit too
  -- for roles the candidate would take but isn't chasing). Draw a first draft from
  `data/config.yaml`'s `shared.professional_identity`/`commercial_directions`, then confirm. Also
  ask, per track, for **`hiring_titles`** -- who actually hires for this role, not who holds it
  (Engineering Manager's hiring titles are VP Engineering/Director of Engineering/CTO, never
  "Engineering Manager" itself). Optional and easy to skip on a first pass -- it only powers
  `playbooks/linkedin-search.md`'s people-search link, everything else works without it -- but
  don't guess it yourself if the candidate doesn't say; leave it out rather than inventing a
  reporting hierarchy that might be wrong for their specific market/company size.
- **title_exclude** / **hard_exclude** -- phrases that should drop a posting outright (junior/
  intern titles, "security clearance required," etc.).
- **role_signals** -- mandate-shaped phrases ("founding engineer," "zero to one") that surface a
  posting even if its title matches no track at all.
- **strategic_signals** -- tech/domain proof phrases (a stack, a domain) that only matter for
  gating a `fallback` track match; never a standalone pass.
- **local_keywords** -- the candidate's own city/country phrases, so an explicitly local posting
  passes the location gate even when it isn't tagged remote.
- **companies** -- specific employers to watch directly, each `{name, ats, slug}` where `ats` is
  `greenhouse`/`lever`/`ashby`/`recruitee` (find the slug from that company's own careers page
  URL). Optional -- most candidates rely on `feeds` alone.
- **feeds** -- which of `workable`, `smartrecruiters`, `jobico`, `remoteok`, `remotive`,
  `arbeitnow`, `jobicy`, `himalayas`, `weworkremotely`, `hackernews`, `justjoin`, `nofluff`,
  `douua`, `djinni` to pull from. `justjoin`/`nofluff` are Poland/CEE-focused; `jobico`/`douua`/
  `djinni` are Ukraine-focused (predominantly Ukrainian-language postings) -- skip whichever
  region isn't relevant. `jobico` searches by the track's own `titles` directly, same as
  `workable`/`smartrecruiters` -- no extra config needed. If `douua`/`djinni` is included, also
  ask for **`ua_categories`** below -- without it, those two fetch nothing (`jobico` isn't
  affected, its own search is genuine free text, not a fixed category list).
- **`ua_categories`** (per track, only needed for `douua`/`djinni`) -- dou.ua and Djinni each
  filter their feeds by an exact match against their own small, fixed category list, not by free
  title text. Open `reference/ua-scout-categories.md`, show the candidate the real list (or the
  slice of it that plausibly fits this track), and let them pick -- never invent or guess a
  category name yourself, and never fall back to reusing the track's own `titles` (neither
  platform accepts free title text -- see `reference/ua-scout-categories.md`'s own header). The
  two platforms don't spell the same category the same way, so a track wanting both may need two
  entries (e.g. `DevOps` for dou.ua, `dev_ops` for Djinni). Optional, easy to skip -- a track
  without it simply gets no dou.ua/Djinni postings, nothing else breaks.
- **min_fit_score** (default 4) -- the floor from `score_fit.ts`'s scale below which a judged
  posting stays a `seen.jsonl` line, never gets its own `data/vacancies/<slug>/` folder.
- **max_judgments_per_run** (default 25) -- caps how many candidates one scout run hands you to
  judge, so a first run against a broad config doesn't turn into fifty judgment turns in one
  sitting. Postings past the cap aren't lost -- they're simply not marked seen, so a later run
  picks them up again.

Write the file, show it back, confirm before running Step 1. All values get lowercased/trimmed
by the loader, so casing in the yaml doesn't matter.

## Step 0.5 -- reconcile first, if the capability is there

If a **working** email-read capability is available — whatever the host provides (a connector, a
plugin, an MCP server), confirmed by a call succeeding, not just its name being visible (see
`playbooks/reconcile.md`'s Step 0) — run `playbooks/reconcile.md` before fetching, automatically,
not as a question. It's read-only toward
Gmail/Calendar and follows the normal status rules toward `record.yaml`, so it's the mechanical
front of an already-started workflow, not a new decision (same reasoning as the renderer — see
AGENTS.md's "A deterministic tool call is execution, not a decision"). Ask the candidate only
where `reconcile.md` itself says to. If reconcile errors out, note it and continue to Step 1 — it
never blocks a scout run. If the capability is missing, or present but unauthorized, skip this
step silently and just go to Step 1 — don't nag about setup on every scout run (that's for when
the candidate asks to reconcile directly). New scout finds have no correspondence yet, so
reconciliation never touches them.

## Step 1 -- fetch

Call `scout_fetch` (MCP tool, or `node scripts/dist/scout_fetch.js` if the server isn't connected).
By default it fetches every configured company board and feed; a candidate asking to run only
some of them this time ("just the Ukrainian boards," "skip LinkedIn-adjacent stuff, only X") --
pass their own `feeds:` list's relevant subset as `feeds` (CLI: `--feeds jobico,douua,djinni`).
This is an intersection with what's actually configured, never a way to run something outside
it -- a feed the candidate asks for by name but never added to `sources.yaml` (typo, or genuinely
not set up) comes back in `ignored_feeds`; mention that plainly rather than silently running fewer
sources than they asked for. Per-company boards (`companies:`) aren't affected by this and always
run regardless -- there's no per-run override for those yet.

It runs the prefilter (title/hard excludes, location gate, track/strategic-signal rule), collapses
same-role reposts into one, and drops anything already in `data/vacancies/seen.jsonl`. Report
`fetch_errors` to the candidate if non-empty (one dead company slug or flaky feed is never fatal
to the rest), and mention the funnel briefly so the candidate has a sense of the noise being
filtered before they see anything: `fetched_count` -> `survived_prefilter_count` -> (minus
`collapsed_count` same-role reposts) -> `considered_count` (genuinely new, not already in
seen.jsonl) -> `returned_count` handed back now (`capped_count` held back for a later run, not
lost -- worth a one-line mention if non-zero, so the candidate knows more is waiting rather than
assuming this run found everything).

If `candidates` is empty, say so plainly and stop -- there's nothing to judge this run.

## Step 2 -- judge each candidate

For each posting in `candidates`, run the judgment phase from `playbooks/fitment.md` as a
subroutine, but don't paste the rendered result to the candidate yet. `candidate["job_post_text"]`
is already shaped like a pasted posting. Keep `fitment.md` as the only place that defines detailed
scoring semantics; scout only batches judgments and routes outcomes.

Keep `score_fit`'s structured result around for Step 3, including its rendered Markdown.

Do this for every candidate before moving to Step 3 -- batching the judgments first, then the
writes, keeps a partial failure (a tool error mid-run) from leaving some postings judged-but-
unrecorded while others are recorded.

## Step 3 -- record every outcome

Run `playbooks/scout-record-outcomes.md` for the judged batch.

## Step 4 -- summarize

Tell the candidate, in one pass: how many were fetched/considered/judged, how many now have a new
vacancy record (company/title/score, most promising first) versus were rejected (a one-line
reason each is enough, not the full breakdown -- that's what the ledger is for). For each new
record, offer the natural next step (`playbooks/fitment.md`'s deeper read, `playbooks/
cover-letter.md`, or `playbooks/cv-targeted.md`) rather than assuming which one the candidate
wants. If the candidate confirms one is worth pursuing (a plain "track this one" / "yes, go for
it" is enough, no fixed phrase required), call `vacancy_set_status(slug, "tracked")` right then --
nothing else in this playbook moves a record off `new` on its own.

The record/status tools return updated board paths when they change board-visible state.
