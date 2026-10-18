<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import Analytics from '#lib/Analytics.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<meta name="theme-color" content="#fbfbfa" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#0e1114" media="(prefers-color-scheme: dark)" />
</svelte:head>

{#if data.gaId}
	<Analytics id={data.gaId} />
{/if}

{@render children()}
