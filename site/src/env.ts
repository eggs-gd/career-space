import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	GA_MEASUREMENT_ID: {
		public: true,
		static: true,
		description: 'GA4 measurement ID (G-XXXXXXXXXX). Unset: analytics is off.',
		schema: (value) => (value && /^G-[A-Z0-9]{6,}$/.test(value) ? value : undefined)
	}
});
