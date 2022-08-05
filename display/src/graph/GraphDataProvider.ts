import * as d3 from 'd3';
import { IData } from './model/data.interface';
import { IEdge } from './model/edge.interface';
import { INode } from './model/node.interface';

export class GraphDataProvider {
  selectedHubID = '';
  data: IData | undefined = undefined;
  nodes: INode[] = [];

  constructor() {}

  async loadData(jsonDataFileLocation: string): Promise<IData> {
    this.data = await d3.json(jsonDataFileLocation);
    if (!this.data) {
      throw new Error('Unable to load data');
    }
    const nodesGroup = this.data.nodes;

    this.nodes = nodesGroup.hubs
      .concat(nodesGroup.challenges)
      .concat(nodesGroup.opportunities)
      .concat(nodesGroup.contributors);

    return this.data;
  }

  filterToHub(hubID: string) {
    this.selectedHubID = hubID;
  }

  getHubNodes() {
    if (!this.data) throw new Error('Not loaded');
    return this.data.nodes.hubs;
  }

  getFilteredNodes(): INode[] {
    if (!this.data) throw new Error('Not loaded');
    if (this.selectedHubID === '') return this.nodes;
    const result = this.nodes.filter(
      node => node.group === this.selectedHubID || node.group === 'contributors'
    );

    console.log(`filter resulted in ${result.length} nodes.`);
    return result;
  }

  getFilteredEdges(): IEdge[] {
    if (!this.data) throw new Error('Not loaded');
    if (this.selectedHubID === '') return this.data.edges;
    const result = this.data.edges.filter(
      edge => edge.group === this.selectedHubID
    );

    console.log(`filter resulted in ${result.length} edges.`);
    return result;
  }
}
