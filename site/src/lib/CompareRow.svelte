<script lang="ts">
	import type { Alternative } from '#lib/content.ts';

	let { items }: { items: Alternative[] } = $props();

	let track = $state<HTMLUListElement>();
	let atStart = $state(true);
	let atEnd = $state(false);

	function update() {
		if (!track) return;
		atStart = track.scrollLeft <= 4;
		atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
	}

	function step(direction: 1 | -1) {
		if (!track) return;
		const card = track.querySelector('li');
		const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
		const distance = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		track.scrollBy({ left: direction * distance, behavior: reduced ? 'auto' : 'smooth' });
	}

	$effect(() => {
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	});
</script>

<div class="row">
	<div class="controls">
		<button type="button" onclick={() => step(-1)} disabled={atStart} aria-label="Previous alternatives">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
		</button>
		<button type="button" onclick={() => step(1)} disabled={atEnd} aria-label="Next alternatives">
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
		</button>
	</div>

	<ul
		class="track"
		bind:this={track}
		onscroll={update}
		aria-label="Alternatives to career-space"
	>
		{#each items as item (item.name)}
			<li>
				<article>
					<div class="head">
						<h3>{item.name}</h3>
						{#if item.example}<p class="example">{item.example}</p>{/if}
					</div>
					<dl>
						<div>
							<dt>Starts from</dt>
							<dd>{item.startsFrom}</dd>
						</div>
						<div>
							<dt>Good at</dt>
							<dd>{item.good}</dd>
						</div>
						<div class="differs">
							<dt>career-space</dt>
							<dd>{item.differs}</dd>
						</div>
					</dl>
				</article>
			</li>
		{/each}
	</ul>
</div>

<style>
	.row {
		position: relative;
	}

	.controls {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	button {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid var(--border);
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
		transition: border-color 0.15s ease;
	}

	button:hover:not(:disabled) {
		border-color: var(--accent);
	}

	button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	svg {
		width: 1.25rem;
		height: 1.25rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.track {
		display: flex;
		gap: 1rem;
		margin: 0 calc(var(--gutter) * -1);
		padding: 0.25rem var(--gutter) 1rem;
		list-style: none;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scroll-snap-type: x mandatory;
		scroll-padding-inline: var(--gutter);
		scrollbar-width: thin;
		scrollbar-color: var(--border) transparent;
	}

	li {
		flex: 0 0 min(21rem, 82%);
		scroll-snap-align: start;
		display: flex;
	}

	article {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		padding: 1.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	@media (min-width: 48rem) {
		.head {
			min-height: 3.6rem;
		}
	}

	h3 {
		font-size: 1.1rem;
	}

	.example {
		margin-top: 0.2rem;
		color: var(--muted);
		font-size: 0.9rem;
	}

	dl {
		display: grid;
		gap: 0.9rem;
		margin: 0;
		font-size: 0.95rem;
	}

	dt {
		margin-bottom: 0.15rem;
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	dd {
		margin: 0;
	}

	.differs {
		padding-top: 0.9rem;
		border-top: 1px solid var(--border);
	}

	.differs dt {
		color: var(--accent);
	}
</style>
