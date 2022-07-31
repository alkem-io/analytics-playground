/**
 * Simple force directed graph component which displays a specific image for each Node in the
 * place where that Node is arranged by the force directed graph.
 */
import {nodes, svg} from "../config";
import {nodeScale} from './node';

export const imageContainer =
    svg
        .selectAll("g.imageContainer")
        .data(nodes)
        .enter()
        .append("g");

export const image = imageContainer
    .append("image")
    .attr("height", (d) => nodeScale(d.weight))
    .attr("width", (d) => nodeScale(d.weight))
    .attr("transform", (d) =>`translate(${-nodeScale(d.weight)/2}, ${-nodeScale(d.weight)/2})`)
    .attr("href", (d, i) => `image/img-0.png`);

export const animate = () => {

    imageContainer
        .attr("transform", (d) => `translate(${d.x}, ${d.y})`);

};
