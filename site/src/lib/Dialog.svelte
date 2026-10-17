<script lang="ts">
	import type { Turn } from '#lib/demo.ts';

	let { turns, caption }: { turns: Turn[]; caption: string } = $props();
</script>

<figure class="dialog">
	<ol>
		{#each turns as turn}
			<li class={turn.who}>
				<span class="who">{turn.who === 'you' ? 'You' : 'Agent'}</span>
				<div class="text">
					<p>{turn.text}</p>
					{#if turn.items}
						<ul>
							{#each turn.items as item}
								<li>{item}</li>
							{/each}
						</ul>
					{/if}
				</div>
			</li>
		{/each}
	</ol>
	<figcaption>{caption}</figcaption>
</figure>

<style>
	.dialog {
		margin: 0;
		padding: 1.25rem 1.4rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-size: 0.95rem;
	}

	ol {
		display: grid;
		gap: 0.9rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	ol > li {
		display: grid;
		grid-template-columns: 3.6rem minmax(0, 1fr);
		gap: 0.75rem;
	}

	.who {
		padding-top: 0.15rem;
		color: var(--muted);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.agent .who {
		color: var(--accent);
	}

	.you .text {
		color: var(--muted);
	}

	ul {
		display: grid;
		gap: 0.45rem;
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
	}

	ul li {
		display: list-item;
	}

	figcaption {
		margin-top: 1rem;
		color: var(--muted);
		font-size: 0.82rem;
	}
</style>
