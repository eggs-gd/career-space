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
		{ label: 'Easy start', href: '#start' },
		{ label: 'Details', href: '#details' },
		{ label: 'Compare', href: '#compare' },
		{ label: 'Install yourself', href: '#manual' }
	],
	github: 'GitHub',

	hero: {
		title: 'Make more of your experience.',
		lead: 'career-space is a career consultant that lives in the AI assistant you already use. It gets to know your experience, helps you see where it can take you, presents you well in your CV and profiles, and finds jobs or freelance work that fit.',
		primary: 'Try it in two minutes',
		secondary: 'View on GitHub',
		boardCaption:
			'Where it ends up: your own board, with every vacancy scored, grouped by status, and its files one click away. Illustrative data, fictional candidate.'
	},

	flow: {
		caption:
			'You hand over your LinkedIn profile and a couple of CVs. The manager makes sense of them and gives them back improved. Meanwhile job boards send it vacancies: it drops most of them and passes only the ones that fit you.',
		manager: 'Career manager',
		profiles: 'Your profiles',
		matches: 'Your matches',
		boards: 'Job boards',
		boardNames: ['LinkedIn', 'DOU', 'JustJoin', 'Greenhouse', 'Lever', 'RemoteOK'],
		jobs: ['Head of Eng', 'Eng Manager', 'Director']
	},

	about: [
		{
			title: 'What it is',
			text: 'A career consultant you talk to in plain language. It learns your story from the CVs and notes you already have, then helps you present it and find work worth your time. Free and open source.'
		},
		{
			title: 'What it is for',
			text: 'Going from “I have a lot of experience but cannot explain it well” to a clear CV, profiles that say the same thing wherever you have them (LinkedIn, Djinni, Upwork, a portfolio, anything else), a cover letter for a specific job, and a list of jobs or orders that actually suit you.'
		},
		{
			title: 'Why it exists',
			text: 'Job sites just show you a pile of postings. The hard part is deciding what you are aiming at and saying it clearly everywhere, without an AI quietly inflating what you did. This one keeps to the facts you gave it and remembers you between conversations. Your files stay on your own computer.'
		}
	] as Point[],

	easy: {
		title: 'Easy start',
		intro: 'Give your agent the link. It sets everything up and starts the conversation.',
		steps: [
			'Open Claude Code, Codex, Gemini or Cursor. Any agent that can run shell commands will do.',
			'Paste this:',
			'Talk to it in plain language, the way you would to a consultant. It asks about your CV and goals, and it leads you from there.'
		],
		copyLabel: 'Copy the prompt for your agent',
		asksIntro: 'Not sure what comes next? Just ask:',
		asks: [
			'What should I do next to get a better result?',
			'What else can you do?',
			'Which other roles should I apply for?',
			'Where are we, and what did we miss?'
		],
		happens: 'Behind the scenes, the agent:'
	},

	details: {
		title: 'Details, if you want',
		intro: 'Everything below is optional reading: what it asks, what you get, how it fits together, and how it compares.'
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
			'Is my profile headline pointing where I want to go?',
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
				text: 'Start in Cursor, continue in Claude Code, come back through Codex or Gemini. The next one reads the same files and rules.'
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
			'A scout collects vacancies from job boards and company ATS pages, on request, and from LinkedIn job-alert emails if your agent can read your mail.',
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

	manual: {
		title: 'Install it yourself',
		text: 'Prefer to do it by hand? Clone it, open the folder in your agent and say anything. It explains itself and walks you through setup.',
		copyLabel: 'Copy the clone commands',
		sayHeading: 'Then, in plain language',
		sayNote: 'Close paraphrases work. There is no syntax to memorize.',
		limitsTitle: 'Requirements and limits',
		limits: [
			'Needs an agent that can run shell commands, and Node 22.12 or newer for the bundled MCP server, which installs itself on first use.',
			'Your data stays on your machine, in a gitignored folder. No account.',
			'Scouting reads public APIs and the job links in your own alert emails: no login-walled boards. It runs when you ask for it.',
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
