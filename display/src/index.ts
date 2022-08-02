import { hubSelector, svg, dataLoader } from './config.js';
import * as d3 from 'd3';
import { animate as animateLink } from './link';
//import {animate as animateLabel} from "./src/label";
//import {animate as animateImage} from "./src/image";
import { animate as animateHovercard } from './hovercard';
import { animate as animateNode } from './node';
import { simulation } from './simulation';

// Add in a Hub selection for each Hub in the data set
hubSelector
  .selectAll('option.hub')
  .data(dataLoader.getHubNodes())
  .join('option')
  .attr('id', (d: any) => d.id)
  .attr('class', 'hub')
  .attr('value', (d: any) => d.id)
  .text((d: any) => d.displayName);

// // handle selecting a single Hub
hubSelector.on('change', function () {
  const selectedHubOption = d3.select(this);
  const selectedHubID = selectedHubOption.property('value');
  console.log(`Hub selected: ${selectedHubID}`);
  dataLoader.filterToHub(selectedHubID);
  const myNodes = dataLoader.getFilteredNodes();
  console.log(`filter resulted in ${myNodes.length} nodes.`);

  const myEdges = dataLoader.getFilteredEdges();
  console.log(`filter resulted in ${myEdges.length} edges.`);

  simulation.restart();
});

simulation.on('tick', () => {
  animateNode();
  animateLink();
  animateHovercard();
  //animateLabel();
  //animateImage();
});

// allow zooming
function handleZoom(e: any) {
  svg.selectAll('.nodes').attr('transform', e.transform);
  svg.selectAll('.links').attr('transform', e.transform);
  svg.selectAll('.hovercard').attr('transform', e.transform);
}
let zoom = d3.zoom().on('zoom', handleZoom);

svg.call(zoom);
