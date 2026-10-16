<script lang="ts">
	import { fit } from '#lib/demo.ts';
</script>

<figure class="card">
	<header>
		<p class="who">{fit.role} · {fit.company}</p>
		<p class="score">
			<span class="big">{fit.score}/10</span>
			<span class="cat">{fit.category}</span>
		</p>
		<p class="tagline">{fit.tagline}</p>
	</header>
	<p class="summary">{fit.summary}</p>
	<p class="elig"><strong>Location eligibility:</strong> {fit.eligibility}</p>

	{#each fit.groups as group (group.title)}
		<section>
			<h4>{group.title}</h4>
			<ul>
				{#each group.items as item}
					<li>{#if item.tag}<strong>{item.tag}</strong>{' — '}{/if}{item.text}</li>
				{/each}
			</ul>
		</section>
	{/each}

	<p class="verdict"><strong>Risk:</strong> {fit.risk}</p>
	<p class="verdict"><strong>Appeal:</strong> {fit.appeal}</p>

	<figcaption>Output of the fitment tool, fictional candidate and posting.</figcaption>
</figure>

<style>
	.card {
		margin: 0;
		padding: 1.25rem 1.4rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-size: 0.95rem;
	}

	.who {
		color: var(--muted);
		font-size: 0.85rem;
	}

	.score {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-top: 0.25rem;
	}

	.big {
		font-size: 1.6rem;
		font-weight: 700;
	}

	.cat {
		color: var(--accent);
		font-weight: 600;
	}

	.tagline {
		color: var(--muted);
		font-style: italic;
	}

	.summary,
	.elig {
		margin-top: 0.9rem;
	}

	section {
		margin-top: 1rem;
		padding-top: 0.9rem;
		border-top: 1px solid var(--border);
	}

	h4 {
		margin: 0 0 0.4rem;
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}

	ul {
		display: grid;
		gap: 0.4rem;
		margin: 0;
		padding-left: 1.1rem;
	}

	.verdict {
		margin-top: 0.9rem;
	}

	figcaption {
		margin-top: 1rem;
		color: var(--muted);
		font-size: 0.82rem;
	}
</style>
