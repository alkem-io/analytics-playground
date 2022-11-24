import * as d3 from 'd3';
import { GraphDataProvider } from './graph/GraphDataProvider';
import { GraphVizualization } from './graph/GraphVizualization';
import { GraphVizualizationControls } from './graph/GraphVizualizationControls';
import { MapDataProvider } from './graph/MapDataProvider';
import { LifecycleDataProvider } from './lifecycle/LifecycleDataProvider';
import { LifecycleVisualization } from './lifecycle/LifecycleVisualization';

// Make the DOM locations available
const graphSvg = d3.select('#graph-svg');
const graphHubSelectionControl = d3.select('#graph-hub-selector');
const graphShowContributors = d3.select('#graph-checkbox-show-contributors');
const graphZoomFit = d3.select('#graph-zoom-fit');
const graphZoomPlus = d3.select('#graph-zoom-plus');
const graphZoomMin = d3.select('#graph-zoom-min');

// Graph map related controls
const graphDisplayMap = d3.select('#graph-display-map');
const graphFixContributorsToLocation = d3.select('#graph-contributors-to-location');
const graphFixHubsToLocation = d3.select('#graph-hubs-to-location');

const graphMapSelector = d3.select('#graph-map-selector');

const lifecycleSvg = d3.select('#lifecycle-svg');
const lifecycleSelectionControl = d3.select('#lifecycle-selector');

// Load
const graphDataFileLocation = 'data/transformed-graph-data.json';
const hubID = '14706c25-dc6e-447a-a623-2d19b391985a'; //"c4111e11-edad-48f6-916f-20e11f468848";
graphShowContributors.attr('checked', 'checked');
const graphDataProvider = new GraphDataProvider(true, hubID);
await graphDataProvider.loadData(graphDataFileLocation);


const mapDataProvider = new MapDataProvider();
const mapsToLoad = [ "maps/europe_geo.json", "maps/netherlands-with-regions_geo.json","maps/ireland-with-counties_geo.json"];
for (let i = 0; i < mapsToLoad.length; i++) {
  await mapDataProvider.loadMap(mapsToLoad[i]);
}
mapDataProvider.setSelectedMap(graphMapSelector.property('value'));

graphMapSelector.on('change', function () {
  const selectedMap = graphMapSelector.property('value');
  console.log(`Selecting new map: ${selectedMap}`);
  mapDataProvider.setSelectedMap(selectedMap);

  forceGraph.refreshDisplayedGraph();
});

const graphControls = new GraphVizualizationControls(graphDataProvider);
graphControls.addHubSelectorOptions(graphHubSelectionControl);
const forceGraph = new GraphVizualization(
  graphSvg,
  graphDataProvider,
  mapDataProvider,
  800,
  600
);

graphHubSelectionControl.on('change', function () {
  const selectedHubOption = d3.select(this);
  const selectedHubID = selectedHubOption.property('value');
  graphDataProvider.showSpecificHub(selectedHubID);
  forceGraph.refreshDisplayedGraph();
});

graphShowContributors.on('click', (e: any) => {
  const checked = e.target.checked;
  graphDataProvider.showContributors(checked);
  forceGraph.refreshDisplayedGraph();
});

//graphDisplayMap.attr('checked', 'checked');
graphDisplayMap.on('click', (e: any) => {
  const checked = e.target.checked;
  if (checked) {
    forceGraph.showMap();
  } else {
    forceGraph.hideMap();
  }
});

graphZoomFit.on('click', (e: any) => {
  forceGraph.zoomFit();
});


graphZoomPlus.on('click', (e: any) => {
  forceGraph.zoomPlus();
});

graphZoomMin.on('click', (e: any) => {
  forceGraph.zoomMin();
});
graphFixContributorsToLocation.on('click', (e: any) => {
  forceGraph.fixLocationToMap('user');
  forceGraph.fixLocationToMap('organization');
});
graphFixHubsToLocation.on('click', (e: any) => {
  forceGraph.fixLocationToMap('hub');
  forceGraph.fixLocationToMap('challenge');
  forceGraph.fixLocationToMap('opportunity');
});



/// Lifecycle ///////////////////////
/*let lifecycleVizualization: LifecycleVisualization;
async function displayLifecycleWithData() {
  if (lifecycleVizualization) lifecycleVizualization.removeDisplayedLifecycle();
  const lifecycleData = new LifecycleDataProvider();
  const selectedLifecycle = lifecycleSelectionControl.property('value');
  await lifecycleData.loadData(selectedLifecycle);
  //lifecycleData.updateState('awaitingApproval');
  lifecycleVizualization = new LifecycleVisualization(
    lifecycleSvg,
    lifecycleData,
    800,
    600
  );
  lifecycleVizualization.displayLifecycle();
}
displayLifecycleWithData();

lifecycleSelectionControl.on('change', function () {
  displayLifecycleWithData();
});
*/