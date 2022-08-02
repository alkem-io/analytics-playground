import * as d3 from 'd3';
import { IData } from './model/data.interface';
import { IEdge } from './model/edge.interface';
import { INode } from './model/node.interface';

export class DataLoader {

  selectedHubID = '';
  data: IData | undefined = undefined;
  nodes: INode[] = [];

  constructor() {}

  async loadData() {
     this.data = await d3.json("data/transformed-data.json");
     const nodes = this.data?.nodes;
     if (nodes) {
      this.nodes = (nodes.hubs).concat(nodes.challenges).concat(nodes.opportunities).concat(nodes.contributors);
    }
    return this.data;
  }


filterToHub(hubID: string)  {
  this.selectedHubID = hubID;
}

getHubNodes() {
  if (!this.data) throw new Error('Not loaded');
  return this.data.nodes.hubs;
}

getFilteredNodes(): INode[] {

  if (!this.data) throw new Error('Not loaded');
  console.log(`filtering to hub with ID: ${this.selectedHubID}`);
  if (this.selectedHubID === '') return this.nodes;
  const result = this.nodes.filter(node => node.group === this.selectedHubID);

  console.log(`filter resulted in ${result.length} nodes.`);
  return result;
};

getFilteredEdges(): IEdge[] {
  if (!this.data) throw new Error('Not loaded');
  console.log(`filtering edges to hub with ID: ${this.selectedHubID}`);
  if (this.selectedHubID === '') return this.data.edges;
  const result = this.data.edges.filter(edge => edge.group === this.selectedHubID);

  console.log(`filter resulted in ${result.length} edges.`);
  return result;
};

}