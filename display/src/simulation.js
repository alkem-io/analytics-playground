/**
 * Defines the simulation, which is what determines where each Node should be arranged. Uses math.
 */
import * as d3 from "d3";
import {nodes, edges, height, width} from "../config";

/**
 * Gravity determines how strongly the nodes push / pull eachother.
 * In effect, the lower the number goes, the more spread out the graph will be.
 */

const gravity = -100;

const forceManyBody = d3.forceManyBody()
    .strength(gravity);

const forceLink = d3.forceLink(edges)
    .id((d) => d.id)
    .distance(150)
    .strength(0.7);

const forceCollision = d3.forceCollide()
        .radius(function (d) {
          return d.radius;
        })
        .strength(-10);

export const simulation = d3.forceSimulation(nodes)
    .force("link", forceLink)
    .force("charge", forceManyBody)
    .force("collision", forceCollision)
    .force("center", d3.forceCenter(width / 2, height / 2));


