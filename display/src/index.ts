import * as d3 from 'd3';
import { DataLoader } from './DataLoader';
import { ForceGraph } from './ForceGraph';

export const width = 800;
export const height = 600;

// Make the DOM locations available
export const svg = d3.select("#Target");
export const hubSelector = d3.select('#HubSelector');

// Load
export const dataLoader = new DataLoader();
const data: any = await dataLoader.loadData();
// const testHubID = '758452d0-7c07-4844-9c05-c93f9e35fbc2';
// dataLoader.filterToHub(testHubID);

export const forceGraph = new ForceGraph(svg, dataLoader, width, height);
forceGraph.addHubSelector(hubSelector);
forceGraph.setLinkScales();
forceGraph.setNodeScales();
forceGraph.displayNodes();
forceGraph.displayLinks();


forceGraph.hovercard.createHoverCard();
forceGraph.hovercard.registerHovercard(forceGraph.node, forceGraph.simulation);
forceGraph.simulate();
forceGraph.registerZoom();

hubSelector.on('change', function () {
  const selectedHubOption = d3.select(this);
  const selectedHubID = selectedHubOption.property('value');
  console.log(`Hub selected: ${selectedHubID}`);
  dataLoader.filterToHub(selectedHubID);
  const myNodes = dataLoader.getFilteredNodes();
  const myEdges = dataLoader.getFilteredEdges();

  //simulation.restart();
});
