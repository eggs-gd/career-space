# career-space

A job-search workspace you run by talking to a coding agent — Claude Code, Codex CLI, Gemini
CLI, Cursor, or anything similar. There's no server, no app, no account. Open this folder in your
agent of choice and just say what you want in plain language.

If you're an agent reading this file: this README is for the human. Your own instructions are in
`AGENTS.md` — read that instead, it's the canonical one.

## Get started

Open this repo in any of the agents above and say anything — even just "hi" or "set me up." It
explains itself and walks you through onboarding: point it at an existing resume or LinkedIn
export, answer a few questions a resume doesn't usually cover, and you're set up.

From then on, just say what you want in your own words — write a cover letter, check your fit for
a posting, generate a CV tailored to it, define or update how you show up on LinkedIn, a freelance
marketplace, a portfolio or personal site, search job boards automatically, or see your whole
pipeline on one page. The agent explains what it can do and how, as you go — nothing here needs
memorizing up front.

Career Space starts with you, not the job feed. It helps you work out where you're going, how you
want the market to understand you, and carries that positioning through public surfaces,
opportunities, applications, and market feedback.

It is deliberately not optimized for collecting the largest possible number of jobs. Opportunity
discovery is one downstream part of managing your career direction, not the product's center.

The job-board/ATS scraping approach was inspired by
[jobhunt-agent](https://github.com/teslavr/jobhunt-agent)

## Your data stays yours

Everything you tell it lives under `data/`, which is gitignored — it never gets committed, even
by accident. Back that folder up however you'd back up any personal document (a private git
remote, a synced folder, whatever you already use); just don't push it to this repo's own
(public-safe) remote.

## If something feels off

The agent's own rules (never invent a fact, preserve your exact ownership language, a harsh
fitment/CV score is a signal, not a bug, ...) exist because a real generation once got them
wrong — they're not aspirational. If its output contradicts one of them, say so directly; that's
a bug in how it followed its own instructions, not a matter of taste.

---

## Contributing

I've open-sourced things before, but not with this rule: every change here gets made by an agent
reading `AGENTS.md`, never hand-written. That's an actual experiment, not a slogan.

Want to extend or work on career-space itself, not just use it? Tell your agent directly — it can
operate as either an **operator** (helps run a job search) or a **developer** (helps build
career-space itself); see `AGENTS.md` for how that split works. Doing both? Use two separate
conversations, not one — mixing the two means the agent keeps guessing which rules apply to your
next message.

PRs are welcome where they make sense, but the change itself should come from your agent reading
`AGENTS.md`, not a hand-edited diff. A manual patch isn't a fallback — it's evidence the
instructions didn't get a fresh agent to the right behavior on their own, which is itself the bug
to fix (in `AGENTS.md`/`playbooks/`, not just the code) — tell me, don't just quietly patch it and
move on.

Having an idea isn't the same as being ready to code it, either. Developer mode isn't a shortcut
from "I want X" straight to a diff — if the current instructions don't already call for your
change, the agent is supposed to stop and say so: you're proposing to change the concept, not
reporting a bug. That gets agreed on and written into `AGENTS.md`/the relevant playbook first;
implementation follows. If your agent pushes back like that, that's the contract working, not it
being difficult.
