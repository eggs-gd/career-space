<script lang="ts">
	import { copy } from '#lib/content.ts';

	const flow = copy.flow;
	const docs = ['linkedin', 'cv', 'upwork'];
	// eight vacancies per cycle; the indexes in `fit` make it through, the rest are dropped
	const stream = Array.from({ length: 8 }, (_, i) => i);
	const fit = [1, 4, 6];
</script>

{#snippet icon(kind: string)}
	<svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
		{#if kind === 'linkedin'}
			<rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M8 11v5M8 8v.01M12 16v-5m0 2.5c0-1.4 1-2.5 2.3-2.5S16.5 12 16.5 13.5V16" />
		{:else if kind === 'cv'}
			<path d="M5.5 3.5h9l4 4v13h-13z" /><path d="M14.5 3.5v4h4" /><text x="12" y="16.6" text-anchor="middle" font-size="7.6" font-weight="800" font-family="ui-sans-serif, system-ui, sans-serif" fill="currentColor" stroke="none">CV</text>
		{:else}
			<rect x="3.5" y="3.5" width="17" height="17" rx="3" /><text x="12" y="16" text-anchor="middle" font-size="10.4" font-weight="800" font-family="ui-sans-serif, system-ui, sans-serif" fill="currentColor" stroke="none">Up</text>
		{/if}
	</svg>
{/snippet}

{#snippet check()}
	<svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.4l2.3 2.3L9.5 3.6" /></svg>
{/snippet}

{#snippet cross()}
	<svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3l6 6M9 3l-6 6" /></svg>
{/snippet}

<figure class="flow">
	<div class="stage" aria-hidden="true">
		<div class="manager">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
				><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /><path d="M18.5 3.5v3M17 5h3" /></svg
			>
			<span>{flow.manager}</span>
		</div>

		<div class="boards">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="4.5" rx="1.2" /><rect x="3.5" y="10" width="17" height="4.5" rx="1.2" /><rect x="3.5" y="16" width="17" height="4.5" rx="1.2" /></svg>
			<span>{flow.boards}</span>
		</div>

		<div class="lane a">
			<span class="cap left">{flow.profiles}</span>
			{#each docs as kind, i}
				<span class="doc raw" style="--i:{i}">{@render icon(kind)}<i class="badge q">?</i></span>
				<span class="doc ready" style="--i:{i}">{@render icon(kind)}<i class="badge ok">{@render check()}</i></span>
			{/each}
		</div>

		<div class="lane b">
			<span class="cap left">{flow.matches}</span>
			{#each stream as i}
				{#if fit.includes(i)}
					{@const k = fit.indexOf(i)}
					<span class="job fit" style="--d:{i}; --row:{k}">
						<span class="t">{flow.jobs[k]}</span>
						<span class="bar"></span>
						<i class="badge q">?</i>
						<i class="badge ok">{@render check()}</i>
					</span>
				{:else}
					<span class="job drop" style="--d:{i}; --row:{i % 3}">
						<span class="bar"></span>
						<span class="bar short"></span>
						<i class="badge q">?</i>
						<i class="badge no">{@render cross()}</i>
					</span>
				{/if}
			{/each}
		</div>
	</div>
	<figcaption>{flow.caption}</figcaption>
</figure>

<style>
	.flow {
		--warn: #b7791f;
		--warn-bg: #fbf3df;
		--bad: #c53030;
		--ok: var(--accent);
		--dim-border: color-mix(in srgb, var(--muted) 50%, transparent);
		--dim-bg: color-mix(in srgb, var(--muted) 9%, var(--surface));
		margin: 2.25rem 0 0;
		max-width: 40rem;
	}

	@media (prefers-color-scheme: dark) {
		.flow {
			--warn: #e0b341;
			--warn-bg: #2a2412;
			--bad: #f26d6d;
		}
	}

	.stage {
		position: relative;
		display: grid;
		gap: 1rem;
		padding: 1.1rem 1rem 1.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) + 2px);
		overflow: hidden;
	}

	.lane {
		position: relative;
		container-type: inline-size;
	}

	.lane.a {
		height: 4rem;
	}

	.lane.b {
		height: 6.2rem;
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

	/* job boards: a full-height panel on the right that the vacancies slide out of */
	.boards {
		position: absolute;
		z-index: 2;
		top: 0;
		right: 0;
		bottom: 0;
		width: 20%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.4rem;
		color: var(--muted);
		background: color-mix(in srgb, var(--muted) 9%, var(--surface));
		border-left: 1px dashed color-mix(in srgb, var(--muted) 55%, transparent);
		text-align: center;
		font-size: 0.66rem;
		font-weight: 600;
		line-height: 1.2;
	}

	.badge {
		position: absolute;
		top: -0.35rem;
		right: -0.35rem;
		display: grid;
		place-items: center;
		width: 0.95rem;
		height: 0.95rem;
		border-radius: 50%;
		font-size: 0.6rem;
		font-style: normal;
		font-weight: 700;
		line-height: 1;
	}

	.badge.q {
		color: #3b2a05;
		background: var(--warn);
	}

	.badge.ok {
		color: var(--accent-ink);
		background: var(--ok);
	}

	.badge.no {
		color: #fff;
		background: var(--bad);
	}

	/* ---- profiles: yellow and unclear going in, green and shiny coming back ---- */
	.doc {
		position: absolute;
		top: 1.35rem;
		--sz: clamp(2rem, 11.5cqw, 2.4rem);
		--go: calc(50cqw - var(--i) * (var(--sz) + 0.3rem) - var(--sz) / 2);
		left: calc(var(--i) * (var(--sz) + 0.3rem));
		display: grid;
		place-items: center;
		width: var(--sz);
		height: var(--sz);
		border-radius: 8px;
		border: 1px solid var(--border);
		overflow: visible;
	}

	.doc svg {
		width: 72%;
		height: auto;
	}

	.doc.raw {
		color: var(--warn);
		background: var(--warn-bg);
		border-color: var(--warn);
		animation: bring 12s ease-in-out infinite;
		animation-delay: calc(var(--i) * 0.35s);
		animation-fill-mode: backwards;
	}

	.doc.ready {
		color: var(--accent);
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 10%, var(--surface));
		animation: back 12s ease-in-out infinite;
		animation-delay: calc(var(--i) * 0.35s);
		animation-fill-mode: backwards;
	}

	.doc.ready::after,
	.job.fit::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: linear-gradient(105deg, transparent 35%, color-mix(in srgb, #fff 70%, transparent) 50%, transparent 65%);
		background-size: 250% 100%;
		background-position: 130% 0;
		pointer-events: none;
		animation: shine 12s ease-in-out infinite;
		animation-delay: calc(var(--i, 0) * 0.35s);
	}

	.job.fit::after {
		animation-duration: 10s;
		animation-delay: calc(var(--d) * -1.25s);
		animation-name: shine-job;
	}

	/* ---- vacancies: unclear coming in from the boards, green ones carry on to you ---- */
	.job {
		position: absolute;
		top: calc(1.35rem + var(--row) * 1.6rem);
		left: 83cqw;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.22rem;
		width: 28cqw;
		height: 1.4rem;
		padding: 0 0.5rem;
		background: var(--dim-bg);
		border: 1px solid var(--dim-border);
		border-radius: 7px;
		animation-duration: 10s;
		animation-iteration-count: infinite;
		animation-timing-function: ease-in-out;
		animation-delay: calc(var(--d) * -1.25s);
	}

	.job .badge {
		top: -0.4rem;
		right: -0.3rem;
	}

	.job .badge.q {
		color: var(--surface);
		background: var(--muted);
	}

	.bar {
		display: block;
		height: 0.26rem;
		background: color-mix(in srgb, var(--muted) 38%, transparent);
		border-radius: 2px;
	}

	.bar.short {
		width: 55%;
	}

	.job .t {
		color: var(--text);
		font-size: 0.66rem;
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
		animation: reveal 10s ease-in-out infinite;
		animation-delay: calc(var(--d) * -1.25s);
	}

	.job.fit {
		left: 0;
		animation-name: select;
	}

	.job.fit .bar {
		animation: tint 10s ease-in-out infinite;
		animation-delay: calc(var(--d) * -1.25s);
	}

	.job.fit .badge.q {
		animation: fade-out 10s ease-in-out infinite;
		animation-delay: calc(var(--d) * -1.25s);
	}

	.job.fit .badge.ok {
		animation: fade-in 10s ease-in-out infinite;
		animation-delay: calc(var(--d) * -1.25s);
	}

	.job.fit,
	.job.fit .t {
		/* keep the title readable even before the keyframes begin */
		color: var(--text);
	}

	.job.drop {
		animation-name: reject;
	}

	.job.drop .badge.q {
		animation: fade-out 10s ease-in-out infinite;
		animation-delay: calc(var(--d) * -1.25s);
	}

	.job.drop .badge.no {
		animation: blink 10s ease-in-out infinite;
		animation-delay: calc(var(--d) * -1.25s);
	}

	/* base state (also what reduced motion shows) */
	.badge.no,
	.doc.raw {
		opacity: 0;
	}

	.badge.q {
		opacity: 0;
	}

	@keyframes bring {
		0% { opacity: 0; transform: translateX(-3cqw); }
		8%, 20% { opacity: 1; transform: translateX(0); }
		38% { opacity: 1; transform: translateX(var(--go)); }
		42%, 100% { opacity: 0; transform: translateX(var(--go)); }
	}

	@keyframes back {
		0%, 46% { opacity: 0; transform: translateX(var(--go)); }
		54% { opacity: 1; transform: translateX(var(--go)); }
		68%, 90% { opacity: 1; transform: translateX(0); }
		97%, 100% { opacity: 0; transform: translateX(0); }
	}

	@keyframes shine {
		0%, 66% { background-position: 130% 0; }
		80%, 100% { background-position: -30% 0; }
	}

	@keyframes shine-job {
		0%, 58% { background-position: 130% 0; }
		74%, 100% { background-position: -30% 0; }
	}

	@keyframes pulse {
		0%, 24%, 62%, 100% { box-shadow: 0 0 0 0 transparent; }
		42% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--accent) 18%, transparent); }
	}

	/* dropped: stops at the manager, flashes a red cross and sinks away */
	@keyframes reject {
		0% { opacity: 0; transform: translateX(0); border-color: var(--dim-border); }
		6% { opacity: 0; transform: translateX(-2cqw); }
		10% { opacity: 1; transform: translateX(-4cqw); }
		30% { opacity: 1; transform: translateX(-21cqw); border-color: var(--dim-border); }
		34%, 42% { border-color: var(--bad); }
		38% { border-color: var(--dim-border); }
		52% { opacity: 0; transform: translateX(-22cqw) translateY(0.9rem) rotate(-8deg); border-color: var(--bad); }
		100% { opacity: 0; transform: translateX(-22cqw) translateY(0.9rem) rotate(-8deg); }
	}

	/* selected: turns green at the manager, passes behind it and comes out toward you */
	@keyframes select {
		0%, 5% { opacity: 0; transform: translateX(83cqw); border-color: var(--dim-border); background: var(--dim-bg); }
		9% { opacity: 1; transform: translateX(79cqw); }
		30% { opacity: 1; transform: translateX(62cqw); border-color: var(--dim-border); background: var(--dim-bg); }
		36% { border-color: var(--ok); background: color-mix(in srgb, var(--ok) 10%, var(--surface)); }
		44% { opacity: 0; transform: translateX(48cqw); }
		52% { opacity: 0; transform: translateX(36cqw); }
		58% { opacity: 1; transform: translateX(28cqw); }
		70%, 92% { opacity: 1; transform: translateX(0); border-color: var(--ok); background: color-mix(in srgb, var(--ok) 10%, var(--surface)); }
		100% { opacity: 0; transform: translateX(0); }
	}

	@keyframes reveal {
		0%, 52% { opacity: 0; }
		60%, 100% { opacity: 1; }
	}

	@keyframes tint {
		0%, 34% { background: color-mix(in srgb, var(--muted) 38%, transparent); }
		40%, 100% { background: color-mix(in srgb, var(--ok) 55%, transparent); }
	}

	@keyframes fade-out {
		0%, 24% { opacity: 1; }
		32%, 100% { opacity: 0; }
	}

	@keyframes fade-in {
		0%, 34% { opacity: 0; }
		42%, 100% { opacity: 1; }
	}

	@keyframes blink {
		0%, 30% { opacity: 0; }
		33%, 37%, 41% { opacity: 1; }
		35%, 39% { opacity: 0.2; }
		50%, 100% { opacity: 0; }
	}

	figcaption {
		margin-top: 0.7rem;
		color: var(--muted);
		font-size: 0.86rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.manager,
		.doc,
		.job,
		.job *,
		.doc::after,
		.job::after {
			animation: none;
		}

		.doc.raw,
		.job.drop,
		.badge.q {
			display: none;
		}

		.job.fit .bar {
			background: color-mix(in srgb, var(--ok) 55%, transparent);
		}

		.job.fit {
			border-color: var(--ok);
			background: color-mix(in srgb, var(--ok) 10%, var(--surface));
		}
	}
</style>
