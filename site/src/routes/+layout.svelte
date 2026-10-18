<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<meta name="theme-color" content="#fbfbfa" media="(prefers-color-scheme: light)" />
	<meta name="theme-color" content="#0e1114" media="(prefers-color-scheme: dark)" />
	{#if data.gaId}
		{@html `<script async src="https://www.googletagmanager.com/gtag/js?id=${data.gaId}"></script>`}
		{@html `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${data.gaId}');</script>`}
	{/if}
</svelte:head>

{@render children()}
