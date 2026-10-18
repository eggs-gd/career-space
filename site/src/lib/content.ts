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

export const meta = {
	title: 'career-space: make more of your experience',
	siteName: 'career-space',
	description:
		'A personal career workspace for the AI agent you already use: explore where your experience can go, shape your positioning, produce CVs and profiles, and look for work when you are ready. Your data stays local.',
	image: `${SITE_URL}og.png`,
	imageAlt: 'career-space: Make more of your experience. A personal career workspace for the AI agent you already use.',
	imageWidth: 1200,
	imageHeight: 630
};

export const jsonLd = {
	'@context': 'https://schema.org',
	'@type': 'SoftwareApplication',
	name: 'career-space',
	url: SITE_URL,
	description: meta.description,
	applicationCategory: 'BusinessApplication',
	operatingSystem: 'Any, runs through a coding agent',
	isAccessibleForFree: true,
	license: 'https://www.apache.org/licenses/LICENSE-2.0',
	sameAs: [REPO_URL]
};

export const boardAlt =
	'The career-space vacancy board: vacancies grouped by status (interview, screen, tracked), each with a fit score, a fit label and file badges for fitment, posting, correspondence, CV, cover letter and interview prep.';

export interface Step {
	title: string;
	meta?: string;
}

export interface Point {
	title: string;
	text: string;
}

export interface Alternative {
	name: string;
	example?: string;
	startsFrom: string;
	good: string;
	differs: string;
}

export const copy = {
	skip: 'Skip to content',
	brand: 'career-space',
	navLabel: 'Sections',
	nav: [
		{ label: 'Your story', href: '#story' },
		{ label: 'Explore', href: '#explore' },
		{ label: 'Job search', href: '#search' },
		{ label: 'Compare', href: '#compare' },
		{ label: 'Get started', href: '#start' }
	],
	github: 'GitHub',

	hero: {
		title: 'Make more of your experience.',
		lead: 'Bring your CVs, notes and career history. Explore where your experience can go, shape how you present it, and turn it into CVs, profiles and job leads, with the AI agent you already use.',
		note: 'No separate app, server or account.',
		primary: 'Get started',
		secondary: 'View on GitHub'
	},

	why: {
		title: 'Why it exists',
		paragraphs: [
			'Most job-search tools start from the feed of postings and ask how many you can get through. The hard parts are elsewhere: knowing what you are aiming at, saying it consistently on LinkedIn, Djinni, Upwork and in a CV, and stopping a language model from quietly turning “contributed to” into “led”. The rules it follows are there because a real generation once got them wrong.',
			'So career-space starts with you. It is a personal career workspace that happens to be public: a folder of facts, rules and small scripts that a coding agent reads and acts on. Your data stays in a gitignored folder next to it.'
		]
	},

	story: {
		title: 'Start with your story',
		intro: 'You do not need a tidy profile first. Hand over what you have: old CVs, a LinkedIn export, cover letters, notes. It reads everything before it asks anything, then asks what a document does not say.',
		asksIntro: 'The questions that matter most:',
		asks: [
			'Did you drive this end to end, or contribute to something someone else owned?',
			'What was the state before that number, and were you accountable for the outcome?',
			'What do people keep pulling you into, across your roles?',
			'What would you take, and what would you walk away from?'
		],
		caption: 'An illustrative conversation, fictional candidate.'
	},

	explore: {
		title: 'Explore where it could take you',
		intro: 'It is not only a document generator. Talk to it the way you would to a career consultant: about roles, titles, profiles and strategy. During onboarding it also proposes role profiles at three levels: one well supported today, a credible next-level stretch, and a safer fallback.',
		asksIntro: 'Things you can simply ask:',
		asks: [
			'Which other roles should I apply for with my profile?',
			'Is my LinkedIn headline pointing where I want to go?',
			'What would I need to be credible for a Staff role?',
			'Where are we, and what did we miss?'
		],
		caption:
			'An illustrative conversation, fictional candidate. It answers from your own files, so the answer is only as good as what is in them.'
	},

	present: {
		title: 'Present yourself anywhere',
		intro: 'One professional story, several presentations. LinkedIn, Djinni, Upwork, a portfolio, a targeted CV and a cover letter each get their own audience and limits, and all start from the same facts, so they do not drift apart.',
		cvCaption:
			'A CV targeted to the Brightloop vacancy above, rendered by the tool (PDF too). Fictional candidate.',
		cvAlt:
			'A targeted CV for a fictional candidate: summary, experience with the achievements ordered for the target role, and skills.',
		honesty:
			'Rules against invented facts and inflated ownership guard every draft. They lower the risk, they do not remove it: read what it writes before you send it.'
	},

	context: {
		title: 'Your context stays yours',
		intro: 'A chat helps with one task. Here each task starts from the results of the earlier ones, because they live in files you own, not in a conversation that scrolls away.',
		points: [
			{
				title: 'Nothing to retell',
				text: 'Your history, decisions and strategy are in your folder. A new session starts from them.'
			},
			{
				title: 'Any compatible agent',
				text: 'Start in Cursor, continue in Claude Code, come back through Codex or Gemini CLI. The next one reads the same files and rules.'
			},
			{
				title: 'No extra platform',
				text: 'No subscription, no account, and no second copy of your professional profile to keep up to date.'
			}
		] as Point[],
		flowTitle: 'Each level sets the frame for the next',
		flow: [
			{ title: 'Strategy', meta: '10 years' },
			{ title: 'Positioning', meta: 'the next year' },
			{ title: 'Surfaces' },
			{ title: 'Opportunities' },
			{ title: 'Feedback' }
		] as Step[]
	},

	search: {
		title: 'And when you are ready to look for a job',
		intro: 'Job search follows from everything above rather than replacing it. The same context decides what is worth your time.',
		points: [
			'A scout collects vacancies from job boards and company ATS pages, on request.',
			'Each vacancy is compared with what your experience actually shows. Gaps are stated plainly, and the score helps you decide what to apply to first.',
			'Targeted CVs and cover letters for the ones you pick.',
			'One board for vacancies, client orders, fractional and part-time work. With an email capability connected, it can reconcile statuses against your inbox.'
		],
		submit:
			'You submit applications yourself. career-space ships no tool that fills forms or sends them; an agent with its own browser tools may be able to help, if you let it.',
		moreNote: 'There is more than this list. The agent can take you further itself, so just ask:',
		more: ['What else can you do?', 'Where are we, and what did we miss?']
	},

	compare: {
		title: 'Compared with the alternatives',
		intro: 'Three things people reach for instead. Scroll through them, or use the arrows.',
		note: 'Categories, not product reviews: individual tools vary. career-ops was read in September 2026; the rest is described in general terms. The scouting approach was inspired by jobhunt-agent.'
	},

	start: {
		title: 'Get started',
		agent: {
			title: 'Hand it to your agent',
			text: 'Paste this into Claude Code, Codex CLI, Gemini CLI or Cursor. The agent reads this page and sets everything up by itself, then pulls you into the conversation.',
			copyLabel: 'Copy the prompt for your agent',
			stepsIntro: 'It needs an agent that can run shell commands. It:'
		},
		manual: {
			title: 'Or do it yourself',
			text: 'Clone it, open the folder in your agent and say anything. It explains itself and walks you through setup.',
			copyLabel: 'Copy the clone commands'
		},
		sayHeading: 'Then, in plain language',
		sayNote: 'Close paraphrases work. There is no syntax to memorize.',
		limitsTitle: 'Requirements and limits',
		limits: [
			'Needs an agent that can run shell commands, and Node 22.12 or newer for the bundled MCP server, which installs itself on first use.',
			'Your data stays on your machine, in a gitignored folder. No account.',
			'Scouting reads public APIs only: no login-walled boards. It runs when you ask for it.',
			'It is not a standalone app and not tuned for the largest possible pile of postings.',
			'It is built on language models, which still get things wrong.'
		],
		docsLead: 'Source and documentation:',
		docs: [
			{ label: 'GitHub', href: REPO_URL },
			{ label: 'README', href: `${REPO_URL}#readme` },
			{ label: 'AGENTS.md', href: `${REPO_URL}/blob/main/AGENTS.md` }
		]
	},

	footer: {
		text: 'career-space is open source under Apache-2.0.'
	}
};

export const alternatives: Alternative[] = [
	{
		name: 'CV builders and ATS checkers',
		startsFrom: 'The document',
		good: 'Polished editors and templates, parse checks, keyword scoring.',
		differs:
			'Works with your whole career history, not one document. Drafts are generated under rules against invented facts and inflated ownership; passing an ATS score is not the goal.'
	},
	{
		name: 'AI career tools and plain chats',
		startsFrom: 'Whatever you paste',
		good: 'Zero setup. Fine for a one-off question.',
		differs:
			'Keeps shared context between sessions and between agents, so each task builds on the last. The same evidence gives the same fit score, because the formula is fixed.'
	},
	{
		name: 'Job-search automation',
		example: 'Auto-apply bots, feed pipelines such as career-ops',
		startsFrom: 'The feed or the form',
		good: 'Volume and coverage: very wide source lists, batch evaluation, submitting while you do something else.',
		differs:
			'Helps you decide where to go rather than maximizing the number of applications. Starts from your direction and carries it into every application.'
	}
];
