import React from 'react';
import { Helmet } from 'react-helmet';
import L from 'leaflet';
import axios from 'axios';

import Layout from 'components/Layout';
import Container from 'components/Container';
import Map from 'components/Map';
import Snippet from 'components/Snippet';

const LOCATION = {
	lat: 0,
	lng: 0,
};
const CENTER = [LOCATION.lat, LOCATION.lng];
const DEFAULT_ZOOM = 2;

const IndexPage = () => {
	/**
	 * mapEffect
	 * @description Fires a callback once the page renders
	 * @example fetch the data from API, create a geoJson document of type FeatureCollection with a country feature to loop through finding the lat and lng
	 */

	async function mapEffect({ leafletElement: map } = {}) {
		let response;

		try {
			response = await axios.get('https://corona.lmao.ninja/v2/countries');
			// console.log(response);
		} catch (e) {
			console.log(`Failed to fetch countries: ${e.message}`, e);
			return;
		}

		const { data = [] } = response;
		const hasData = Array.isArray(data) && data.length > 0;

		// Trying to find the max and min cases to normalize data
		var min = data[0].casesPerOneMillion;
		var max = data[0].casesPerOneMillion;
		var i;
		for (i = 0; i < data.length; i++) {
			if (data[i].casesPerOneMillion < min) min = data[i].casesPerOneMillion;
			if (data[i].casesPerOneMillion > max) max = data[i].casesPerOneMillion;
		}

		if (!hasData) return;
		// console.log(data);
		const geoJson = {
			type: 'FeatureCollection',
			features: data.map((country = {}) => {
				const { countryInfo = {} } = country;
				const { lat, long: lng } = countryInfo;
				return {
					type: 'Feature',
					properties: {
						...country,
					},
					geometry: {
						type: 'Point',
						coordinates: [lng, lat],
					},
				};
			}),
		};

		const geoJsonLayers = new L.GeoJSON(geoJson, {
			pointToLayer: (feature = {}, latlng) => {
				const { properties = {} } = feature;
				let updatedFormatted;
				let casesString;

				const {
					country,
					updated,
					cases,
					deaths,
					recovered,
					casesPerOneMillion,
				} = properties;

				casesString = `${cases}`;

				if (cases > 1000) {
					casesString = `${casesString.slice(0, -3)}k+`;
				}

				if (updated) {
					updatedFormatted = new Date(updated).toLocaleString();
				}

				// let color1 = `rgb(244, 226, 216)`;
				// let color2 = `rgb(186, 83, 112)`;
				let color2 = [244, 226, 216];
				let color1 = [186, 83, 112];
				var p = (cases - min) / (max - min);
				var w = p * 2 - 1;
				var w1 = (w / 1 + 1) / 2;
				var w2 = 1 - w1;
				var iconColor = [
					Math.round(color1[0] * w1 + color2[0] * w2),
					Math.round(color1[1] * w1 + color2[1] * w2),
					Math.round(color1[2] * w1 + color2[2] * w2),
				];
				iconColor = `rgb(${iconColor[0]},${iconColor[1]},${iconColor[2]})`;

				const html = `
        	<span class="icon-marker" style="background-color: ${iconColor};">
          	<span class="icon-marker-tooltip" style="background-color: ${iconColor};">
            <h2>${country}</h2>
            <ul>
              <li><strong>Confirmed:</strong> ${cases}</li>
              <li><strong>Deaths:</strong> ${deaths}</li>
              <li><strong>Recovered:</strong> ${recovered}</li>
              <li><strong>Last Update:</strong> ${updatedFormatted}</li>
            </ul>
          </span>
          ${casesString}
        </span>
      `;

				return L.marker(latlng, {
					icon: L.divIcon({
						className: 'icon',
						html,
					}),
					riseOnHover: true,
				});
			},
		});

		geoJsonLayers.addTo(map);
	}

	const mapSettings = {
		center: CENTER,
		defaultBaseMap: 'OpenStreetMap',
		zoom: DEFAULT_ZOOM,
		mapEffect,
	};

	return (
		<Layout pageName="home">
			<Helmet>
				<title>Home Page</title>
			</Helmet>

			<Map {...mapSettings} c />
			<div id="slider"></div>
			<p style={{ textAlign: 'left' }}>
				{'Less cases'}
				<span style={{ float: 'right' }}>{'More cases'}</span>
			</p>

			<Container type="content" className="text-center home-start">
				<h2>Welcome to another COVID-19 stats website!</h2>
				<p>This welcome page displays stats from all over the world for different countries.</p>
				<p>The color of each country icon represents the confirmed cases per million of the population.
				</p>
			</Container>
		</Layout>
	);
};

export default IndexPage;
