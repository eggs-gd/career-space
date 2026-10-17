<script lang="ts">
	import type { Profile } from '#lib/demo.ts';

	let { profile }: { profile: Profile } = $props();
</script>

<figure class="card">
	<p class="surface">{profile.label}</p>
	<h4>{profile.name}</h4>
	<p class="headline">{profile.headline}</p>
	<div class="about">
		{#each profile.paragraphs as paragraph}
			<p>{paragraph}</p>
		{/each}
	</div>
	<figcaption>A generated {profile.label} profile, fictional candidate.</figcaption>
</figure>

<style>
	.card {
		height: 100%;
		margin: 0;
		padding: 1.25rem 1.4rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-size: 0.95rem;
	}

	.surface {
		margin-bottom: 0.6rem;
		color: var(--accent);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h4 {
		margin: 0;
		font-size: 1.1rem;
	}

	.headline {
		margin-top: 0.2rem;
		color: var(--muted);
	}

	.about {
		display: grid;
		gap: 0.8rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	figcaption {
		margin-top: 1rem;
		color: var(--muted);
		font-size: 0.82rem;
	}
</style>
