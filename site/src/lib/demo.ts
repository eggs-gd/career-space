// Real output of scripts/score_fit.js on a fictional posting, and a shipped example profile
// (examples/surfaces/linkedin/output.md). Candidate: Alex Morgan, fictional. Nothing here is real data.

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

export const profile = {
	name: 'Alex Morgan',
	headline: 'Senior Backend Engineer / Python · TypeScript · PostgreSQL / Berlin & Remote (EU)',
	about: [
		'Most of what I do is take a backend ticket from vague to shipped, without needing much hand-holding along the way. About seven years of it, mostly working inside codebases and team processes that already exist rather than starting things from scratch.',
		'Day to day that means implementing features on shared APIs without breaking the clients that depend on them, integrating third-party services, tracking down performance problems, taking part in migrations, reviewing pull requests, and getting delayed work across the line.'
	]
};
