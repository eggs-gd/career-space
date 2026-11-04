<script lang="ts">
	import { copy } from '#lib/content.ts';

	const flow = copy.flow;
	// ten vacancies per cycle; the indexes in `fit` make it through, the rest are dropped
	const stream = Array.from({ length: 10 }, (_, i) => i);
	const fit = [2, 5, 8];
</script>

<figure class="flow">
	<div class="stage" aria-hidden="true">
		<div class="manager">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
				><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /><path d="M18.5 3.5v3M17 5h3" /></svg
			>
			<span>{flow.manager}</span>
		</div>

		<div class="lane a">
			<span class="cap left">{flow.bring}</span>
			<span class="cap right">{flow.get}</span>
			{#each flow.inputs as label, i}
				<span class="chip in" style="--i:{i}">{label}</span>
			{/each}
			{#each flow.outputs as label, i}
				<span class="chip out" style="--i:{i}">{label}<b>{flow.edited}</b></span>
			{/each}
		</div>

		<div class="lane b">
			<span class="cap left">{flow.boards}</span>
			<span class="cap right">{flow.matches}</span>
			{#each stream as i}
				{#if fit.includes(i)}
					{@const k = fit.indexOf(i)}
					<span class="job fit" style="--d:{i}; --row:{k}">
						<span class="t">{flow.jobs[k]}</span>
						<span class="bar"></span>
					</span>
				{:else}
					<span class="job drop" style="--d:{i}; --row:{i % 3}">
						<span class="bar"></span>
						<span class="bar short"></span>
					</span>
				{/if}
			{/each}
		</div>
	</div>
	<figcaption>{flow.caption}</figcaption>
</figure>

<style>
	.flow {
		margin: 2.25rem 0 0;
		max-width: 40rem;
	}

	.stage {
		position: relative;
		display: grid;
		gap: 1.25rem;
		padding: 1.1rem 1rem 1.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) + 2px);
		overflow: hidden;
	}

	.lane {
		position: relative;
		height: 6.1rem;
		container-type: inline-size;
	}

	.cap {
		position: absolute;
		top: 0;
		color: var(--muted);
		font-size: 0.66rem;
		font-weight: 600;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	.cap.left {
		left: 0;
	}

	.cap.right {
		right: 0;
	}

	/* the manager sits in the middle and covers whatever slides behind it */
	.manager {
		position: absolute;
		z-index: 2;
		top: 0.6rem;
		bottom: 0.6rem;
		left: 50%;
		width: 19%;
		translate: -50% 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.4rem;
		color: var(--accent);
		background: var(--surface);
		border: 1.5px solid var(--accent);
		border-radius: 14px;
		text-align: center;
		font-size: 0.66rem;
		font-weight: 600;
		line-height: 1.2;
		animation: pulse 12s ease-in-out infinite;
	}

	.chip,
	.job {
		position: absolute;
		display: flex;
		align-items: center;
		width: 28cqw;
		height: 1.55rem;
		padding: 0 0.5rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 7px;
		color: var(--text);
		font-size: 0.7rem;
		line-height: 1;
		white-space: nowrap;
	}

	.chip {
		top: calc(1.2rem + var(--i) * 1.65rem);
	}

	.chip.in {
		left: 0;
		animation: bring 12s ease-in-out infinite;
		animation-delay: calc(var(--i) * 0.35s);
		animation-fill-mode: backwards;
	}

	.chip.out {
		right: 0;
		justify-content: space-between;
		border-color: var(--accent);
		animation: get 12s ease-in-out infinite;
		animation-delay: calc(var(--i) * 0.35s);
		animation-fill-mode: backwards;
	}

	.chip b {
		margin-left: 0.3rem;
		color: var(--accent);
		font-size: 0.58rem;
		font-weight: 600;
	}

	.job {
		top: calc(1.2rem + var(--row) * 1.65rem);
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		gap: 0.22rem;
		animation-duration: 10s;
		animation-iteration-count: infinite;
		animation-timing-function: ease-in-out;
		animation-delay: calc(var(--d) * -1s);
	}

	.bar {
		display: block;
		height: 0.28rem;
		background: var(--border);
		border-radius: 2px;
	}

	.bar.short {
		width: 55%;
	}

	.job.drop {
		left: 0;
		animation-name: reject;
	}

	.job.fit {
		right: 0;
		border-color: var(--accent);
		animation-name: select;
	}

	.job .t {
		color: var(--text);
		font-size: 0.66rem;
		font-weight: 600;
	}

	.job.fit .bar {
		width: 70%;
		background: var(--accent);
		opacity: 0.55;
	}

	@keyframes bring {
		0% { opacity: 0; transform: translateX(-3cqw); }
		8%, 20% { opacity: 1; transform: translateX(0); }
		40% { opacity: 1; transform: translateX(26cqw); }
		44%, 100% { opacity: 0; transform: translateX(26cqw); }
	}

	@keyframes get {
		0%, 46% { opacity: 0; transform: translateX(-24cqw); }
		62%, 90% { opacity: 1; transform: translateX(0); }
		97%, 100% { opacity: 0; transform: translateX(0); }
	}

	@keyframes pulse {
		0%, 24%, 62%, 100% { box-shadow: 0 0 0 0 transparent; }
		42% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--accent) 18%, transparent); }
	}

	/* dropped: stops at the manager and sinks away */
	@keyframes reject {
		0% { opacity: 0; transform: translateX(0); }
		8% { opacity: 1; transform: translateX(0); }
		38% { opacity: 1; transform: translateX(12cqw) rotate(0); }
		48% { opacity: 0; transform: translateX(13cqw) translateY(0.9rem) rotate(8deg); }
		100% { opacity: 0; transform: translateX(13cqw) translateY(0.9rem) rotate(8deg); }
	}

	/* selected: slides behind the manager and comes out the other side */
	@keyframes select {
		0% { opacity: 0; transform: translateX(-72cqw); }
		6% { opacity: 1; transform: translateX(-72cqw); }
		40% { opacity: 1; transform: translateX(-34cqw); }
		54% { opacity: 1; transform: translateX(-20cqw); }
		68%, 92% { opacity: 1; transform: translateX(0); }
		100% { opacity: 0; transform: translateX(0); }
	}

	figcaption {
		margin-top: 0.7rem;
		color: var(--muted);
		font-size: 0.86rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.manager,
		.chip,
		.job {
			animation: none;
		}

		.job.drop {
			display: none;
		}
	}
</style>
