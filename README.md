## About this project

This is the code repository for an interactive EuranetPlus map that displays refugee movements from Ukraine to neighbouring countries based on a data from UNHCR. The data is pulled from an [UNHCR API](https://data2.unhcr.org/en/situations/ukraine) and updated daily based on the latest counts.

## Live map

The map is hosted on EuranetPlus' Vercel account and can be viewed here: https://euranet-map-ukraine.vercel.app/

## Embedding the map

To embed the map on any website as a widget, please use the following responsive iframe code:

```bash
<iframe title="Euranet Map" aria-label="Map" id="euranet-map" src="https://euranet-map-ukraine.vercel.app/" scrolling="no"frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="624"></iframe><script type="text/javascript">window.addEventListener("message", e => { if ("https://euranet-map-ukraine.vercel.app" !== e.origin) return; let t = e.data; if (t.height) { document.getElementById("euranet-map").height = t.height + "px" } }, !1)</script>
```



## Development

To locally develop this map on your computer, please do the following steps in your terminal/command line:

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
