// Fictional candidate throughout (Alex Morgan, from examples/). Nothing here is real data.
// - fit: real output of scripts/score_fit.js on a fictional posting
// - linkedin, upwork: the shipped examples in examples/surfaces/
// - storyDialog, consultDialog: illustrative conversations, written to match the example
//   candidate's files and the rules in AGENTS.md; labelled as illustrative on the page

export interface FitItem {
	tag?: string;
	text: string;
}

export interface FitGroup {
	title: string;
	items: FitItem[];
}

export const fit = {
	role: 'Senior Backend Engineer',
	company: 'Brightloop (fictional)',
	score: 8,
	category: 'stretch fit',
	tagline: 'worth trying, gaps need honest framing',
	summary:
		'Python and Postgres on a payments-adjacent API, own services end to end, remote in the EU.',
	eligibility: 'open remote — Remote across the EU; Berlin-based candidate.',
	groups: [
		{
			title: 'Minor gaps',
			items: [{ text: 'No streaming system anywhere in the CV.' }]
		},
		{
			title: 'Transferable / partial overlap',
			items: [
				{ text: 'Two services, inside a team split that others led.' },
				{ tag: 'nice-to-have', text: 'One mentee, informal.' }
			]
		},
		{
			title: 'Strong overlap',
			items: [
				{
					tag: 'critical requirement',
					text: 'About seven years on a billing platform, including a reporting endpoint fixed from several seconds to under one.'
				},
				{
					tag: 'critical requirement',
					text: 'Same shape of work, with a measured effect on dropped payments.'
				}
			]
		}
	] as FitGroup[],
	risk: 'Kafka is a named requirement with no evidence behind it; expect it to come up early.',
	appeal: 'The integrations and Postgres work match the core of the role almost line for line.'
};

export interface Profile {
	label: string;
	name: string;
	headline: string;
	paragraphs: string[];
}

export const linkedin: Profile = {
	label: 'LinkedIn',
	name: 'Alex Morgan',
	headline: 'Senior Backend Engineer / Python · TypeScript · PostgreSQL / Berlin & Remote (EU)',
	paragraphs: [
		'Most of what I do is take a backend ticket from vague to shipped, without needing much hand-holding along the way. About seven years of it, mostly working inside codebases and team processes that already exist rather than starting things from scratch.',
		'Day to day that means implementing features on shared APIs without breaking the clients that depend on them, integrating third-party services, tracking down performance problems, taking part in migrations, reviewing pull requests, and getting delayed work across the line.'
	]
};

export const upwork: Profile = {
	label: 'Upwork',
	name: 'Alex Morgan',
	headline: 'Backend Developer — Python / PostgreSQL / API work, available for bounded projects',
	paragraphs: [
		'What I take on: one clearly-defined piece of backend work at a time — an integration, a performance problem, a service to extract, features to add to an API that other things already depend on.',
		'If failed payments or webhook events are silently getting dropped: I’ve integrated third-party payment providers with webhook-based reconciliation and automatic retries, taking a recurring “payment lost, customer complains” problem down to near zero.'
	]
};

export interface Turn {
	who: 'you' | 'agent';
	text: string;
	items?: string[];
}

export const storyDialog: Turn[] = [
	{ who: 'you', text: 'Here is my CV and an old LinkedIn export. I am not sure where I want to go next.' },
	{
		who: 'agent',
		text: 'I have read both. One thing a CV cannot tell me: the payment-provider integrations. Did you design them, or implement a design someone else made?'
	},
	{ who: 'you', text: 'Design and implementation. A colleague reviewed it.' },
	{
		who: 'agent',
		text: 'Then I will write “designed and built”, not “contributed to”. And “close to zero” dropped payments: what was the starting point?'
	},
	{ who: 'you', text: 'A handful of support tickets most months before. Almost none now.' },
	{
		who: 'agent',
		text: 'Noted, with that baseline. Last one: across your jobs, what do people keep pulling you into?'
	}
];

export const consultDialog: Turn[] = [
	{ who: 'you', text: 'Which other roles should I apply for with my profile?' },
	{
		who: 'agent',
		text: 'From your CV and your strategy notes:',
		items: [
			'Senior Backend or Integrations Engineer: your strongest evidence, the payment integrations.',
			'Platform-leaning backend: a credible stretch, but there is no on-call or SRE work to point at.',
			'Tech Lead: a small stretch. Frame it as technical direction in a scoped area, not running a team.',
			'Not worth chasing: Engineering Manager. You decided against it.'
		]
	}
];
