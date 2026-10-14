<script lang="ts">
	import CompareRow from '#lib/CompareRow.svelte';
	import CopyBlock from '#lib/CopyBlock.svelte';
	import {
		REPO_URL,
		SITE_URL,
		alternatives,
		capabilities,
		agentPrompt,
		agentSteps,
		cloneCommand,
		forAgents,
		compareNote,
		flow,
		limits,
		moreNote,
		askMore,
		origin,
		sayThis
	} from '#lib/content.ts';

	const title = 'career-space: a job-search workspace for your coding agent';
	const description =
		'A personal career consultant inside Claude Code, Codex, Gemini CLI or Cursor: positioning and strategy, tailored CVs and cover letters, public profiles, and a scout that collects vacancies from job boards. Your data stays local.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={SITE_URL} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={SITE_URL} />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>

<header class="top">
	<div class="wrap bar">
		<a class="brand" href="/">career-space</a>
		<nav aria-label="Sections">
			<a href="#why">Why</a>
			<a href="#what">What it does</a>
			<a href="#how">How</a>
			<a href="#compare">Compare</a>
			<a class="gh" href={REPO_URL}>GitHub</a>
		</nav>
	</div>
</header>

<main id="main">
	<section class="hero wrap">
		<h1>A job search you run by talking to your coding agent.</h1>
		<p class="lead">
			career-space is a personal career consultant that lives in your coding agent. It helps you work out your
			professional positioning and strategy, turns them into a CV, cover letters and public profiles, and runs a scout
			that collects vacancies from job boards and company ATS pages and judges each one against you. No server, no app,
			no account.
		</p>
		<div class="actions">
			<a class="button primary" href={REPO_URL}>View on GitHub</a>
			<a class="button" href="#why">Why it exists</a>
		</div>

		<div class="start">
			<h2 class="eyebrow">Get started</h2>
			<div class="paths">
				<div class="path featured">
					<h3>Hand it to your agent</h3>
					<p>
						Paste this into Claude Code, Codex CLI, Gemini CLI or Cursor. The agent reads this page and sets everything up
						by itself, then pulls you into the conversation.
					</p>
					<CopyBlock text={agentPrompt} label="Copy the prompt for your agent" />
					<p class="small">It needs an agent that can run shell commands. It:</p>
					<ol class="steps">
						{#each agentSteps as step}
							<li>{step}</li>
						{/each}
					</ol>
				</div>
				<div class="path">
					<h3>Or do it yourself</h3>
					<p>Clone it, open the folder in your agent and say anything. It explains itself and walks you through setup.</p>
					<CopyBlock text={cloneCommand} label="Copy the clone commands" />
					<p class="small">Needs Node 18.17 or newer for the bundled MCP server; it installs itself on first use.</p>
				</div>
			</div>
			<p class="small agents">{forAgents}</p>
		</div>

		<div class="say">
			<h2 class="eyebrow">Then, in plain language</h2>
			<ul class="pills">
				{#each sayThis as phrase}
					<li><q>{phrase}</q></li>
				{/each}
			</ul>
			<p class="small">Close paraphrases work. There is no syntax to memorize.</p>
		</div>
	</section>

	<section id="why" class="section wrap">
		<h2>Why it exists</h2>
		<div class="prose">
			{#each origin as paragraph}
				<p>{paragraph}</p>
			{/each}
		</div>
	</section>

	<section id="what" class="section wrap">
		<h2>What it does</h2>
		<ol class="cards">
			{#each capabilities as item, index (item.title)}
				<li>
					<span class="num">{String(index + 1).padStart(2, '0')}</span>
					<h3>{item.title}</h3>
					<p>{item.text}</p>
				</li>
			{/each}
		</ol>
		<div class="more">
			<p>{moreNote}</p>
			<ul class="pills">
				{#each askMore as phrase}
					<li><q>{phrase}</q></li>
				{/each}
			</ul>
		</div>
	</section>

	<section id="how" class="section wrap">
		<h2>How it works</h2>
		<p class="intro">Each level sets the frame for the next, from the ten-year direction down to the daily pipeline.</p>
		<ol class="flow">
			{#each flow as step, index (step.title)}
				<li>
					<span class="num">{index + 1}{#if step.meta}<span class="meta">&nbsp;· {step.meta}</span>{/if}</span>
					<h3>{step.title}</h3>
					<p>{step.text}</p>
				</li>
			{/each}
		</ol>
	</section>

	<section id="limits" class="section wrap">
		<h2>What it deliberately does not do</h2>
		<ul class="limits">
			{#each limits as line}
				<li>{line}</li>
			{/each}
		</ul>
	</section>

	<section id="compare" class="section wrap">
		<h2>Compared with the alternatives</h2>
		<p class="intro">
			Most of these start from a different place: the feed, the form, the document. Scroll through them, or use the
			arrows.
		</p>
		<CompareRow items={alternatives} />
		<p class="small note">{compareNote}</p>
	</section>
</main>

<footer class="foot">
	<div class="wrap">
		<p>
			career-space is open source under Apache-2.0. Source, issues and the contribution rules:
			<a href={REPO_URL}>{REPO_URL}</a>
		</p>
	</div>
</footer>

<style>
	.wrap {
		width: 100%;
		max-width: var(--wide);
		margin-inline: auto;
		padding-inline: var(--gutter);
	}

	.top {
		border-bottom: 1px solid var(--border);
	}

	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
		min-height: 3.5rem;
		padding-block: 0.5rem;
	}

	.brand {
		font-family: var(--font-mono);
		font-weight: 600;
		text-decoration: none;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.25rem;
		font-size: 0.95rem;
	}

	nav a {
		display: inline-flex;
		align-items: center;
		min-height: 2.25rem;
		color: var(--muted);
		text-decoration: none;
	}

	nav a:hover,
	nav a.gh {
		color: var(--text);
	}

	.hero {
		padding-block: clamp(3rem, 8vw, 6rem) clamp(2.5rem, 6vw, 4.5rem);
	}

	h1 {
		max-width: 20ch;
		font-size: clamp(2.1rem, 5.4vw, 3.6rem);
		letter-spacing: -0.025em;
	}

	.lead {
		max-width: var(--measure);
		margin-top: 1.25rem;
		color: var(--muted);
		font-size: 1.15rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.75rem;
	}

	.button {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0 1.1rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface);
		color: var(--text);
		font-weight: 500;
		text-decoration: none;
		transition: border-color 0.15s ease;
	}

	.button:hover {
		border-color: var(--accent);
	}

	.button.primary {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--accent-ink);
	}

	.start {
		margin-top: clamp(2.5rem, 6vw, 4rem);
	}

	.paths {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.path {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 1.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.path.featured {
		border-color: var(--accent);
	}

	.path h3 {
		font-size: 1.1rem;
	}

	.path .small {
		margin: 0;
	}

	.steps {
		display: grid;
		gap: 0.3rem;
		margin: 0;
		padding-left: 1.3rem;
		font-size: 0.95rem;
	}

	.agents {
		max-width: 52rem;
		margin-top: 1rem;
	}

	.say {
		margin-top: 2.25rem;
	}

	.say ul {
		margin: 0.9rem 0 0.75rem;
	}

	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		padding: 0;
		list-style: none;
	}

	.pills li,
	.say li {
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		font-size: 0.95rem;
	}

	q {
		quotes: none;
	}

	.eyebrow {
		margin-bottom: 0.5rem;
		color: var(--accent);
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.small {
		margin-top: 0.5rem;
		color: var(--muted);
		font-size: 0.9rem;
	}

	.section {
		padding-block: clamp(2.5rem, 6vw, 4.5rem);
		border-top: 1px solid var(--border);
	}

	.section > h2 {
		font-size: clamp(1.6rem, 3.4vw, 2.1rem);
	}

	.intro {
		max-width: var(--measure);
		margin-top: 0.75rem;
		color: var(--muted);
	}

	.prose {
		display: grid;
		gap: 1.1rem;
		max-width: var(--measure);
		margin-top: 1.25rem;
	}

	.cards,
	.flow {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		margin: 1.75rem 0 0;
		padding: 0;
		list-style: none;
	}

	.cards li,
	.flow li {
		padding: 1.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.cards h3,
	.flow h3 {
		margin-top: 0.5rem;
		font-size: 1.05rem;
	}

	.cards p,
	.flow p {
		margin-top: 0.4rem;
		color: var(--muted);
		font-size: 0.95rem;
	}

	.meta {
		color: var(--muted);
		font-weight: 500;
	}

	.num {
		color: var(--accent);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.limits {
		display: grid;
		gap: 0.6rem;
		max-width: var(--measure);
		margin: 1.25rem 0 0;
		padding: 0;
		list-style: none;
	}

	.limits li {
		position: relative;
		padding-left: 1.4rem;
	}

	.limits li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.7em;
		width: 0.7rem;
		height: 2px;
		background: var(--muted);
	}

	.note {
		max-width: var(--measure);
	}

	.more {
		max-width: var(--measure);
		margin-top: 1.75rem;
		color: var(--muted);
	}

	.more .pills {
		margin: 0.75rem 0 0;
		color: var(--text);
	}

	.section :global(.row) {
		margin-top: 1.5rem;
	}

	.foot {
		padding-block: 2rem 3rem;
		border-top: 1px solid var(--border);
		color: var(--muted);
		font-size: 0.95rem;
	}

	@media (min-width: 48rem) {
		.paths {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.cards {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.flow {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}
</style>
