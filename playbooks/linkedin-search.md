# Playbook: linkedin-search

Trigger: "згенеруй лінки для LinkedIn" / "linkedin search links" / "знайди мене на linkedin" --
the candidate wants LinkedIn's own search covered, on top of the ATS/board feeds `playbooks/
scout.md` already reaches.

## Why this exists, and why it's not part of the scout

Two real kinds of opportunity live on LinkedIn and reach nowhere else: a founder's plain "we're
hiring" feed post, and a job-board listing a company only ever posts to LinkedIn itself. Neither
is fetchable the way `scout_fetch` reaches public ATS APIs -- LinkedIn forbids scraping at any
volume, full stop, and this repo doesn't do it anywhere.

So this playbook does something different in kind, not just in source: it generates deep-link
URLs into LinkedIn's own search (job board, feed posts, people search), pre-built from `data/
sources.yaml`'s `tracks` -- the same tracks the scout already uses. Job board and feed-post links
need nothing new; the people-search link additionally needs each track's own `hiring_titles:` --
who actually hires for that role (e.g. an Engineering Manager track's hiring titles are VP
Engineering/Director of Engineering/CTO, never "Engineering Manager" itself -- that would just
find peers, a real bug this repo used to ship). Optional: a track without it simply gets no
people-search link, everything else still works. No network call happens here at all. The
candidate opens the resulting links themselves, in their own logged-in browser, at their own pace.

If `data/sources.yaml` doesn't exist yet, say so and point at `playbooks/scout.md`'s Step 0 --
tracks live there, not duplicated into a separate LinkedIn-only config.

## Step 1 -- generate

Call `linkedin_searches` (MCP tool, or `node scripts/dist/linkedin_searches.js` if the server
isn't connected). It writes `data/linkedin-searches.md`: one section per track, each with a Jobs
board link and three feed-post links (different search intents) always, plus a people-search
link only for a track that has `hiring_titles:` set. If any track is missing it, the file itself
says so at the bottom with what to add -- mention that to the candidate rather than letting them
wonder why a track has no people-search link.

## Step 2 -- hand it back, don't just say "done"

Show the candidate the file path, and pull out at least one or two of the actual links inline in
your reply -- don't make them go open the file blind. Mention plainly: these are links to click
yourself, not something this repo can read the results of. If you (or a browser assistant) are
ever asked to open one of these, that's read-only triage at most -- never connect, message, or
apply through LinkedIn on the candidate's behalf; that boundary doesn't bend here.

If a track has a long title list, mention the file's own note about feed-post searches
sometimes coming back empty for a long OR-list combined with a quoted intent phrase ("we're
hiring") -- the Jobs board link doesn't have that limitation, so it's worth trying first if a
feed-post link looks suspiciously empty.
