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
const graphScaleToFit = d3.select('#graph-scale-to-fit');
const graphDisplayMap = d3.select('#graph-display-map');

const lifecycleSvg = d3.select('#lifecycle-svg');
const lifecycleSelectionControl = d3.select('#lifecycle-selector');

// Load
const graphDataFileLocation = 'data/transformed-graph-data.json';
const hubID = ''; //"c4111e11-edad-48f6-916f-20e11f468848";
graphShowContributors.attr('checked', 'checked');
const graphDataProvider = new GraphDataProvider(true, hubID);
await graphDataProvider.loadData(graphDataFileLocation);


const countriesGeoJsonFileLocation = 'data/europe.geo.json';
const mapDataProvider = new MapDataProvider(countriesGeoJsonFileLocation);
await mapDataProvider.loadData();

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
  console.log(`Display map: ${checked}`);
  if (checked) {
    forceGraph.displayMap();
  } else {
    forceGraph.removeMap();
  }
});

graphScaleToFit.on('click', (e: any) => {
  forceGraph.scaleToFit();
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
