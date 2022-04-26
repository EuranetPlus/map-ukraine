import { writable } from 'svelte/store';

export const APP_HEIGHT = writable(undefined);

export const MAP_WIDTH = writable(undefined);

// Set type of map to be rendered
export const MAP_TYPE = writable("choropleth-api"); // choropleth or choropleth-api
export const CENTER_ON = writable("europe"); // ukraine or europe

export const csvData = writable(undefined);

export const dataReady = writable(false);

export const selectedLanguage = writable({ value: 'en', label: 'English' });

export const MOUSE = writable(undefined);
MOUSE.set({ 
  x: 0, 
  y: 0,
  tooltip: {}
});