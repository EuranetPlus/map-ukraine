import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		// Use Vercel adapter so +server.js routes (e.g. /unhcr) work in production
		adapter: adapter(),

		// Keep prerendering for pages as before (server routes are still available)
		prerender: {
			default: true
		},

		paths: {
			// base: "/build"
		}
	}
};
