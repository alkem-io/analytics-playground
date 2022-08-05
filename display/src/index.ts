import * as d3 from 'd3';
import { GraphDataProvider } from './graph/GraphDataProvider';
import { GraphVizualization } from './graph/GraphVizualization';
import { GraphVizualizationControls } from './graph/GraphVizualizationControls';
import { LifecycleDataProvider } from './lifecycle/LifecycleDataProvider';
import { LifecycleVisualization } from './lifecycle/LifecycleVisualization';


// Make the DOM locations available
const graphSvg = d3.select("#graph-svg");
const lifecycleSvg = d3.select("#lifecycle-svg");
const hubSelector = d3.select('#HubSelector');


// Load
const graphDataFileLocation = 'data/transformed-graph-data.json';
const graphDataProvider = new GraphDataProvider();
await graphDataProvider.loadData(graphDataFileLocation);

const graphControls = new GraphVizualizationControls(hubSelector, graphDataProvider);
graphControls.logInfo();
const forceGraph = new GraphVizualization(graphSvg, graphDataProvider, 900, 600);
forceGraph.updateGraph();

hubSelector.on('change', function () {
  const selectedHubOption = d3.select(this);
  const selectedHubID = selectedHubOption.property('value');
  console.log(`Hub selected: ${selectedHubID}`);
  graphDataProvider.filterToHub(selectedHubID);
  forceGraph.updateGraph();
});

const lifecycleData = new LifecycleDataProvider();
await lifecycleData.loadData('data/lifecycle/innovation-flow.json');
lifecycleData.updateState("awaitingApproval");
const lifecycleViz = new LifecycleVisualization(lifecycleSvg, lifecycleData, 800, 600);
lifecycleViz.displayLifecycle();