/**
 * Force directed graph component which displays the name associated with any Node at the place
 * that the Node is arranged by the force directed graph.
 */
import * as d3 from "d3";
import {nodes, svg} from "../config";
import {nodeScale} from "./node";

const fontSizeScale = d3.scaleLinear()
    .domain([0, d3.max(nodes.map((node) => node.weight))])
    .range([7, 12]);

const textContainer = svg
    .append('g')
    .attr('class', 'textContainer')
    .selectAll("g.label")
    .data(nodes)
    .enter()
    .append("g");

textContainer
    .append("text")
    .text((d) => d.name)
    .attr("font-size", (d) => fontSizeScale(d.weight))
    .attr("transform", (d) => {

        const scale = nodeScale(d.weight);
        const x = scale + 2;
        const y = scale + 4;
        return `translate(${x}, ${y})`;

    });


export const animate = () => {

    textContainer
        .attr("transform", (d) => `translate(${d.x}, ${d.y})`);

};