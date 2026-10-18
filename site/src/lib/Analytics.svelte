<script lang="ts">
	let { id }: { id: string } = $props();

	const KEY = 'analytics-consent';
	let asked = $state(false);

	function stored(): string | null {
		try {
			return localStorage.getItem(KEY);
		} catch {
			return null;
		}
	}

	$effect(() => {
		asked = stored() === null;
	});

	function decide(granted: boolean) {
		try {
			localStorage.setItem(KEY, granted ? 'granted' : 'denied');
		} catch {
			// no storage: the choice lasts for this page view only
		}
		(window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.('consent', 'update', {
			analytics_storage: granted ? 'granted' : 'denied'
		});
		asked = false;
	}
</script>

<svelte:head>
	{@html `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`}
	{@html `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});try{if(localStorage.getItem('${KEY}')==='granted'){gtag('consent','update',{analytics_storage:'granted'});}}catch(e){}gtag('js',new Date());gtag('config','${id}');</script>`}
</svelte:head>

{#if asked}
	<div class="consent" role="region" aria-label="Analytics">
		<p>This site uses Google Analytics to count visits, only if you allow it.</p>
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
