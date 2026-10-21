<script lang="ts">
	let { id }: { id: string } = $props();

	const KEY = 'analyticsConsent';
	/** The footer's "Cookie settings" button dispatches this to show the banner again. */
	const REOPEN = 'analytics:reopen';

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
		const reopen = () => (asked = true);
		window.addEventListener(REOPEN, reopen);
		return () => window.removeEventListener(REOPEN, reopen);
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
	<aside class="consent" aria-label="Analytics cookies">
		<p>
			This site uses Google Analytics to count visits. Cookies are set only if you accept; without
			them it sends only cookieless pings.
			<a href="https://eggs.gd/privacy">Privacy policy</a>
		</p>
		<div class="consent-actions">
			<button type="button" onclick={() => decide(false)}>Decline</button>
			<button type="button" onclick={() => decide(true)}>Accept</button>
		</div>
	</aside>
{/if}

<style>
	/* Same card as on the other eggs.gd sites; colours come from this site's tokens. */
	.consent {
		position: fixed;
		z-index: 60;
		right: 1rem;
		bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
		left: 1rem;
		max-width: 35rem;
		margin-left: auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
		padding: 0.85rem 1rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--surface);
		color: var(--text);
		font-size: 0.875rem;
		line-height: 1.45;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
	}

	p {
		flex: 1 1 15rem;
		margin: 0;
		color: var(--muted);
	}

	p a {
		color: inherit;
		text-decoration: underline;
	}

	.consent-actions {
		display: flex;
		gap: 0.5rem;
	}

	button {
		min-height: 2.25rem;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: 0.375rem;
		background: transparent;
		color: var(--text);
		font: inherit;
		cursor: pointer;
	}

	button:hover {
		border-color: var(--accent);
	}

	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
