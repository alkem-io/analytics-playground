import { hubSelector, hubNodes, svg, filterToHub, filteredNodes, filteredEdges } from './config.js';
import * as d3 from 'd3';
import {animate as animateLink} from "./src/link";
//import {animate as animateLabel} from "./src/label";
//import {animate as animateImage} from "./src/image";
import {animate as animateHovercard} from "./src/hovercard";
import {animate as animateNode} from "./src/node";
import {simulation} from "./src/simulation";

// Add in a Hub selection for each Hub in the data set
hubSelector
  .selectAll('option.hub')
  .data(hubNodes)
  .join('option')
  .attr('id', d => d.id)
  .attr("class", "hub")
  .attr('value', d => d.id)
  .text(d => d.displayName);


// // handle selecting a single Hub
hubSelector.on('change', function() {
    const selectedHubOption = d3.select(this);
    const selectedHubID = selectedHubOption.property('value');
    console.log(`Hub selected: ${selectedHubID}`);
    filterToHub(selectedHubID);
    const myNodes = filteredNodes();
    console.log(`filter resulted in ${myNodes.length} nodes.`);

    const myEdges = filteredEdges();
    console.log(`filter resulted in ${myEdges.length} edges.`);

    simulation.restart();
    });

simulation.on("tick", () => {
  animateNode();
  animateLink();
  animateHovercard();
  //animateLabel();
  //animateImage();
});

// allow zooming
function handleZoom(e) {
  svg.selectAll('.nodes').attr('transform', e.transform);
  svg.selectAll('.links').attr('transform', e.transform);
  svg.selectAll('.hovercard').attr('transform', e.transform);
}
let zoom = d3.zoom().on('zoom', handleZoom);

svg.call(zoom);
