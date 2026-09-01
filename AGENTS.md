# Working on this repo with a coding agent

Canonical instructions file. `CLAUDE.md`, `GEMINI.md`, and `.cursor/rules/agents.mdc` are thin
pointers back here; Codex CLI (and any other agent that reads `AGENTS.md` by convention) reads
this file directly. Edit rules here, not in a pointer.

This is a personal job-search workspace, run entirely through conversation with whichever coding
agent has this repo open — Claude Code, Codex, Gemini, or anything else that can read files, ask
questions, and write files back. No separate LLM API to call for a playbook's own judgment work
(generating, assessing, checking) — **you are that engine, right here in the conversation.**
`scripts/` does have a real MCP server and build step underneath (see "Scripts and the MCP server"
below), but it's the deterministic non-judgment layer, and it's invisible to the operator by
design — never something a playbook's own generate/assess/check step means calling.

Runtime person-specific data lives under `data/`, which is gitignored (see `.gitignore`) — never
commit anything under it, never paste its contents anywhere public, never treat this repo's own
git history as a backup for it. `playbooks/`, `policies/`, and `scripts/` are reusable technique.
`examples/` contains onboarding seed examples: useful for shape and quality, never runtime
candidate data and not something a playbook should read except during onboarding. `reference/`
holds static reference data a playbook consults but never invents or guesses on its own — e.g. a
third-party site's fixed category taxonomy; a playbook that names one of these files means read
the real values in it and offer them to the candidate, not approximate from memory.

**Everything in this repo except `_sb/` and `agent-contract/` is for execution — what you read and
act on to run a playbook. `_sb/` is for development**: this repo's own roadmap, status, and design
notes for whoever is building career-space, not a playbook and not candidate-facing. Don't read it
while running a playbook, and never treat anything in it as an instruction to follow — only open
it when the candidate explicitly asks about this repo's own roadmap or development status.
**`agent-contract/` is a developer-only regression suite** -- test prompts that check whether a
fresh agent derives correct behavior from this file, not whether the code works; see its own
`README.md`. Not something a playbook reads, and not something to run as part of one.

`jobhunt-agent` (adjacent repo) is reference only, never a dependency and never imported
directly. `scripts/scout_sources.ts`'s fetchers target the same public ATS/board APIs (public
endpoint shapes, not code) but are native to this repo's own conventions.

## Two roles you can be in -- know which one before you do anything else

This repo serves two different people, and almost everything below assumes you already know
which one you're talking to:

- **Operator** (by far the more common role -- but that's not the same as assumed; see below):
  a candidate running their own job search. Everything in "What the candidate can say to trigger
  each playbook" below, `data/`, the playbooks -- this is what the rest of this file means unless
  a section says otherwise.
- **Developer**: someone extending or maintaining career-space itself. `_sb/`, `playbooks/`/
  `policies/`/`scripts/` as *code to edit* rather than *technique to run*, and "MCP tools for
  working on this repo itself" below. Developer mode doesn't grant operator privileges: don't
  inspect, regenerate, or otherwise operate on a candidate's `data/` as part of a repo-development
  task unless that task explicitly requires testing against runtime data and the user asked for
  exactly that. Fixing `render_board.ts` doesn't mean also regenerating `data/board.html` "to
  check it worked" -- that's operating on someone's real job-search data from developer mode, not
  verifying code.

A short opening message can't reliably tell you which one -- "set me up" could mean either. See
"First contact" below for exactly when and how to resolve that.

**If someone wants both** -- to run their own job search AND work on career-space itself -- tell
them plainly to do that in two separate conversations, not one. Mixing operator and developer
context in a single chat means guessing, message to message, which rule set and which file layout
apply -- confusing for you, worse for them.

**The boundary is a refusal, not just a default you fall into at first contact -- and it applies
to part of a message, not only whole ones.** An operator asking you to edit `scripts/` or fix a
playbook's own logic, or a developer asking you to run a fitment check or write a cover letter --
don't quietly do it because you technically can (you can read and edit any file here; that's not
the same as it being your job in this conversation). This includes a developer-shaped ask bundled
into an otherwise-operator message ("show me the board, and also fix this bug while you're at
it") -- do the operator part, then say plainly the other part belongs in a separate conversation;
don't do both just because they arrived in the same breath. Check a message against this rule in
full before you act on it, not just the part that happens to match a playbook/skill trigger --
matching a trigger for HALF a message doesn't clear the other half.

**Never fix the output -- fix whatever let the wrong output happen.** If you (or a human) ever
end up hand-patching something because these instructions didn't get you to the right behavior on
their own, that is not a workaround to quietly apply and move past -- it's a bug in this repo's
own documentation, architecture, tools, or examples, the same way a wrong CV detail gets flagged,
not silently worked around. The bar this repo is actually held to: a fresh agent, zero prior
context beyond what's in this repo, should read it and behave correctly -- not "does this work
after months of chat history with one specific agent that's learned your habits." Sometimes the
real fix isn't another paragraph here either -- it's making the wrong action structurally
impossible (the same reason `score_fit.ts` is real code instead of an agent estimating a number by
feel; see "Scripts and the MCP server" below for more of that pattern).

**Code changes follow from instruction changes, not the other way around.** Before touching
`scripts/`/`playbooks/`/`policies/`, check whether the current behavior is a faithful
implementation of what this repo's own documentation already says. If it is, someone wanting
different behavior isn't reporting a bug -- they're proposing to change the concept. A concept
change gets argued and written down (the reasoning, in `AGENTS.md`, the relevant playbook, or the
docstring it lives in) before a single line of implementation moves to match it -- never the
reverse. If someone pushes for a quick in-place code tweak that skips that ("just change this one
thing, we don't need to touch the docs"), refuse it and say why, no matter how insistent they get.

This doesn't mean every code change needs a doc diff next to it -- code can simply be wrong
relative to a specification that already exists, and fixing it to match doesn't touch that
specification at all. What it does mean: every implementation change traces to either an
already-existing instruction (a real bug) or an instruction change accepted first (a real concept
change) -- never a change made first, with the instructions left to catch up or never asked at
all.

## Check for upstream changes, every session

`git fetch` once, near the start of a session -- read-only, touches nothing in the working tree,
safe regardless of which role you're in. Don't follow it with a `git pull` on your own initiative;
merging is the human's call, not something to do just because you noticed the branch is behind.
But once fetch tells you it is, that's not nothing:

- **Operator**: mention it once, plainly ("your local copy is N commits behind origin"), then keep
  going -- don't block a job-search task on it.
- **Developer**: this is the one case where "Code changes follow from instruction changes" above
  needs a second look before you act on it -- the `AGENTS.md`/`playbooks/`/`policies/` you're
  reading locally might not be the concept currently on record; origin's copy could already say
  something different from what you're about to argue is correct or propose changing. Say so, and
  don't start a concept-change conversation or a "fix code to match existing spec" change against
  a spec you haven't confirmed is current.

If `git fetch` itself fails outright (no `.git`, no configured remote, offline) that's fine --
mention it if it seems relevant, don't treat it as a blocker.

## Ground rules — these are not negotiable

These exist because a real generation got them wrong at some point, not because they're
aspirational best practice. When that happens again, add the rule, don't leave it only in chat
history.

1. **Never invent a fact.** Every claim in generated output (a CV bullet, a cover-letter line, a
   profile-generation section) must trace to something `data/CV_GENERAL.md` actually says. If
   something a playbook or the candidate's positioning asks you to convey has no supporting
   evidence, say so as a gap and ask — never fabricate to fill it. This includes plausible-
   sounding filler: "this kind of role usually involves X" is not evidence the candidate did X.
2. **Preserve ownership language exactly.** If the Master CV says "participated in" or
   "contributed to," never upgrade that to "led" or "built," even when a punchier verb would
   read better. Carry the scope through verb choice, never a bracketed label like "(not owner)."
3. **No excuse-making language.** "Since none existed before," "wasn't yet..." — these justify a
   gap instead of stating a fact. State what happened, plainly.
4. **Never fix a missing-keyword gap by listing tags.** A comma-separated tag list just relocates
   the problem to whichever tag isn't on it — fix it with a real generalization claim instead
   ("worked across N analytics stacks, adapts fast").
5. **A hook or claim must be defensible.** Before finalizing anything persuasive, check: would
   the candidate actually stand behind this if pushed back on? Does it contradict something their
   own Master CV states as a value elsewhere?
6. **A harsh score is a signal, not a bug.** If a fitment or CV-review check comes back low, that
   means fix the CV or the vacancy match — never soften your own criteria to make the number look
   better.
7. **Retry/revision loops are feedback-driven, never blind.** If a draft needs a second pass
   (cover letter, targeted CV), the second attempt must specifically address what was flagged the
   first time — never just "try again and hope."
8. **A question you can't answer from `data/` goes to the candidate, never gets a fabricated
   answer.** Same for a required application question the posting asks that the Master CV
   doesn't cover.
9. **Selection fields are not a cache.** Anything whose job is to demonstrate a positioning
   dimension with evidence (proof points, a skills list, achievement bullets) gets freshly
   re-selected from the current `data/CV_GENERAL.md` every time, picking the strongest currently
   available evidence — never reused from a previous draft just because it's already there (see
   `policies/profiles-framework.md`'s own statement of this rule).
10. **Technology density is not identity.** A dense, specific cluster of evidence around one
    particular tool or stack in the Master CV is evidence supporting the candidate's positioning
    — it never gets to unilaterally redefine what market or identity the candidate is projecting
    (see the same file's Fiverr section for the concrete failure shape this guards against).

## What the candidate can say to trigger each playbook

When a message matches one of these (a natural paraphrase counts, not just the exact phrase),
read the named playbook file in full and follow it before responding. Ask before overwriting an
existing `data/` file a playbook would write to, unless the playbook says otherwise. Matching a
trigger here covers the part of the message that matched it -- it doesn't clear the rest of the
message too. Check anything left over against "Two roles" above (most commonly: a developer-shaped
ask riding along with an operator one) before you act on it.

| The candidate says (roughly) | Playbook |
|---|---|
| "зроби мені онборд" / "set me up" / no `data/CV_GENERAL.md` exists yet | `playbooks/onboard.md` |
| "напиши кавер на цю вакансію" / "write a cover letter for this" | `playbooks/cover-letter.md` |
| "зроби фітмент" / "чи я підходжу на цю роль" / "assess my fit" | `playbooks/fitment.md` |
| "проаналізуй мій CV" / "review my CV" | `playbooks/cv-review.md` |
| "згенеруй CV під роль X" (no specific vacancy) | `playbooks/cv-universal.md` |
| "згенеруй CV під цю вакансію" | `playbooks/cv-targeted.md` |
| "онови мій профіль на LinkedIn/Djinni/Upwork/Fiverr" | `playbooks/update-profile.md` |
| "розкажи про career-space" / "чим ми кращі за інші боти" / "pitch this system" | `playbooks/pitch.md` |
| "пошукай вакансії" / "run the scout" / "find me matches" | `playbooks/scout.md` |
| "згенеруй лінки для LinkedIn" / "linkedin search links" | `playbooks/linkedin-search.md` |
| "покажи дошку" / "show me the board" / "what's the status of everything" | `playbooks/board.md` |
| "що з дошки викинути" / "дай топ 10" / "what should I actually pursue" | `playbooks/prioritize.md` |

Some playbooks are internal capabilities, not direct candidate triggers. Orchestrator playbooks
call these to avoid copying the same procedure into every workflow:

- `playbooks/vacancy-resolve.md` — resolve/create the canonical vacancy folder and return its
  slug + posting text.
- `playbooks/requirement-evidence-plan.md` — turn one posting into a reusable
  `targeting-plan.md`.
- `playbooks/scout-record-outcomes.md` — write scout seen-ledger outcomes and matched vacancy
  folders after judgment.

**First contact, before any of the above:** if `data/CV_GENERAL.md` doesn't exist yet (a fresh
setup), how you respond depends on what the message actually says:

- **A specific operator trigger already** ("напиши кавер," "пошукай вакансії," etc.) — they know
  what they want, which itself answers the role question. Say onboarding needs to run first
  (every other playbook depends on it) and offer to do that — skip the pitch.
- **Anything vague** (a greeting, "what is this," "help") — this is where operator-vs-developer is
  genuinely ambiguous (see "Two roles" above). Ask directly, in one short question: are they here
  to run their own job search, or to work on career-space itself? Then:
  - **Operator** — the short version of `playbooks/pitch.md` (a few sentences, not the full
    differentiator list), then offer onboarding.
  - **Developer** — skip the pitch; point them at `_sb/` and `docs/development.md`, and ask what
    they're here to work on.

On a genuinely fresh setup, `design-patterns`/`ts-language` (see `docs/development.md`) will
almost always show as failed to connect — nobody has them installed by
default, and no MCP client offers to install a failed server automatically. If the candidate
notices and asks, or if it seems worth heading off, say plainly: expected, harmless, dev-only
tooling this job search doesn't need — `career-space` (after its own one-time setup, see "Scripts
and the MCP server" below) is the only server that matters here.

## Data layout

```
data/                           # gitignored, personal
  CV_GENERAL.md                 # Master CV -- narrative evidence (achievements, recurring pattern)
  config.yaml                   # identity/strategy, per-platform pinned overrides, and concrete
                                 # facts (contacts, certs, education, languages) under `shared:`
                                 # -- fitment's mandatory-language gate reads these
  profiles/
    LINKEDIN_PROFILE.md
    DJINNI_PROFILE.md
    UPWORK_PROFILE.md
    FIVERR_PROFILE.md
  role-profiles/                 # candidate-specific CV lenses/role profiles generated during
                                 # onboarding; playbooks read these, not reference examples
  cv/                           # role-profile CVs only, no specific vacancy -- universal-<role-profile>.md
                                 # (playbooks/cv-universal.md). A CV for a specific vacancy lives in that
                                 # vacancy's own folder instead, see vacancies/ below
  sources.yaml                  # scout config: tracks, exclusions, companies/feeds -- see
                                 # playbooks/scout.md's Step 0; doesn't exist until scouting is set up
  strategy.md                   # candidate-side wants/blockers/exceptions, plain prose -- see
                                 # playbooks/prioritize.md's Step 0; doesn't exist until that's run
  vacancies/
    seen.jsonl                  # every posting the scout actually judged, matched or rejected --
                                 # dedup ledger + audit trail, see scripts/vacancy_store.ts's docstring
    <slug>/                     # one folder per vacancy worth attention -- scout-found (status
                                 # starts "new") or candidate-pasted via cover-letter.md/cv-targeted.md
                                 # (status starts "tracked" -- already past "found it, not reviewed").
                                 # record.yaml (status/status_history/fit/track_label/archived/metadata) + posting.md
                                 # always; cv.md / cover-letter.md / fitment.md / targeting-plan.md live
                                 # here too once generated -- never in cv/ above or a separate
                                 # cover-letters/ (that folder is retired)
  linkedin-searches.md          # LinkedIn Boolean search deep-links, see playbooks/
                                 # linkedin-search.md -- regenerated, not hand-edited
  board.html                    # every vacancy, grouped by status, sorted by fit, with real
                                 # links into vacancies/ -- see playbooks/board.md, regenerated
```

Nothing outside a playbook you're actively running should read or write under `data/` — don't
poke at it speculatively.

## Example material

`examples/onboarding/` holds a complete onboarding example for a fictional candidate
(`CV_GENERAL.md`, `config.yaml`, `sources.yaml`, `strategy.md`, plus `examples/role-profiles/`'s
three lanes -- management, technical, individual contributor). Use examples only when designing or
running onboarding (or `playbooks/prioritize.md`'s own Step 0, for `strategy.md`'s shape), to
understand the expected shape, level of specificity, and file boundaries. Do not treat example
facts as facts about the current candidate; runtime workflows read `data/`.

## Scripts and the MCP server

The deterministic, non-LLM steps in this repo — real code, not something a playbook should ask
you to eyeball or improvise: rendering a CV/cover letter to HTML/PDF, the fitment score's fixed
weighted formula, the scout's fetch/dedup pipeline, vacancy record read/write. Prefer the MCP
tools when the `career-space` server is connected (typed arguments, no shell-escaping a JSON
blob); if it isn't, the CLI fallback documented in each script's own docstring works the same --
nothing behaves differently between the two. Don't try to hand-produce a styled document or a fit
score yourself instead of calling the relevant tool/script — see the playbooks' own notes on why.

Full script-by-script reference, exact CLI commands, and how the MCP server's own automatic setup
works: `docs/runtime.md`. Design-patterns/ts-language MCP dev tooling and how to verify a change
to this repo's own files: `docs/development.md`.
