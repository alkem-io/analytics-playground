import * as d3 from 'd3';
import { GraphDataProvider } from './graph/GraphDataProvider';
import { GraphVizualization } from './graph/GraphVizualization';
import { LifecycleDataProvider } from './lifecycle/LifecycleDataProvider';
import { LifecycleVisualization } from './lifecycle/LifecycleVisualization';


// Make the DOM locations available
const svgGraph = d3.select("#svg-graph");
const svgLifecycle = d3.select("#svg-lifecycle");
const hubSelector = d3.select('#HubSelector');


// Load
const graphDataFileLocation = 'data/transformed-graph-data.json';
const graphDataProvider = new GraphDataProvider();
await graphDataProvider.loadData(graphDataFileLocation);

// const testHubID = '758452d0-7c07-4844-9c05-c93f9e35fbc2';
// dataLoader.filterToHub(testHubID);

const forceGraph = new GraphVizualization(svgGraph, graphDataProvider, 800, 600);
forceGraph.addHubSelector(hubSelector);
forceGraph.setLinkScales();
forceGraph.setNodeScales();
forceGraph.displayNodes();
forceGraph.displayLinks();


forceGraph.hovercard.createHoverCard();
forceGraph.simulate();

forceGraph.hovercard.registerHovercard(forceGraph.node, forceGraph.simulation);
forceGraph.registerZoom();

hubSelector.on('change', function () {
  const selectedHubOption = d3.select(this);
  const selectedHubID = selectedHubOption.property('value');
  console.log(`Hub selected: ${selectedHubID}`);
  graphDataProvider.filterToHub(selectedHubID);
  const myNodes = graphDataProvider.getFilteredNodes();
  const myEdges = graphDataProvider.getFilteredEdges();

  //simulation.restart();
});

const lifecycleData = new LifecycleDataProvider();
await lifecycleData.loadData('data/innovation-flow.json');
const lifecycleViz = new LifecycleVisualization(svgLifecycle, lifecycleData, 800, 600);
lifecycleViz.displayLifecycle();