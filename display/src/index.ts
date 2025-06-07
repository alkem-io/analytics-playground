import { select } from 'd3-selection';
import { GraphDataProvider } from './graph/GraphDataProvider';
import { GraphVizualization } from './graph/GraphVizualization';
import { GraphVizualizationControls } from './graph/GraphVizualizationControls';
import { MapDataProvider } from './graph/MapDataProvider';
import { LifecycleDataProvider } from './lifecycle/LifecycleDataProvider';
import { LifecycleVisualization } from './lifecycle/LifecycleVisualization';
import { NodeType } from '../../lib/src/common/node.type';

// Make the DOM locations available
const graphSvg = select('#graph-svg');
const graphSpaceSelectionControl = select('#graph-space-selector');
const graphShowContributors = select('#graph-checkbox-show-contributors');
const graphZoomFit = select('#graph-zoom-fit');
const graphZoomPlus = select('#graph-zoom-plus');
const graphZoomMin = select('#graph-zoom-min');

// Graph map related controls
const graphDisplayMap = select('#graph-display-map');
const graphFixContributorsToLocation = select('#graph-contributors-to-location');
const graphFixSpacesToLocation = select('#graph-spaces-to-location');

const graphMapSelector = select('#graph-map-selector');

const lifecycleSvg = select('#lifecycle-svg');
const lifecycleSelectionControl = select('#lifecycle-selector');

// Load
const graphDataFileLocation = 'data/transformed-graph-data.json';
const spaceID = ''; //"c4111e11-edad-48f6-916f-20e11f468848";
graphShowContributors.attr('checked', 'checked');
const graphDataProvider = new GraphDataProvider(true, spaceID);
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
graphControls.addSpaceSelectorOptions(graphSpaceSelectionControl);
const forceGraph = new GraphVizualization(
  graphSvg,
  graphDataProvider,
  mapDataProvider,
  800,
  600
);

graphSpaceSelectionControl.on('change', function () {
  const selectedSpaceOption = select(this);
  const selectedSpaceID = selectedSpaceOption.property('value');
  graphDataProvider.showSpecificSpace(selectedSpaceID);
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
  forceGraph.fixLocationToMap(NodeType.USER);
  forceGraph.fixLocationToMap(NodeType.ORGANIZATION);
});
graphFixSpacesToLocation.on('click', (e: any) => {
  forceGraph.fixLocationToMap(NodeType.SPACE_L0);
  forceGraph.fixLocationToMap(NodeType.SPACE_L1);
  forceGraph.fixLocationToMap(NodeType.SPACE_L2);
});



/// Lifecycle ///////////////////////
let lifecycleVizualization: LifecycleVisualization;
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
