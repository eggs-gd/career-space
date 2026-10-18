<script lang="ts">
	let { id }: { id: string } = $props();

	const KEY = 'analytics-consent';
	let asked = $state(false);
	let loaded = false;

	type Gtag = (...args: unknown[]) => void;
	type Win = Window & { dataLayer?: unknown[]; gtag?: Gtag };

	function stored(): string | null {
		try {
			return localStorage.getItem(KEY);
		} catch {
			return null;
		}
	}

	// Nothing from Google is requested until the visitor has allowed it.
	function load() {
		if (loaded) return;
		loaded = true;
		const w = window as Win;
		w.dataLayer = w.dataLayer || [];
		w.gtag = function () {
			// gtag.js reads the `arguments` object, not an array
			// eslint-disable-next-line prefer-rest-params
			w.dataLayer!.push(arguments);
		};
		w.gtag('js', new Date());
		w.gtag('config', id);
		const script = document.createElement('script');
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
		document.head.append(script);
	}

	$effect(() => {
		const choice = stored();
		if (choice === 'granted') load();
		asked = choice === null;
	});

	function decide(granted: boolean) {
		try {
			localStorage.setItem(KEY, granted ? 'granted' : 'denied');
		} catch {
			// no storage: the choice lasts for this page view only
		}
		if (granted) load();
		asked = false;
	}
</script>

{#if asked}
	<div class="consent" role="region" aria-label="Analytics">
		<p>This site can use Google Analytics to count visits. Nothing is loaded unless you allow it.</p>
		<div class="buttons">
			<button type="button" class="yes" onclick={() => decide(true)}>Allow</button>
			<button type="button" onclick={() => decide(false)}>No thanks</button>
		</div>
	</div>
{/if}

<style>
	.consent {
		position: fixed;
		inset: auto 0 0 0;
		z-index: 20;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1.5rem;
		padding: 0.85rem var(--gutter);
		background: var(--surface);
		border-top: 1px solid var(--border);
		font-size: 0.92rem;
	}

	p {
		margin: 0;
	}

	.buttons {
		display: flex;
		gap: 0.5rem;
	}

	button {
		min-height: 2.5rem;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface);
		color: var(--text);
		font: inherit;
		cursor: pointer;
	}

	button:hover {
		border-color: var(--accent);
	}

	button.yes {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--accent-ink);
	}
</style>
