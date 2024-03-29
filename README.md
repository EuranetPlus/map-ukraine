## About this project

This is the code repository for an interactive EuranetPlus map that displays refugee movements from Ukraine to neighbouring countries based on a data from UNHCR. The data is pulled from an [UNHCR API](https://data2.unhcr.org/en/situations/ukraine) and updated daily based on the latest counts.

![_Users_alsino_Desktop_map-ukraine_preview_index html (1)](https://user-images.githubusercontent.com/104374044/165337413-67e72e8a-68b0-401a-9bf3-c5cfa3d69eb1.png)


## Live map

The map is hosted on EuranetPlus' Vercel account and can be viewed here:  
https://euranet-map-ukraine.vercel.app/

## Embedding the map

To embed the map on any website as a responsive widget, please use the following iframe code:

```bash
<iframe title="Euranet Map" aria-label="Map" id="euranet-map-ukraine" src="https://euranet-map-ukraine.vercel.app/" scrolling="no"frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="624"></iframe><script type="text/javascript">window.addEventListener("message", e => { if ("https://euranet-map-ukraine.vercel.app" !== e.origin) return; let t = e.data; if (t.height) { document.getElementById("euranet-map-ukraine").height = t.height + "px" } }, !1)</script>
```

## Changing translations manually

All text elements on the map (e.g. country names, heading, subheading, source text, notes, etc.) are automatically translated into the 24 official EU languages using the Google Translate API by running an automated node script. The translations returned by Google are a good first approach, but manual edits of the text in different languages may be necessary. To do this, please go to the [language folder](https://github.com/EuranetPlus/map-ukraine/tree/main/static/languages) and edit the contents of the respective language file.  

Example:  
To change the text of the subheading of the map in Hungarian, open the [hu.json](https://github.com/EuranetPlus/map-ukraine/blob/main/static/languages/hu.json) file and change the "subheading" entry (text in quotation marks, i.e. "" behind the :). To do this, simply click on the pen symbol on the top right side of the file preview window where it says "Edit this file". ***Warning: Please do not change the headings as these are automatically generated every day, based on the latest data. Also make sure to always enclose the text elemets with quotation marks and do not forget to add a comma after the entry. Otherwise the file will not be able to be read and the app may brake.***

This is **correct**:  
``"heading": "Már több mint 5,2 millió menekült menekült el Ukrajnából",``

This is **not correct** (comma is missing and no quotation marks, i.e. "" enclosing the text):  
``"heading": Már több mint 5,2 millió menekült menekült el Ukrajnából``

After this, save the changes by entering a title for the commit, e.g. "Create hu.json" and press the green __Commit changes__ button.



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
