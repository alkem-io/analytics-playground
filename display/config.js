/*
    Configuration file defining shared constants and standardized references, such as the svg target.
*/


import * as d3 from 'd3';
import data from './data/transformed-data.json' assert { type: 'json'};

export const [width, height] = [800,600];

// Make the DOM locations available
export const svg = d3.select("#Target");
export const hubSelector = d3.select('#HubSelector');

// Make the data available
export const contributorNodes = data.nodes.contributors;
export const hubNodes = data.nodes.hubs;
export const challengeNodes = data.nodes.challenges;
export const opportunityNodes = data.nodes.opportunities;
export const nodes = hubNodes.concat(challengeNodes).concat(opportunityNodes).concat(contributorNodes);
export const edges = data.edges;

