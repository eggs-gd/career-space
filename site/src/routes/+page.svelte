<script lang="ts">
	import { page } from '$app/state';
	import CompareRow from '#lib/CompareRow.svelte';
	import CopyBlock from '#lib/CopyBlock.svelte';
	import Dialog from '#lib/Dialog.svelte';
	import FitCard from '#lib/FitCard.svelte';
	import ProfileCard from '#lib/ProfileCard.svelte';
	import {
		REPO_URL,
		SITE_URL,
		agentPrompt,
		agentSteps,
		alternatives,
		boardAlt,
		cloneCommand,
		copy,
		forAgents,
		jsonLd,
		meta,
		sayThis
	} from '#lib/content.ts';
	import { consultDialog, linkedin, storyDialog, upwork } from '#lib/demo.ts';
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={SITE_URL} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={meta.siteName} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:image" content={meta.image} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content={String(meta.imageWidth)} />
	<meta property="og:image:height" content={String(meta.imageHeight)} />
	<meta property="og:image:alt" content={meta.imageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={meta.image} />
	<meta name="twitter:image:alt" content={meta.imageAlt} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
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
		<p class="small">{copy.hero.note}</p>
		<div class="actions">
			<a class="button primary" href="#start">{copy.hero.primary}</a>
			<a class="button" href={REPO_URL}>{copy.hero.secondary}</a>
		</div>
	</section>

	<section id="why" class="section wrap">
		<h2>{copy.why.title}</h2>
		<div class="prose">
			{#each copy.why.paragraphs as paragraph}
				<p>{paragraph}</p>
			{/each}
		</div>
	</section>

	<section id="story" class="section wrap">
		<h2>{copy.story.title}</h2>
		<p class="intro">{copy.story.intro}</p>
		<div class="split">
			<div>
				<p class="small lead-in">{copy.story.asksIntro}</p>
				<ul class="asks">
					{#each copy.story.asks as ask}
						<li>{ask}</li>
					{/each}
				</ul>
			</div>
			<Dialog turns={storyDialog} caption={copy.story.caption} />
		</div>
	</section>

	<section id="explore" class="section wrap">
		<h2>{copy.explore.title}</h2>
		<p class="intro">{copy.explore.intro}</p>
		<p class="small lead-in">{copy.explore.asksIntro}</p>
		<ul class="pills">
			{#each copy.explore.asks as ask}
				<li><q>{ask}</q></li>
			{/each}
		</ul>
		<div class="artifact narrow">
			<Dialog turns={consultDialog} caption={copy.explore.caption} />
		</div>
	</section>

	<section id="present" class="section wrap">
		<h2>{copy.present.title}</h2>
		<p class="intro">{copy.present.intro}</p>
		<div class="pair">
			<ProfileCard profile={linkedin} />
			<ProfileCard profile={upwork} />
		</div>
		<figure class="artifact narrow cv">
			<img src="/demo/cv.webp" alt={copy.present.cvAlt} width="1290" height="1050" loading="lazy" decoding="async" />
			<figcaption class="small">{copy.present.cvCaption}</figcaption>
		</figure>
		<p class="small note">{copy.present.honesty}</p>
	</section>

	<section id="context" class="section wrap">
		<h2>{copy.context.title}</h2>
		<p class="intro">{copy.context.intro}</p>
		<ul class="points">
			{#each copy.context.points as point (point.title)}
				<li>
					<h3>{point.title}</h3>
					<p>{point.text}</p>
				</li>
			{/each}
		</ul>

		<h3 class="sub">{copy.context.flowTitle}</h3>
		<ol class="strip">
			{#each copy.context.flow as step, index (step.title)}
				<li>
					<span class="num">{index + 1}</span>
					{step.title}{#if step.meta}<span class="meta">&nbsp;· {step.meta}</span>{/if}
				</li>
			{/each}
		</ol>
	</section>

	<section id="search" class="section wrap">
		<h2>{copy.search.title}</h2>
		<p class="intro">{copy.search.intro}</p>
		<ul class="bullets">
			{#each copy.search.points as point}
				<li>{point}</li>
			{/each}
		</ul>

		<div class="artifact narrow"><FitCard /></div>
		<div class="artifact">
			<img src="/demo/board.webp" alt={boardAlt} width="1770" height="1200" loading="lazy" decoding="async" />
		</div>

		<p class="note submit">{copy.search.submit}</p>

		<div class="more">
			<p>{copy.search.moreNote}</p>
			<ul class="pills">
				{#each copy.search.more as phrase}
					<li><q>{phrase}</q></li>
				{/each}
			</ul>
		</div>
	</section>

	<section id="compare" class="section wrap">
		<h2>{copy.compare.title}</h2>
		<p class="intro">{copy.compare.intro}</p>
		<CompareRow items={alternatives} />
		<p class="small note">{copy.compare.note}</p>
	</section>

	<section id="start" class="section wrap">
		<h2>{copy.start.title}</h2>
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
			</div>
		</div>
		<p class="small agents">{forAgents}</p>

		<div class="say">
			<h3 class="eyebrow">{copy.start.sayHeading}</h3>
			<ul class="pills">
				{#each sayThis as phrase}
					<li><q>{phrase}</q></li>
				{/each}
			</ul>
			<p class="small">{copy.start.sayNote}</p>
		</div>

		<div class="reqs">
			<h3 class="eyebrow">{copy.start.limitsTitle}</h3>
			<ul class="limits">
				{#each copy.start.limits as line}
					<li>{line}</li>
				{/each}
			</ul>
			<p class="docs">
				{copy.start.docsLead}
				{#each copy.start.docs as doc, index (doc.href)}
					<a href={doc.href}>{doc.label}</a>{index < copy.start.docs.length - 1 ? ' · ' : ''}
				{/each}
			</p>
		</div>
	</section>
</main>

<footer class="foot">
	<div class="wrap">
		<p>{copy.footer.text} <a href={REPO_URL}>{REPO_URL}</a></p>
		<p class="legal">
			© 2026 earwiG Games · <a href="https://eggs.gd">eggs.gd</a> ·
			<a href="https://eggs.gd/privacy">Privacy</a>
			{#if page.data.gaId}
				·
				<button
					type="button"
					class="cookie-link"
					onclick={() => window.dispatchEvent(new Event('analytics:reopen'))}
				>
					Cookie settings
				</button>
			{/if}
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
		font-size: clamp(2.3rem, 6vw, 4rem);
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

	.small {
		margin-top: 0.5rem;
		color: var(--muted);
		font-size: 0.9rem;
	}

	.lead-in {
		margin: 0 0 0.6rem;
	}

	.intro + .lead-in {
		margin-top: 1.25rem;
	}

	.eyebrow {
		margin-bottom: 0.5rem;
		color: var(--accent);
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
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

	.split {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.75rem;
		margin-top: 1.75rem;
		align-items: start;
	}

	.asks {
		display: grid;
		gap: 0.7rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.asks li {
		position: relative;
		padding-left: 1.4rem;
	}

	.asks li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.7em;
		width: 0.7rem;
		height: 2px;
		background: var(--accent);
	}

	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.pills li {
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		font-size: 0.95rem;
	}

	q {
		quotes: none;
	}

	.artifact {
		margin-top: 1.5rem;
	}

	.artifact.narrow {
		max-width: 46rem;
	}

	.cv {
		margin-inline: 0;
	}

	.cv figcaption {
		margin-top: 0.6rem;
	}

	.artifact img {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.pair {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		margin-top: 1.75rem;
	}

	.note {
		max-width: var(--measure);
		margin-top: 1.25rem;
	}

	.points {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
		margin: 1.75rem 0 0;
		padding: 0;
		list-style: none;
	}

	.points h3 {
		font-size: 1.05rem;
	}

	.points p {
		margin-top: 0.4rem;
		color: var(--muted);
		font-size: 0.95rem;
	}

	.sub {
		margin-top: 2.5rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border);
		font-size: 1.05rem;
	}

	.strip {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 1rem 0 0;
		padding: 0;
		list-style: none;
	}

	.strip li {
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		font-size: 0.95rem;
	}

	.num {
		color: var(--accent);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.meta {
		color: var(--muted);
		font-weight: 500;
	}

	.bullets {
		display: grid;
		gap: 0.6rem;
		max-width: var(--measure);
		margin: 1.25rem 0 0;
		padding: 0;
		list-style: none;
	}

	.bullets li {
		position: relative;
		padding-left: 1.4rem;
	}

	.bullets li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.7em;
		width: 0.7rem;
		height: 2px;
		background: var(--accent);
	}

	.submit {
		color: var(--muted);
	}

	.more {
		max-width: var(--measure);
		margin-top: 1.75rem;
		color: var(--muted);
	}

	.more .pills {
		margin-top: 0.75rem;
		color: var(--text);
	}

	.section :global(.row) {
		margin-top: 1.5rem;
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

	.say,
	.reqs {
		margin-top: 2.25rem;
	}

	.say .pills {
		margin: 0.9rem 0 0.75rem;
	}

	.limits {
		display: grid;
		gap: 0.6rem;
		max-width: var(--measure);
		margin: 0.5rem 0 0;
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

	.docs {
		margin-top: 1rem;
		color: var(--muted);
	}

	.foot {
		padding-block: 2rem 3rem;
		border-top: 1px solid var(--border);
		color: var(--muted);
		font-size: 0.95rem;
	}

	.foot p {
		margin: 0;
	}

	.foot .legal {
		margin-top: 0.5rem;
		font-size: 0.85rem;
	}

	.foot .cookie-link {
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}

	@media (min-width: 48rem) {
		.split {
			grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
			gap: 2.5rem;
		}

		.pair,
		.paths {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.points {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
