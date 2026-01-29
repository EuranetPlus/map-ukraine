<script>
	import { MOUSE } from '$lib/stores/shared';
	import { onMount } from 'svelte';
	import { CENTER_ON } from '$lib/stores/shared';
	import { csvData } from '$lib/stores/shared';
	import { feature } from 'topojson-client';
	import { geoPath, geoIdentity } from 'd3-geo';
	import { dataReady } from '$lib/stores/shared';
	import { MAP_WIDTH } from '$lib/stores/shared';
	import { selectedLanguage } from '$lib/stores/shared';
	import { countryNameTranslations } from '$lib/stores/countries';
	import Scale from './Scale.svelte';
	import Legend from './Legend.svelte';

	import { min, max } from 'd3-array';

	import { schemeBlues } from 'd3-scale-chromatic';
	import scaleCluster from 'd3-scale-cluster';

	import { formatThousands } from '$lib/utils/formatNumbers';
	import { formatPercent } from '$lib/utils/formatNumbers';

	import { dataUpdated } from '$lib/stores/shared';

	// Make square dimensions i.e. 600x600 to fill all space
	let width = 600;
	let height = 600;
	let paddingMap;
	let center;

	$: countryNames = countryNameTranslations[$selectedLanguage.value];

	export let legend;
	export let tooltip;

	$: if ($CENTER_ON === 'ukraine') {
		paddingMap = 150;
		center = ukraine;
	} else if ($CENTER_ON === 'europe') {
		paddingMap = -60;
		center = countriesAll;
	}

	$: tooltipPositionX = $MOUSE.x < $MAP_WIDTH / 2 ? $MOUSE.x : $MOUSE.x - tooltipWidth;

	let tooltipAvailable = true; // Set this to switch on/off global tooltip
	let tooltipVisible = false;
	let tooltipHeight;
	let tooltipWidth;

	let graticules;
	let countriesAll;
	let countriesEurope;
	let ukraine;
	let countryBoundaries;

	let hoveredCountry;

	let scaleMin, scaleMax;
	let totalRefugees;

	const projection = geoIdentity().reflectY(true);
	const path = geoPath().projection(projection);
	const colorScale = scaleCluster();
	let clusters;

	// Yellow
	const accentStroke = 'rgba(246, 207, 1, 1)';
	const accentFill = 'rgba(246, 207, 1, 1)';

	$: if ($dataReady) {
		projection.fitExtent(
			[
				[paddingMap, paddingMap],
				[width - paddingMap, height - paddingMap]
			],
			center
		);
	}

	// Proxy via SvelteKit route: src/routes/unhcr/+server.js
	function proxied(url) {
		return `/unhcr?url=${encodeURIComponent(url)}`;
	}

	async function fetchGeoData() {
		await fetch(`/data/geodata/europe-20m.json`)
			.then((response) => response.json())
			.then(function (data) {
				countriesAll = feature(data, data.objects.cntrg);
				countriesEurope = feature(data, data.objects.nutsrg);
				graticules = feature(data, data.objects.gra);
				countryBoundaries = feature(data, data.objects.cntbn);

				let neighbourBorders = [
					{ name: 'russia', id: 1958, offset: '5px -5px' },
					{ name: 'belarus', id: 1954, offset: '-5px -5px' },
					{ name: 'poland', id: 1934, offset: '-5px 0px' },
					{ name: 'slovakia', id: 1806, offset: '-5px 0px' },
					{ name: 'hungary', id: 1785, offset: '-5px 0px' },
					{ name: 'romania', id: 1783, offset: '0px 5px' },
					{ name: 'moldova', id: 1786, offset: '-5px 5px' },
					{ name: 'romania', id: 1994, offset: '0px 5px' }
				];

				// Extract country borders
				let nBounds = neighbourBorders.map((n) => {
					let border = countryBoundaries.features.filter((i) => {
						return i.properties.id === n.id;
					})[0];
					border.properties.name = n.name;
					border.properties.offset = n.offset;
					return border;
				});

				countryBoundaries = {
					type: 'FeatureCollection',
					features: nBounds
				};

				// Extract Schengen countries (kept for parity; not used elsewhere)
				let schengenFiltered = countriesAll.features
					.filter((item) => item.properties.isSchengen)
					.sort((a, b) => a.properties.na.localeCompare(b.properties.na));

				let ukraineFeature = countriesAll.features.filter((c) => c.properties.na == 'Ukraine');

				ukraine = {
					type: 'FeatureCollection',
					features: ukraineFeature
				};
			});
	}

	async function fetchAPI() {
		const countryData =
			'https://data2.unhcr.org/population/get/sublocation?widget_id=284342&sv_id=54&population_group=5459,5460&forcesublocation=0&fromDate=1900-01-01';

		const aggregateData =
			'https://data2.unhcr.org/population/?widget_id=294522&sv_id=54&population_group=5460';

		// --- Load country data (live UNHCR via /unhcr proxy) ---
		try {
			const response = await fetch(proxied(countryData));
			if (!response.ok) throw new Error(`Country API HTTP ${response.status}`);
			const dataRaw = await response.json();

			let data = dataRaw?.data ?? [];

			// Force strings to numbers
			data.forEach((d) => {
				d['individuals'] = +d['individuals'];
			});

			const extentArray = data
				.map((item) => item.individuals)
				.filter((v) => Number.isFinite(v));

			// IMPORTANT: always set store so mergeData never crashes
			csvData.set(data);

			// Set color scale domain and range (only if we have numbers)
			if (extentArray.length) {
				colorScale.domain(extentArray).range(schemeBlues[5]);
				clusters = colorScale.clusters();
				scaleMin = min(extentArray);
				scaleMax = max(extentArray);
			} else {
				clusters = undefined;
				scaleMin = undefined;
				scaleMax = undefined;
			}
		} catch (error) {
			console.error('UNHCR country fetch failed', error);
			csvData.set([]); // keep app alive
			clusters = undefined;
			scaleMin = undefined;
			scaleMax = undefined;
		}

		// --- Load aggregate data (live UNHCR via /unhcr proxy) ---
		try {
			const response = await fetch(proxied(aggregateData));
			if (!response.ok) throw new Error(`Aggregate API HTTP ${response.status}`);
			const dataRaw = await response.json();

			let data = dataRaw?.data ?? [];

			// Force strings to numbers
			data.forEach((d) => {
				d['individuals'] = +d['individuals'];
			});

			const first = data[0];
			if (first) {
				$dataUpdated = first.date;
				totalRefugees = first.individuals;
			} else {
				totalRefugees = undefined;
			}
		} catch (error) {
			console.error('UNHCR aggregate fetch failed', error);
			totalRefugees = undefined;
		}
	}

	function mergeData() {
		// Ensure we never call reduce on undefined
		const rows = Array.isArray($csvData) ? $csvData : [];

		// Transform csv structure to object style to be better usable
		let csvTransformed = rows.reduce(
			(obj, item) => Object.assign(obj, { [item.geomaster_name]: item.individuals }),
			{}
		);

		delete csvTransformed['Other European countries'];

		// Add values from csv
		if (countriesAll?.features?.length) {
			countriesAll.features.forEach((item) => {
				item.value = csvTransformed[item.properties.na];
			});
		}

		// Render map even if API is down (then mostly grey)
		$dataReady = true;
	}

	onMount(async () => {
		try {
			await fetchGeoData();
			await fetchAPI();
			mergeData();
		} catch (e) {
			console.error('Map init failed', e);
			$dataReady = true;
		}
	});

	function getFill(feature) {
		if (feature.value) {
			return colorScale(feature.value);
		} else {
			if (feature.properties.isSchengen) {
				return '#CAD1D9';
			} else {
				return '#F4F4F4';
			}
		}
	}

	function getClass(feature) {
		if (feature.value) {
			return 'pointer';
		} else {
			return 'noPointer';
		}
	}

	function handleMouseMove(e) {
		let divOffset = offset(e.currentTarget);

		let mouseX = e.pageX - divOffset.left;
		let mouseY = e.pageY - divOffset.top;

		if (hoveredCountry) {
			MOUSE.set({
				x: mouseX,
				y: mouseY,
				tooltip: {
					name: hoveredCountry.name,
					value: hoveredCountry.value,
					valuePercent: hoveredCountry.valuePercent
				}
			});
		}

		// Calculate the position of the map div in the page to get mouse position
		function offset(el) {
			let rect = el.getBoundingClientRect(),
				scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
				scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
		}
	}

	$: handleMouseEnter = function (country) {
		if (tooltipAvailable) {
			let entry = countryNames.filter((c) => c.id == country.properties.id)[0];
			let countryName = entry ? entry.na : country.properties.na;

			hoveredCountry = {
				name: countryName,
				value: country.value,
				valuePercent: totalRefugees ? country.value / totalRefugees : undefined
			};

			if (country.properties.na || country.value) {
				tooltipVisible = true;
			}
		}
	};

	$: handleMouseLeave = function () {
		if (tooltipAvailable) {
			tooltipVisible = false;
		}
	};

	$: handleMouseOverUkraine = function (country) {
		if (tooltipAvailable && totalRefugees) {
			let entry = countryNames.filter((c) => c.id == country.properties.id)[0];
			let countryName = entry ? entry.na : country.properties.na;

			hoveredCountry = {
				name: countryName,
				value: totalRefugees,
				valuePercent: 1
			};

			if (country.properties.na) {
				tooltipVisible = true;
			}
		}
	};
</script>

{#if $dataReady}
	<div id="map" class="relative" on:mousemove={handleMouseMove} bind:clientHeight={$MAP_WIDTH}>
		{#if clusters && scaleMin !== undefined && scaleMax !== undefined}
			<Scale classes={schemeBlues[5]} {clusters} {scaleMin} {scaleMax} />
		{/if}
		<Legend {legend} />

		<svg preserveAspectRatio="xMinYMid meet" class="" viewbox="0 0 {width} {height}">
			<!-- graticules (lines) -->
			{#each graticules.features as feature, index}
				<path d={path(feature)} stroke="#cfcfcf" fill="transparent" class="noPointer" />
			{/each}

			<!-- countriesAll -->
			{#each countriesAll.features as feature, index}
				<path
					d={path(feature)}
					stroke="white"
					fill={getFill(feature)}
					class={getClass(feature)}
					on:mouseenter={() => handleMouseEnter(feature)}
					on:mouseleave={() => handleMouseLeave(feature)}
				/>
			{/each}

			<!-- boundaries -->
			{#each countryBoundaries.features as feature, index}
				<path
					d={path(feature)}
					class={'boundary one boundary-' + feature.properties.name}
					style="transform-origin: center; transform: scale(1.1, 1.1) translateX(-1.5%) translateY(-0.4%); stroke-width:1; opacity: 0.8;"
				/>
			{/each}

			<!-- boundaries -->
			{#each countryBoundaries.features as feature, index}
				<path
					d={path(feature)}
					class={'boundary two boundary-' + feature.properties.name}
					style="transform-origin: center; transform: scale(1.2, 1.2) translateX(-3%) translateY(-0.8%); stroke-width:1; opacity: 0.6;"
				/>
			{/each}

			<!-- boundaries -->
			{#each countryBoundaries.features as feature, index}
				<path
					d={path(feature)}
					class={'boundary three boundary-' + feature.properties.name}
					style="transform-origin: center; transform: scale(1.3, 1.3) translateX(-4.5%) translateY(-1.2%); stroke-width:0.5; opacity: 0.4;"
				/>
			{/each}

			<!-- ukraine -->
			{#each ukraine.features as feature, index}
				<path d={path(feature)} class={'ukraine'} on:mouseover={handleMouseOverUkraine(feature)} />
			{/each}
		</svg>

		<div
			class="tooltip text-sm p-3 {tooltipVisible ? 'active' : ''}"
			style="top: {$MOUSE.y - tooltipHeight}px; left:{tooltipPositionX}px;"
			bind:clientHeight={tooltipHeight}
			bind:clientWidth={tooltipWidth}
		>
			<div class="tooltip-head font-bold">{$MOUSE.tooltip.name}</div>
			<div class="tooltip-body space-y-1">
				<div class="absolute-values">
					<span class="font-bold">{formatThousands($MOUSE.tooltip.value)}</span>
					<span>{tooltip.label1}</span>
				</div>
				<div class="relative-values">
					{#if $MOUSE.tooltip.valuePercent !== 1 && $MOUSE.tooltip.valuePercent !== undefined}
						<span>{tooltip.label2}</span>
						<span class="font-bold">{formatPercent($MOUSE.tooltip.valuePercent)}</span>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	#map {
		position: relative;
	}

	svg {
		width: 100%;
		height: auto;
	}

	svg path {
		stroke-width: 0.5px;
		cursor: pointer;
		transition: all 0.5s;
	}

	.noPointer {
		pointer-events: none;
	}

	.pointer {
		pointer-events: all;
	}

	.tooltip {
		text-align: left;
		position: absolute;
		pointer-events: none;
		display: none;
		background: white;
		border-radius: 3px;
		z-index: 0;
		box-shadow: 0 10px 20px 0 rgba(185, 185, 185, 0.25);
	}

	.tooltip-head {
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e2e2e2;
	}

	.tooltip-body {
		padding-top: 0.5rem;
	}

	.active {
		display: block;
	}

	.ukraine {
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
		fill: #f6e293;
		stroke: rgba(246, 207, 1, 1);
	}

	.boundary {
		stroke-width: 1;
		stroke: rgba(246, 207, 1, 1);
		fill: none;
		stroke-linejoin: round;
		stroke-linecap: round;
		transform-origin: center;
	}

	.one {
		animation-name: borderPulse;
		animation-delay: 500ms;
		animation-duration: 2s;
		animation-iteration-count: infinite;
		animation-timing-function: ease-in-out;
		animation-direction: alternate-reverse;
	}

	.two {
		animation-name: borderPulse;
		animation-delay: 1000ms;
		animation-duration: 2s;
		animation-iteration-count: infinite;
		animation-timing-function: ease-in-out;
		animation-direction: alternate-reverse;
	}

	.three {
		animation-name: borderPulse;
		animation-delay: 1500ms;
		animation-duration: 2s;
		animation-iteration-count: infinite;
		animation-timing-function: ease-in-out;
		animation-direction: alternate-reverse;
	}

	@keyframes borderPulse {
		0% {
			opacity: 0;
		}
		10% {
			opacity: 0.1;
		}
		20% {
			opacity: 0.2;
		}
		30% {
			opacity: 0.3;
		}
		40% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.5;
		}
		60% {
			opacity: 0.6;
		}
		70% {
			opacity: 0.7;
		}
		80% {
			opacity: 0.8;
		}
		90% {
			opacity: 0.9;
		}
		100% {
			opacity: 1;
		}
	}
</style>
