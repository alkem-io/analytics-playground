import * as d3 from 'd3';
import { IData } from './model/data.interface';
import { IEdge } from './model/edge.interface';
import { INode } from './model/node.interface';

export class GraphDataProvider {
  data: IData | undefined = undefined;
  changeNodes: INode[] = [];
  contributorNodes: INode[] = [];
  contributorNodesMap: Map<string, INode>;

  filteredEdges: IEdge[] = [];
  filteredNodes: INode[] = [];

  private showContributorsFlag = true;
  private showContributorsWithoutRolesFlag = false;
  private showSingleHubID = '';

  constructor(showContributors: boolean, showSingleHubID = '' ) {
    this.contributorNodesMap = new Map();
    this.showSingleHubID = showSingleHubID;
    this.showContributorsFlag = showContributors;
    this.showContributorsWithoutRolesFlag = false;
  }

  async loadData(jsonDataFileLocation: string) {
    this.data = await d3.json(jsonDataFileLocation);
    if (!this.data) {
      throw new Error('Unable to load data');
    }
    const nodesGroup = this.data.nodes;

    this.changeNodes = nodesGroup.hubs
      .concat(nodesGroup.challenges)
      .concat(nodesGroup.opportunities);

    this.contributorNodes = nodesGroup.contributors;
    this.contributorNodesMap = new Map();
    for (const contributorNode of this.contributorNodes) {
      this.contributorNodesMap.set(contributorNode.id, contributorNode);
    }

     this.updateFilteredData();
  }

  private showSingleHub(): boolean {
    if (this.showSingleHubID && this.showSingleHubID.length > 0) return true;
    return false;
  }

  private getEdgesFilteredByGroup() {
    if (!this.showSingleHub()) return this.getRawData().edges;

    return this.getRawData().edges.filter(
      edge => edge.group === this.showSingleHubID
    );
  }

  private updateFilteredData() {
    // Filter the edges
    this.filteredEdges = this.getEdgesFilteredByGroup();
    if (!this.showContributorsFlag) {
      this.filteredEdges = this.filteredEdges.filter(edge => edge.type !== "member" && edge.type !== "lead")
    }

    // Filter the nodes
    const changeNodesFiltered = this.getChangeNodesFilteredByGroup();
    // Get the relevant contributors
    const contributors = this.getContributorNodesFilteredByRole();

    this.filteredNodes = changeNodesFiltered.concat(contributors);

    // Deep clone to avoid returning the original data
    const nodesJson = JSON.stringify(this.filteredNodes);
    this.filteredNodes = JSON.parse(nodesJson);
    const edgesJson = JSON.stringify(this.filteredEdges);
    this.filteredEdges = JSON.parse(edgesJson);

    console.log(`Single Hub[${this.showSingleHub()}], contributors (${this.showContributorsFlag}), contributors without roles (${this.showContributorsWithoutRolesFlag}): Data consists of ${changeNodesFiltered.length} change nodes, ${contributors.length} contributors, ${this.filteredEdges.length} edges`)
  }

  getFilteredEdges(): IEdge[] {
    return this.filteredEdges;
  }

  getFilteredNodes(): INode[] {
    return this.filteredNodes;
  }

  private getChangeNodesFilteredByGroup() {
    if (!this.showSingleHub()) return this.changeNodes;

    return this.changeNodes.filter(
      node => node.group === this.showSingleHubID
    );
  }

  showSpecificHub(hubID: string) {
    this.showSingleHubID = hubID;
    this.updateFilteredData();
  }

  showContributorsNoRole(contributorsNoRole: boolean) {
    this.showContributorsWithoutRolesFlag = contributorsNoRole;
    this.updateFilteredData();
  }

  showContributors(showContributors: boolean) {
    this.showContributorsFlag = showContributors;
    this.updateFilteredData();
  }

  getRawHubNodes() {
    if (!this.data) throw new Error('Not loaded');
    return this.data.nodes.hubs;

    // const hubsJson = JSON.stringify(this.data.nodes.hubs);
    // return this.filteredNodes = JSON.parse(hubsJson);
  }

  getHubNodes() {
    if (!this.data) throw new Error('Not loaded');
    // Only return a single hub if only one selected
    if (this.showSingleHub()) {
      const hub = this.data.nodes.hubs.find(
        hub => (hub.id = this.showSingleHubID)
      );
      if (hub) return [hub];
      return [];
    }
    return this.data.nodes.hubs;
  }

  private getContributorNodesFilteredByRole(): INode[] {
    if (!this.showContributorsFlag) {
      return [];
    }
    if (this.showContributorsWithoutRolesFlag) {
      return this.getRawData().nodes.contributors;
    }
    // Get the relevant contributors
    const contributorEdges = this.filteredEdges.filter(e => e.type === 'member' || e.type === 'lead');

    const contributorResultsMap: Map<string, INode> = new Map();
    for (const edge of contributorEdges) {
      const contributorID = edge.sourceID;
      const contributorNode = this.contributorNodesMap.get(contributorID);
      if (!contributorNode) {
        console.log(`Identified edge with unknown contributor:${contributorID} - type: ${edge.type}`);
        continue;
      }
      contributorResultsMap.set(contributorID, contributorNode);
    }
    const result: INode[] = Array.from(contributorResultsMap.values());
    return result;
  }

  getRawData(): IData {
    if (!this.data) throw new Error('Not loaded');
    return this.data;
  }


  getHubEdges(): IEdge[] {
    const result: IEdge[] = [];
    if (this.showSingleHub()) {
      // Only one Hub so no Hub-Hub edges to add
      return result;
    }
    const hubNodes = this.getRawData().nodes.hubs;

    for (let i = 1; i < hubNodes.length; i++) {
      for (let j = 1; j < hubNodes.length; j++) {
        if (j > i) {
          const edge = {
            sourceID: hubNodes[i].id,
            targetID: hubNodes[j].id,
            source: hubNodes[i].id,
            target: hubNodes[j].id,
            weight: 10,
            type: 'hub-hub',
            group: 'hubs',
          };

          result.push(edge);
        }
      }
    }
    return result;
  }
}
