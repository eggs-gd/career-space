<script lang="ts">
	let { text, label }: { text: string; label: string } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 2000);
		} catch {
			copied = false;
		}
	}
</script>

<div class="block">
	<pre><code>{text}</code></pre>
	<button type="button" onclick={copy} aria-label={label}>
		{#if copied}
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
		{:else}
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<rect x="9" y="9" width="11" height="11" rx="2" />
				<path d="M5 15V6a2 2 0 0 1 2-2h9" />
			</svg>
		{/if}
		<span>{copied ? 'Copied' : 'Copy'}</span>
	</button>
	<span class="sr-only" role="status">{copied ? 'Copied to clipboard' : ''}</span>
</div>

<style>
	.block {
		position: relative;
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	pre {
		padding: 1rem 6.25rem 1rem 1.1rem;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font-family: var(--font-mono);
		font-size: 0.92rem;
		line-height: 1.7;
	}

	button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.25rem;
		padding: 0 0.7rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	button:hover {
		border-color: var(--accent);
	}

	svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
