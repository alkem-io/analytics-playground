import { hubSelector, hubNodes, svg } from './config.js';
import * as d3 from 'd3';
import {animate as animateLink} from "./src/link";
//import {animate as animateLabel} from "./src/label";
//import {animate as animateImage} from "./src/image";
import {animate as animateHovercard} from "./src/hovercard";
import {animate as animateEllipseNode} from "./src/node";
import {simulation} from "./src/simulation";

// Add in a Hub selection for each Hub in the data set
hubSelector
  .selectAll('option.hub')
  .data(hubNodes)
  .join('option')
  .attr('id', d => d.id)
  .attr("class", "hub")
  .attr('value', d => d.displayName)
  .text(d => d.displayName);

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

simulation.on("tick", () => {
  animateEllipseNode();
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
