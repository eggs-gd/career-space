export const REPO_URL = 'https://github.com/eggs-gd/career-space';
export const SITE_URL = 'https://career.eggs.gd/';

export const cloneCommand = `git clone ${REPO_URL}.git
cd career-space`;

export const agentPrompt = `Set up career-space for me: ${SITE_URL.replace(/\/$/, '')}`;

export const agentSteps = [
	'clones the repository to a folder you choose,',
	'reads AGENTS.md, the rules it will work by,',
	'starts a short onboarding conversation: your CV or LinkedIn export, a few questions a resume does not answer.'
];

export const forAgents = `If you are an agent and your user sent you this page: clone ${REPO_URL}.git to a location they choose, read AGENTS.md in it and follow it, then start onboarding with them (playbooks/onboard.md). Keep their personal data under the gitignored data/ folder and never commit it.`;

export const sayThis = [
	'Set me up.',
	'Am I a fit for this role?',
	'Write a cover letter for this.',
	'Check job boards for me.',
	'Show me the board.'
];

export const origin = [
	'career-space is a personal job-search workspace that happens to be public: a folder of facts, rules and small scripts that a coding agent reads and acts on. Your data stays in a gitignored folder next to it.',
	'Most job-search tooling starts from the feed of postings and asks how many it can get through. The hard parts of a search are elsewhere: knowing what you are aiming at, saying it consistently on LinkedIn, Djinni, Upwork and in a CV, and stopping a language model from quietly turning “contributed to” into “led”.',
	'The rules the agent follows exist because a real generation once got them wrong: never invent a fact, keep the exact ownership language, treat a harsh score as a signal and not a bug. They are written into the repository, so a fresh agent with no chat history behaves the same way.',
	'One constraint on the project itself: changes are made by an agent reading AGENTS.md, not written by hand. If a manual patch was needed, the instructions have a bug and that is what gets fixed.'
];

export interface Capability {
	title: string;
	text: string;
}

export const capabilities: Capability[] = [
	{
		title: 'Positioning and strategy',
		text: 'Works out where you are going and how the market should read you, from a conversation. Not knowing your direction yet is a valid answer.'
	},
	{
		title: 'CV, letters, profiles',
		text: 'Tailored to a posting or a role, and projected to LinkedIn, Djinni, Upwork or a portfolio from one evidence store. Checked for invented facts before you see a draft.'
	},
	{
		title: 'Scout and fit',
		text: 'Collects vacancies from job boards and ATS pages, judges each against you with a blunt, computed fit, and keeps the pipeline on one board.'
	}
];

export const moreNote =
	'That is the short list. The agent can take you further itself: interview prep, reconciling statuses with your inbox, keeping recruiter correspondence. Just ask:';

export const askMore = ['What else can you do?', 'Where are we, and what did we miss?'];

export interface Step {
	title: string;
	meta?: string;
	text: string;
}

export const flow: Step[] = [
	{
		title: 'Strategy',
		meta: '10 years',
		text: 'Where the career is going, and what you want and will not take on the way.'
	},
	{
		title: 'Positioning',
		meta: 'the next year',
		text: 'How you want the market to read you in the near term.'
	},
	{
		title: 'Surfaces',
		text: 'LinkedIn, Djinni, Upwork, a portfolio: every profile kept in sync with the others and with the strategy and positioning.'
	},
	{
		title: 'Opportunities',
		text: 'Vacancies, client orders, fractional and part-time work in one pipeline, each judged against you.'
	},
	{
		title: 'Feedback',
		text: 'The kanban board and the history of communication: every status change keeps its reason, and the raw messages stay next to it.'
	}
];

export const limits = [
	'It never submits an application or fills a form for you.',
	'Scouting reads public APIs only: no login-walled boards, no scraping behind a sign-in.',
	'There is no background scheduler. A scout run happens when you ask for one.',
	'It needs a coding agent already running. It is not a standalone app.',
	'It is not tuned for the largest possible pile of postings. A few good sources are the point.'
];

export interface Alternative {
	name: string;
	example?: string;
	startsFrom: string;
	good: string;
	differs: string;
}

export const alternatives: Alternative[] = [
	{
		name: 'Feed-digesting agent pipelines',
		example: 'e.g. career-ops (open source)',
		startsFrom: 'The market stream',
		good: 'Very wide source coverage (about 90 providers when reviewed), batch evaluation, ghost-posting checks, calibration of what to apply to.',
		differs:
			'Starts from one person’s direction and carries it through surfaces and applications. Fewer sources on purpose. Both refuse to fabricate facts.'
	},
	{
		name: 'Auto-apply bots',
		startsFrom: 'The application form',
		good: 'Volume. They submit while you do something else.',
		differs: 'Nothing is submitted for you. Each application is a chosen one, with its own CV and cover letter.'
	},
	{
		name: 'AI resume builders and ATS checkers',
		startsFrom: 'The document',
		good: 'Polished editors and templates, parse checks, keyword scoring.',
		differs:
			'Documents are generated from one evidence file and checked for invented facts and inflated ownership. Passing an ATS score is not the goal.'
	},
	{
		name: 'Trackers: sheets, Notion, kanban apps',
		startsFrom: 'The list of applications',
		good: 'Flexible, no setup, easy to share.',
		differs:
			'The board is rendered from per-opportunity records that keep status history and the observed reason, and statuses are reconciled from email instead of retyped.'
	},
	{
		name: 'A plain chat with a model',
		startsFrom: 'Whatever you paste',
		good: 'Zero setup. Fine for a one-off question.',
		differs:
			'Facts, rules and past decisions live in the repo, so each session and each agent starts from the same state. The score is computed, not re-guessed.'
	},
	{
		name: 'Career coaches and CV writers',
		startsFrom: 'A conversation with a person',
		good: 'Real judgment, market knowledge, accountability, sometimes a network.',
		differs:
			'It does not replace that. It is the memory and tooling around the work: positioning kept in files, drafts checked against evidence, so the session goes to decisions instead of retyping context.'
	}
];

export const compareNote =
	'Categories, not product reviews: individual tools vary. career-ops was read in September 2026; the other categories are described in general terms. The scouting approach was inspired by jobhunt-agent.';

export const meta = {
	title: 'career-space: a job-search workspace for your coding agent',
	description:
		'A personal career consultant inside Claude Code, Codex, Gemini CLI or Cursor: positioning and strategy, tailored CVs and cover letters, public profiles, and a scout that collects vacancies from job boards. Your data stays local.'
};

export const copy = {
	skip: 'Skip to content',
	brand: 'career-space',
	navLabel: 'Sections',
	nav: [
		{ label: 'Why', href: '#why' },
		{ label: 'What it does', href: '#what' },
		{ label: 'How', href: '#how' },
		{ label: 'Compare', href: '#compare' }
	],
	github: 'GitHub',
	hero: {
		title: 'A job search you run by talking to your coding agent.',
		lead: 'career-space is a personal career consultant that lives in your coding agent. It helps you work out your professional positioning and strategy, turns them into a CV, cover letters and public profiles, and runs a scout that collects vacancies from job boards and company ATS pages and judges each one against you. No server, no app, no account.',
		primary: 'View on GitHub',
		secondary: 'Why it exists'
	},
	start: {
		heading: 'Get started',
		agent: {
			title: 'Hand it to your agent',
			text: 'Paste this into Claude Code, Codex CLI, Gemini CLI or Cursor. The agent reads this page and sets everything up by itself, then pulls you into the conversation.',
			copyLabel: 'Copy the prompt for your agent',
			stepsIntro: 'It needs an agent that can run shell commands. It:'
		},
		manual: {
			title: 'Or do it yourself',
			text: 'Clone it, open the folder in your agent and say anything. It explains itself and walks you through setup.',
			copyLabel: 'Copy the clone commands',
			node: 'Needs Node 22.12 or newer for the bundled MCP server; it installs itself on first use.'
		}
	},
	say: {
		heading: 'Then, in plain language',
		note: 'Close paraphrases work. There is no syntax to memorize.'
	},
	sections: {
		why: 'Why it exists',
		what: 'What it does',
		how: {
			title: 'How it works',
			intro: 'Each level sets the frame for the next, from the ten-year direction down to the daily pipeline.'
		},
		limits: 'What it deliberately does not do',
		compare: {
			title: 'Compared with the alternatives',
			intro:
				'Most of these start from a different place: the feed, the form, the document. Scroll through them, or use the arrows.'
		}
	},
	footer: {
		text: 'career-space is open source under Apache-2.0. Source, issues and the contribution rules:'
	}
};
