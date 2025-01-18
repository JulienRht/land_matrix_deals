import './style.css';
import { Map, View } from 'ol';
import { ImageWMS } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import OSM from 'ol/source/OSM';
// Import pour les données vectorielles
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector';
// Import des éléments pour les styles
import { Circle, Fill, Stroke, Style } from 'ol/style.js';
// import pour l'échelle
import ScaleLine from 'ol/control/ScaleLine.js';
// import pour la rotation au shift + clic (https://openlayers.org/en/latest/examples/drag-rotate-and-zoom.html)
import {DragRotateAndZoom, defaults as defaultInteractions,} from 'ol/interaction.js';


// Couche OSM de l’objet Map pour la stocker dans une variable
const couche_osm = new TileLayer({ source: new OSM() });

// Création de la couche deal en indiquant la source WMS
const deals = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8080/geoserver/land_matrix_agri/wms',
    params: { 'LAYERS': 'land_matrix_agri:deals' },
    serverType: 'geoserver',
  }),
});

// Création de la couche deal_by_country en indiquant la source WMS
const deals_by_country = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8080/geoserver/land_matrix_agri/wms',
    params: { 'LAYERS': 'land_matrix_agri:deals_by_country' },
    serverType: 'geoserver',
  }),
});

// Création de la couche deal_by_country en indiquant la source WMS
const deals_by_country_centroid = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8080/geoserver/land_matrix_agri/wms',
    params: { 'LAYERS': 'land_matrix_agri:deals_by_country_centroid' },
    serverType: 'geoserver',
  }),
});

// Importer la couche des centroides (vectorielle) en indiquant sa source WFS
const layerCentroid = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'http://localhost:8080/geoserver/land_matrix_agri/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=land_matrix_agri:deals_by_country_centroid&maxFeatures=50&outputFormat=application/json',
  }),
});

// Créer un style pour les centroides
const styleCentroid = new Style({
  image: new Circle({
    radius: 10,
    fill: new Fill({ color: 'rgb(245, 182, 81, 0.8)' }),
    stroke: new Stroke({ color: 'rgb(255, 148, 112)', width: 1 }),
    opacity: 0.33,
  }),
});

// Créer une couche vect. des centroides en appliquant le style (le nombre de deals)
function getStyleCentroid(feature) {
  const nDeals = feature.get('n_deals');
  const rayon = Math.sqrt(nDeals) * 5;
  const style = new Style({
    image: new Circle({
      radius: rayon,
      fill: new Fill({ color: 'rgb(225, 179, 117, 0.65)' }),
      stroke: new Stroke({ color: 'rgb(0, 0, 0)', width: 0.5 }),
    }),
  });
  return style;
}

const layerCentroid_ndeals = new VectorLayer({
  source: layerCentroid.getSource(),
  style: getStyleCentroid,
});

// Création de l’objet map avec appel des couches et des controles
// Créez l'objet de type ScaleLine
const scaleline = new ScaleLine();

const map = new Map({
  target: 'map',
  interactions: defaultInteractions().extend([new DragRotateAndZoom()]), // permet de rotate et zommer (shift + clic)
  layers: [couche_osm, deals_by_country, layerCentroid_ndeals, deals], // les couches
  controls: [scaleline],  // Ajoutez l'échelle
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});


// Gestion de la checkbox (afficher/masquer deals_by_country)
const checkboxDealsByCountry = document.getElementById('checkbox-countries');
checkboxDealsByCountry.addEventListener('change', (event) => {
  deals_by_country.setVisible(event.currentTarget.checked);
  updateLegendsVisibility(); // Met à jour la visibilité des légendes
});

// Gestion des radio buttons (soit deals, soit centroides)
const radioDeals = document.getElementById('radio-deals');
const radioCentroides = document.getElementById('radio-centroides');

// Par défaut, la couche centroides n'est pas visible
layerCentroid_ndeals.setVisible(false);

radioDeals.addEventListener('change', () => {
  if (radioDeals.checked) {
    deals.setVisible(true); // Afficher la couche deals
    layerCentroid_ndeals.setVisible(false); // Masquer les centroides
    document.getElementById('production').setAttribute('style', 'visibility:visible'); // Afficher le menu de filtrage
    updateLegendsVisibility(); // Mettre à jour la légende de deals
  }
});

radioCentroides.addEventListener('change', () => {
  if (radioCentroides.checked) {
    deals.setVisible(false); // Masquer la couche deals
    layerCentroid_ndeals.setVisible(true); // Afficher les centroides
    document.getElementById('production').setAttribute('style', 'visibility:hidden'); // Masquer le menu de filtrage
    updateLegendsVisibility(); // Mettre à jour la légende des centroides
  }
});


// Le filtrage par type de production
const buttonAll = document.getElementById('button-all');
buttonAll.addEventListener('change', () => {
  // Quand l’utilisateur clique sur "Tous", aucun filtre n'est appliqué
  deals.getSource().updateParams({ 'CQL_FILTER': '' });
});

const buttonSoya = document.getElementById('button-soya');
buttonSoya.addEventListener('change', () => {
  // Quand l’utilisateur clique sur "Soya Beans", filtre CQL pour "soya_beans=TRUE"
  deals.getSource().updateParams({ 'CQL_FILTER': 'soya_beans=TRUE' });
});

const buttonPalm = document.getElementById('button-palm');
buttonPalm.addEventListener('change', () => {
  // Quand l’utilisateur clique sur "Oil Palm", filtre CQL pour "oil_palm=TRUE"
  deals.getSource().updateParams({ 'CQL_FILTER': 'oil_palm=TRUE' });
});

const buttonCane = document.getElementById('button-cane');
buttonCane.addEventListener('change', () => {
  // Quand l’utilisateur clique sur "Sugar Cane", filtre CQL pour "sugar_cane=TRUE"
  deals.getSource().updateParams({ 'CQL_FILTER': 'sugar_cane=TRUE' });
});


// Initialisation des radio buttons et checkbox (ce qui est coché par défaut)
checkboxDealsByCountry.checked = true;
radioDeals.checked = true;
radioCentroides.checked = false;
buttonAll.checked = true;


// Fonction au clic sur la carte pour l'affichage des attributs dans une table
map.on('singleclick', (event) => {

  const coord = event.coordinate;
  const res = map.getView().getResolution();
  const proj = 'EPSG:3857';
  const parametres = {'INFO_FORMAT': 'application/json'};

  const url = deals.getSource().getFeatureInfoUrl(coord, res, proj, parametres); // appeller la source de la couche deals

  if (url) {
    fetch(url)
      .then((response) => response.text())
      .then((json) => {
        const obj = JSON.parse(json);
        if (obj.features[0]) {
          const properties = obj.features[0].properties;
          
          // On affiche les attributs dans notre table
          document.getElementById('table-deal-id').innerHTML = properties.deal_id || '…';
          document.getElementById('table-creation-date').innerHTML = properties.created_at || '…';
          document.getElementById('table-country').innerHTML = properties.target_country || '…';
          document.getElementById('table-crops').innerHTML = properties.crops || '…';

        } else {
          // On a cliqué "nulle part" donc on remet des … dans la colonne
          document.getElementById('table-deal-id').innerHTML = '…';
          document.getElementById('table-creation-date').innerHTML = '…';
          document.getElementById('table-country').innerHTML = '…';
          document.getElementById('table-crops').innerHTML = '…';
        }
      });
  }
});


// Fonction pour mettre à jour la légende
function updateLegend(source, imgId) {
  const resolution = map.getView().getResolution();
  const legendUrl = source.getLegendUrl(resolution, { 'LEGEND_OPTIONS': 'forceLabels:on' });
  document.getElementById(imgId).src = legendUrl;
}

// Mise à jour des légendes
function updateLegends() {
  const resolution = map.getView().getResolution();
  
  // Mettre à jour la légende des deals
  if (deals.getVisible()) {
    updateLegend(deals.getSource(), 'legend-deals');
  }
  
  // Mettre à jour la légende des deals by country
  if (deals_by_country.getVisible()) {
    updateLegend(deals_by_country.getSource(), 'legend-deals-by-country');
  }

  // Mettre à jour la légende des centroides
  if (layerCentroid_ndeals.getVisible()) {
    updateLegend(layerCentroid_ndeals.getSource(), 'legend-centroids');
  }
}


// Fonction pour mettre à jour la visibilité des légendes
function updateLegendsVisibility() {
  const legendDeals = document.getElementById('legend-deals');
  const legendDealsByCountry = document.getElementById('legend-deals-by-country');
  const legendCentroids = document.getElementById('legend-centroids');
  const attributesTable = document.getElementById('attributes'); // Ajoutez cette ligne

  // Met à jour la visibilité des légendes
  if (deals.getVisible()) {
    legendDeals.style.display = 'block'; // Affiche la légende de "Deals"
    attributesTable.style.display = 'block'; // Affiche la table des deals
  } else {
    legendDeals.style.display = 'none'; // Cache la légende de "Deals"
    attributesTable.style.display = 'none'; // Cache la table des deals
  }

  if (deals_by_country.getVisible()) {
    legendDealsByCountry.style.display = 'block'; // Affiche la légende de "Deals by Country"
  } else {
    legendDealsByCountry.style.display = 'none'; // Cache la légende de "Deals by Country"
  }

  // Vérifiez si la couche des centroides est visible
  if (layerCentroid_ndeals.getVisible()) {
    legendCentroids.style.display = 'block'; // Affiche la légende des centroides
  } else {
    legendCentroids.style.display = 'none'; // Cache la légende des centroides
  }
}

// Initialisation des légendes au début
updateLegends();
updateLegendsVisibility();

// Mise à jour des légendes à chaque changement de résolution
map.getView().on('change:resolution', function () {
  updateLegends();
});


// Fct pour mettre à jour les cercles de la légende
function updateLegendCircleSize(dealsCount, circleId) {
  const circleElement = document.getElementById(circleId);
  const radius = Math.sqrt(dealsCount) * 2; // facteur de mise à l'échelle
  circleElement.style.width = `${radius * 2}px`; // Diamètre
  circleElement.style.height = `${radius * 2}px`; 
}

// Mise à jour des cercles dans la légende
updateLegendCircleSize(50, 'circle-50');
updateLegendCircleSize(100, 'circle-100');
updateLegendCircleSize(200, 'circle-200');
updateLegendCircleSize(500, 'circle-500');