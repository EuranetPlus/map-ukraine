## About this project

This is the code repository for an interactive EuraNet map that displays refugee movements from Ukraine to neighbouring countries based on a data from UNHCR. The data is pulled from an UNHCR API and updated daily based on the latest counts.

## Development

To locally develop this map, please do the following steps:

1. Clone the repo: ``git clone https://github.com/EuranetPlus/map-ukraine.git``
2. Open cloned folder: ``cd map-ukraine``
3. Install all dependencies: ``npm install``
4. Start a local development server:  

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Production

Before creating a production version of your app, please install an [adapter](https://kit.svelte.dev/docs#adapters) for your target environment. Usually this would be the static adapter provided by SvelteKit or any adapter suiting your platform (i.e. Vercel, Netlify, etc.). Please see more info here: https://kit.svelte.dev/docs#adapters

To build the app for production, run

```bash
npm run build
```

This will create a static folder called __build__ in the root folder of the repository, which contains all the files necessary for deployment on a web server.

> You can also preview the built app with `npm run preview`, regardless of whether you installed an adapter. This should _not_ be used to serve your app in production.
