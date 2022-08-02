/*
    Configuration file defining shared constants and standardized references, such as the svg target.
*/


import * as d3 from 'd3';
import { Edge } from './model/edge';
import { Node } from './model/node';
import { DataLoader } from './DataLoader';

export const [width, height] = [800,600];

// Make the DOM locations available
export const svg = d3.select("#Target");
export const hubSelector = d3.select('#HubSelector');


// Make the data available
export const dataLoader = new DataLoader();
const data: any = await dataLoader.loadData();
