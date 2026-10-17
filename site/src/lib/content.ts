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
	'The rules the agent follows exist because a real generation once got them wrong: never invent a fact, keep the exact ownership language, treat a harsh score as a signal and not a bug. They are written into the repository, so a fresh agent with no chat history starts from the same rules.'
];

export const demoNote =
	'One search, start to finish. Real output from the tools, on a fictional candidate and fictional postings.';

export const boardAlt =
	'The career-space vacancy board: vacancies grouped by status (interview, screen, tracked), each with a fit score, a fit label and file badges for fitment, posting, correspondence, CV, cover letter and interview prep.';

export const moreNote =
	'That is the short list. The agent can take you further itself: interview prep, reconciling statuses with your inbox, keeping recruiter correspondence. Just ask:';

export const askMore = ['What else can you do?', 'Where are we, and what did we miss?'];

export type Artifact = 'profile' | 'fit' | 'board';

export interface WalkStep {
	text: string;
	artifact?: Artifact;
}

export const walkthrough: WalkStep[] = [
	{ text: 'You give it your CV or a LinkedIn export.' },
	{
		text: 'You talk through the role you want. Not sure yet? That is a valid answer, and it is kept as an open question.'
	},
	{
		text: 'It writes down your positioning and strategy, then projects them onto your profiles: LinkedIn, Djinni, Upwork, a portfolio.',
		artifact: 'profile'
	},
	{ text: 'The scout collects vacancies from job boards and company ATS pages.' },
	{
		text: 'Each vacancy is compared with what your experience actually shows. Gaps are stated plainly, and the score helps you decide what to apply to first.',
		artifact: 'fit'
	},
	{ text: 'For the ones you pick: a tailored CV and cover letter.' },
	{
		text: 'When replies, rejections and calls come in, ask it to log them or to reconcile the board with your inbox. Vacancies and client orders, fractional and part-time work, all sit on one board.',
		artifact: 'board'
	}
];

export interface Point {
	title: string;
	text: string;
}

export const chatPoints: Point[] = [
	{
		title: 'Starts with you, not the feed',
		text: 'Direction and positioning come first; vacancies are judged against them.'
	},
	{
		title: 'Rules against invented facts',
		text: 'Written rules and a self-check pass guard against invented facts and inflated ownership: “contributed to” must not become “led”. They lower the risk, they do not remove it.'
	},
	{
		title: 'Context that survives',
		text: 'Facts, strategy and decisions live in files, not in a chat that scrolls away.'
	}
];

export const agentSwitch = {
	title: 'Switch agents without retelling your career',
	text: 'The context belongs to the workspace, not to one agent. Start in one, continue in another; the next one reads the same files and rules.',
	example: ['Cursor: set up and onboarding', 'Claude Code: a tailored CV', 'Codex: update the board']
};

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
		text: 'The kanban board and the history of communication. Log a reply or reconcile with your inbox, and the status change keeps its reason and the messages stay next to it.'
	}
];

export const limits = [
	'career-space ships no tool that submits applications or fills forms. An agent with its own browser tools may be able to; that is the agent’s capability, not something career-space provides or controls.',
	'Scouting reads public APIs only: no login-walled boards, no scraping behind a sign-in.',
	'There is no background scheduler. A scout run happens when you ask for one.',
	'It needs a coding agent already running. It is not a standalone app.',
	'It is not tuned for the largest possible pile of postings. A few good sources are the point.',
	'It is built on language models, which still get things wrong. The rules and checks lower the risk; read what it writes before you send it.'
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
		name: 'A plain chat with a model',
		startsFrom: 'Whatever you paste',
		good: 'Zero setup. Fine for a one-off question.',
		differs:
			'Facts, rules and past decisions live in the repo, so each session and each agent starts from the same state. The same evidence gives the same fit score, because the formula is fixed.'
	},
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
			'Documents are generated from one evidence file under rules against invented facts and inflated ownership. Passing an ATS score is not the goal.'
	},
	{
		name: 'Trackers: sheets, Notion, kanban apps',
		startsFrom: 'The list of applications',
		good: 'Flexible, no setup, easy to share.',
		differs:
			'The board is rendered from per-opportunity records that keep status history and the observed reason, and statuses are reconciled from email instead of retyped.'
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
		{ label: 'What you get', href: '#what' },
		{ label: 'Why', href: '#why' },
		{ label: 'How', href: '#how' },
		{ label: 'Get started', href: '#start' },
		{ label: 'Compare', href: '#compare' }
	],
	github: 'GitHub',
	hero: {
		title: 'A job search you run by talking to your coding agent.',
		lead: 'A personal career consultant that lives in your coding agent. It helps you understand your direction, finds and judges vacancies, and keeps the whole search in one place. No separate app, server or account.',
		pillars: ['Understand your direction', 'Find relevant opportunities', 'Manage the entire search'],
		primary: 'View on GitHub',
		secondary: 'Get started'
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
		what: 'What you get',
		why: 'Why it exists',
		chat: {
			title: 'Why not just ask a chat model?',
			intro: 'A chat helps with one task. career-space keeps a whole system, where each task starts from the results of the earlier ones.'
		},
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
