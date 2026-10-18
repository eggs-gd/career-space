import { GA_MEASUREMENT_ID } from '$app/env/public';

export const prerender = true;

export function load() {
	return { gaId: GA_MEASUREMENT_ID ?? '' };
}
