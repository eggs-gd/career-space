<script lang="ts">
	import CompareRow from '#lib/CompareRow.svelte';
	import CopyBlock from '#lib/CopyBlock.svelte';
	import FitCard from '#lib/FitCard.svelte';
	import ProfileCard from '#lib/ProfileCard.svelte';
	import {
		REPO_URL,
		SITE_URL,
		agentPrompt,
		agentSteps,
		agentSwitch,
		alternatives,
		askMore,
		boardAlt,
		chatPoints,
		cloneCommand,
		compareNote,
		copy,
		demoNote,
		flow,
		forAgents,
		walkthrough,
		limits,
		meta,
		moreNote,
		origin,
		sayThis
	} from '#lib/content.ts';
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={SITE_URL} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={SITE_URL} />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<a class="skip-link" href="#main">{copy.skip}</a>

<header class="top">
	<div class="wrap bar">
		<a class="brand" href="/">{copy.brand}</a>
		<nav aria-label={copy.navLabel}>
			{#each copy.nav as item (item.href)}
				<a href={item.href}>{item.label}</a>
			{/each}
			<a class="gh" href={REPO_URL}>{copy.github}</a>
		</nav>
	</div>
</header>

<main id="main">
	<section class="hero wrap">
		<h1>{copy.hero.title}</h1>
		<p class="lead">{copy.hero.lead}</p>
		<ul class="pillars">
			{#each copy.hero.pillars as pillar}
				<li>{pillar}</li>
			{/each}
		</ul>
		<div class="actions">
			<a class="button primary" href={REPO_URL}>{copy.hero.primary}</a>
			<a class="button" href="#start">{copy.hero.secondary}</a>
		</div>
	</section>

	<section id="what" class="section wrap">
		<h2>{copy.sections.what}</h2>
		<p class="intro">{demoNote}</p>
		<ol class="walk">
			{#each walkthrough as step}
				<li>
					<p>{step.text}</p>
					{#if step.artifact === 'profile'}
						<div class="artifact narrow"><ProfileCard /></div>
					{:else if step.artifact === 'fit'}
						<div class="artifact narrow"><FitCard /></div>
					{:else if step.artifact === 'board'}
						<div class="artifact">
							<img
								src="/demo/board.webp"
								alt={boardAlt}
								width="1770"
								height="1200"
								loading="lazy"
								decoding="async"
							/>
						</div>
					{/if}
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

	<section id="chat" class="section wrap">
		<h2>{copy.sections.chat.title}</h2>
		<p class="intro">{copy.sections.chat.intro}</p>
		<ul class="points">
			{#each chatPoints as point (point.title)}
				<li>
					<h3>{point.title}</h3>
					<p>{point.text}</p>
				</li>
			{/each}
		</ul>

		<div class="switch">
			<h3>{agentSwitch.title}</h3>
			<p>{agentSwitch.text}</p>
			<p class="small">For example:</p>
			<ul class="pills">
				{#each agentSwitch.example as line}
					<li>{line}</li>
				{/each}
			</ul>
		</div>
	</section>

	<section id="why" class="section wrap">
		<h2>{copy.sections.why}</h2>
		<div class="prose">
			{#each origin as paragraph}
				<p>{paragraph}</p>
			{/each}
		</div>
	</section>

	<section id="how" class="section wrap">
		<h2>{copy.sections.how.title}</h2>
		<p class="intro">{copy.sections.how.intro}</p>
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

	<section id="start" class="section wrap">
		<h2>{copy.start.heading}</h2>
		<div class="paths">
			<div class="path featured">
				<h3>{copy.start.agent.title}</h3>
				<p>{copy.start.agent.text}</p>
				<CopyBlock text={agentPrompt} label={copy.start.agent.copyLabel} />
				<p class="small">{copy.start.agent.stepsIntro}</p>
				<ol class="steps">
					{#each agentSteps as step}
						<li>{step}</li>
					{/each}
				</ol>
			</div>
			<div class="path">
				<h3>{copy.start.manual.title}</h3>
				<p>{copy.start.manual.text}</p>
				<CopyBlock text={cloneCommand} label={copy.start.manual.copyLabel} />
				<p class="small">{copy.start.manual.node}</p>
			</div>
		</div>
		<p class="small agents">{forAgents}</p>

		<div class="say">
			<h3 class="eyebrow">{copy.say.heading}</h3>
			<ul class="pills">
				{#each sayThis as phrase}
					<li><q>{phrase}</q></li>
				{/each}
			</ul>
			<p class="small">{copy.say.note}</p>
		</div>
	</section>

	<section id="limits" class="section wrap">
		<h2>{copy.sections.limits}</h2>
		<ul class="limits">
			{#each limits as line}
				<li>{line}</li>
			{/each}
		</ul>
	</section>

	<section id="compare" class="section wrap">
		<h2>{copy.sections.compare.title}</h2>
		<p class="intro">{copy.sections.compare.intro}</p>
		<CompareRow items={alternatives} />
		<p class="small note">{compareNote}</p>
	</section>
</main>

<footer class="foot">
	<div class="wrap">
		<p>
			{copy.footer.text}
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

	.paths {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		margin-top: 1.5rem;
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

	.flow {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		margin: 1.75rem 0 0;
		padding: 0;
		list-style: none;
	}

	.flow li {
		padding: 1.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.flow h3 {
		margin-top: 0.5rem;
		font-size: 1.05rem;
	}

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


	.pillars {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		margin: 1.5rem 0 0;
		padding: 0;
		list-style: none;
		font-weight: 600;
	}

	.pillars li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.pillars li::before {
		content: '';
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--accent);
	}

	.walk {
		display: grid;
		gap: 1.6rem;
		max-width: 52rem;
		margin: 2rem 0 0;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}

	.walk > li {
		position: relative;
		padding-left: 2.8rem;
		counter-increment: step;
	}

	.walk > li::before {
		content: counter(step);
		position: absolute;
		left: 0;
		top: 0.05rem;
		display: grid;
		place-items: center;
		width: 1.8rem;
		height: 1.8rem;
		border: 1px solid var(--accent);
		border-radius: 50%;
		color: var(--accent);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 600;
	}

	.artifact {
		margin-top: 1rem;
	}

	.artifact.narrow {
		max-width: 44rem;
	}

	.artifact img {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.points {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
		margin: 1.75rem 0 0;
		padding: 0;
		list-style: none;
	}

	.points h3,
	.switch h3 {
		font-size: 1.05rem;
	}

	.points p {
		margin-top: 0.4rem;
		color: var(--muted);
		font-size: 0.95rem;
	}

	.switch {
		max-width: var(--measure);
		margin-top: 2.5rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border);
	}

	.switch p {
		margin-top: 0.4rem;
	}

	.switch .pills {
		margin: 0.6rem 0 0;
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

		.points {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.flow {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}
</style>
