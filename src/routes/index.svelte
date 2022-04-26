<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { MAP_TYPE } from '$lib/stores/shared';
	import { APP_HEIGHT } from '$lib/stores/shared';
	import { selectedLanguage } from '$lib/stores/shared';
	import { languageNameTranslations } from '$lib/stores/languages';
	import MapChoroplethAPI from '$lib/components/MapChoroplethAPI.svelte';
	import Select from 'svelte-select';

	let heading;
	let subheading;
	let tooltipLabel1;
	let tooltipLabel2;
	let legendLabel1;
	let legendLabel2;
	let textUpdate;
	let textSourceDescription;
	let textSource;
	let textDataAccess;
	let textNoteDescription;
	let textNote;

	let lastUpdate;
	let totalRefugees;

	// Send map height to parent window
	$: {
		if ($APP_HEIGHT) {
			window.parent.postMessage({ height: $APP_HEIGHT }, '*');
		}
	}

	$: dropdownLanguages = languageNameTranslations['en'];

	// $: console.log($selectedLanguage.value);

	onMount(async () => {
		await getLanguage($selectedLanguage.value);
		await getAggregateAPI();
		// console.log('basePath', base);
	});

	async function getLanguage(lang) {
		const res = await fetch(`/languages/${lang}.json`)
			.then((response) => response.json())
			.then(function (data) {
				heading = data.heading;
				subheading = data.subheading;
				legendLabel1 = data.legend1;
				legendLabel2 = data.legend2;
				tooltipLabel1 = data.tooltip1;
				tooltipLabel2 = data.tooltip2;
				textUpdate = data.textUpdate;
				textSourceDescription = data.textSourceDescription;
				textSource = data.textSource;
				textDataAccess = data.textDataAccess;
				textNoteDescription = data.textNoteDescription;
				textNote = data.textNote;
			});
	}

	$: legend = [
		{ label: legendLabel1, color: '#cad1d9' },
		{ label: legendLabel2, color: '#f4f4f4' }
	];

	$: tooltip = { label1: tooltipLabel1, label2: tooltipLabel2 };

	function handleSelect(event) {
		$selectedLanguage = { value: event.detail.value, label: event.detail.label };
		// $selectedLanguage = event.detail.value;
		getLanguage($selectedLanguage.value);
	}

	async function getAggregateAPI() {
		let aggregateData =
			'https://data2.unhcr.org/population/?widget_id=294522&sv_id=54&population_group=5460';

		// Load aggregate data
		const resAggregate = await fetch(aggregateData)
			.then((response) => response.json())
			.then((dataRaw) => {
				let data = dataRaw.data;
				// console.log(data);

				// Force strings to numbers
				data.forEach(function (d) {
					d['individuals'] = +d['individuals'];
				});

				data = data[0];

				lastUpdate = data.date;
				totalRefugees = data.individuals;
			})
			.catch((error) => console.error('error', error));
	}
</script>

<div id="euranet-map" bind:clientHeight={$APP_HEIGHT}>
	<header>
		<div class="logo">
			<img
				src="./img/logo.png"
				srcset="./img/logo.png 1x, ./img/logo@2x.png 2x"
				alt="Logo EuraNet"
			/>
		</div>
		<div class="select">
			<Select
				items={dropdownLanguages}
				value={$selectedLanguage}
				placeholder="Select a language …"
				noOptionsMessage="No language found"
				on:select={handleSelect}
			/>
		</div>
	</header>
	<div id="chart" class="mt-8">
		{#if heading && subheading}
			<div id="chart-header">
				<h1 class="text-xl font-bold">{heading}</h1>
				<h3 class="text-md">{subheading}</h3>
			</div>
		{/if}

		<div id="chart-body" class="mt-4">
			<MapChoroplethAPI {legend} {tooltip} />
		</div>
	</div>
	{#if textUpdate && textSourceDescription && textSource && textDataAccess && lastUpdate}
		<div class="text-xs mt-2">
			<div>
				<span class="font-bold">{textUpdate}:</span>
				{lastUpdate}, 12:00 CET
			</div>
			<div>
				<span class="font-bold">{textSourceDescription}:</span>
				{textSource}
			</div>
			<div>
				<span class="font-bold">{textNoteDescription}: </span><span>{textNote}</span>
			</div>
			<div class="underline">
				<a target="_blank" href="https://data2.unhcr.org/en/situations/ukraine">{textDataAccess}</a>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		text-align: center;
		font-family: Arial, Helvetica, sans-serif;
		color: #2b3163;
	}

	header {
		display: flex;
		align-items: center;
	}

	.logo {
		flex: 1;
	}

	.select {
		flex: 1;
	}

	div {
		text-align: left;
	}
</style>
