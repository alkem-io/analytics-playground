/**
 * Simple component which draws a circle for each node wherever it is arranged by the simulation.
 */
import * as d3 from "d3";
import { dataLoader, svg } from "./config";
import { drag } from "./drag";
import { simulation } from "./simulation";

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

const max: number = d3.max(dataLoader.getFilteredNodes().map((node) => node.weight)) || 10;
export const nodeScale = d3
  .scaleLinear()
  .domain([0, max])
  .range([8, 20]);

export const node = svg
  .append("g")
  .attr("class", "nodes")
  .selectAll("circle")
  .data(dataLoader.getFilteredNodes())
  .enter()
  .append("circle")
  .attr("r", (d) => nodeScale(d.weight))
  .attr("stroke", "#251607 ")
  .attr("stroke-width", function (d) {
    if (d.type === "organization") return 2.0;
    return 0.5;
  })
  .style("fill", (d) => colorScale(d.group));

export const animate = () => {
  node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
};

node.call(drag(simulation));