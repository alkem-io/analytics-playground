import { hubSelector, challengeNodes } from './config.js';
import * as d3 from 'd3';
import {animate as animateLink} from "./src/link";
import {animate as animateLabel} from "./src/label";
import {animate as animateImage} from "./src/image";
import {animate as animateHovercard} from "./src/hovercard";
import {animate as animateEllipseNode} from "./src/node";
import {simulation} from "./src/simulation";


var div = d3.select("body").append("div")
            .attr("class", "tooltip").style("opacity", 0);

// // function that wraps around the d3 pattern (bind, add, update, remove)
// function updateLegend(newData) {

//   // bind data
//   var appending = canvas.selectAll('rect')
//      .data(newData);

//   // add new elements
//   appending.enter().append('rect');

//   // update both new and existing elements
//   appending.transition()
//       .duration(0)
//       .attr("width",function (d) {return d.y; });

//   // remove old elements
//   appending.exit().remove();

// }

// // generate initial legend
// updateLegend(initialValues);

// // handle on click event
hubSelector.on('change', function() {
    console.log(`Hub selected: ${d3.select(this).property('value')}`);
      // var newData = eval(d3.select(this).property('value'));
      // updateLegend(newData);
    });

// Add in a Hub selection for each Hub in the data set
const hubNodes = challengeNodes.filter(node => node.type === 'hub');
hubSelector
  .selectAll('option')
  .data(hubNodes)
  .join('option')
  .attr('id', d => d.id)
  .attr('value', d => d.displayName)
  .text(d => d.displayName);

// Start the visualization
const d3Category10 = d3.schemeCategory10;
var color = d3.scaleOrdinal(d3Category10);

simulation.on("tick", () => {

  /**
   * Calls all the animation subroutines defined by any number of graph elements.
   */

  animateEllipseNode();
  animateLink();
  animateHovercard();
  animateLabel();
  animateImage();

});

// const graphLayout = d3
//   .forceSimulation(nodes)
//   //.force('center', d3.forceCenter(width / 2, height / 2))
//   .force(
//     'link',
//     d3
//       .forceLink(graphData)
//       .id((d, i) => d.id)
//       .distance(200)
//       .strength(0.7)
//   )
//   .force('charge', d3.forceManyBody().strength(-80))
//   .force(
//     'collision',
//     d3
//       .forceCollide()
//       .radius(function (d) {
//         return d.radius;
//       })
//       .strength(-10)
//   );

// const node = svg
//   .append('g')
//   .attr('class', 'nodes')
//   .attr('stroke', '#fff')
//   .attr('stroke-width', 1.5)
//   .selectAll('circle')
//   .data(graphData.nodes)
//   .join('circle')
//   .attr('r', function (d, i) {
//     if (d.type === 'hub') return 50;
//     if (d.type === 'challenge') return 30;
//     if (d.type === 'opportunity') return 20;
//     if (d.type === 'organization') return 10;
//     if (d.type === 'user') return 5;
//     // ??
//     return 15;
//   })
//   .attr('fill', function (d, i) {
//     if (d.type === 'hub') return 'black';
//     if (d.type === 'challenge') return 'red';
//     if (d.type === 'opportunity') return 'blue';
//     if (d.type === 'user') return 'green';
//     if (d.type === 'organization') return 'green';
//     return color(d.type);
//   })
//   .attr('stroke', function (d, i) {
//     if (d.type === 'hub') return 'black';
//     if (d.type === 'challenge') return 'red';
//     if (d.type === 'opportunity') return 'blue';
//     if (d.type === 'user') return 'green';
//     if (d.type === 'organization') return 'black';
//     // is a utxo
//     return color(`${d.who}-xxx`);
//   })
//   .attr('stroke-width', 4)
//   .on('mouseover', mouseOverNode)
//   .on('mouseout', function (d) {
//     div.transition().duration(500).style('opacity', 0);
//   })
//   .call(drag(graphLayout));



// allow zooming
function handleZoom(e) {
  d3.select('svg').selectAll('g').attr('transform', e.transform);
}
let zoom = d3.zoom().on('zoom', handleZoom);

d3.select('svg').call(zoom);
