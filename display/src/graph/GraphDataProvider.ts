import { json } from 'd3-fetch';
import { IDisplayData } from './model/data.interface';
import { GraphNodeSpaceModel } from '../../../transform/src/model/graph/graphNodeSpace';
import { GraphNodeContributorModel } from '../../../transform/src/model/graph/graphNodeContributor';
import { GraphEdgeModel } from '../../../transform/src/model/graph/graphEdge';
import { GraphNodeModel } from '../../../transform/src/model/graph/graphNode';

export class GraphDataProvider {
  data: IDisplayData | undefined = undefined;
  // All the spaces, challenges, opportunities
  spaceNodes: GraphNodeSpaceModel[] = [];
  spaceNodesMap: Map<string, GraphNodeSpaceModel>;
  // All the contributors: users, organizations
  contributorNodes: GraphNodeContributorModel[] = [];
  contributorNodesMap: Map<string, GraphNodeContributorModel>;

  filteredEdges: GraphEdgeModel[] = [];
  filteredNodes: GraphNodeModel[] = [];

  private showContributorsFlag = true;
  private showContributorsWithoutRolesFlag = false;
  private showSingleSpaceID = '';

  constructor(showContributors: boolean, showSingleSpaceID = '') {
    this.contributorNodesMap = new Map();
    this.spaceNodesMap = new Map();
    this.showSingleSpaceID = showSingleSpaceID;
    this.showContributorsFlag = showContributors;
    this.showContributorsWithoutRolesFlag = false;
  }

  async loadData(jsonDataFileLocation: string) {
    this.data = await json(jsonDataFileLocation);
    if (!this.data) {
      throw new Error('Unable to load data');
    }
    const nodesGroup = this.data.nodes;

    this.spaceNodes = nodesGroup.spacesL0
      .concat(nodesGroup.spacesL2)
      .concat(nodesGroup.spacesL1);
    for (const spaceNode of this.spaceNodes) {
      this.spaceNodesMap.set(spaceNode.id, spaceNode);
    }

    this.contributorNodes = nodesGroup.contributors;
    this.contributorNodesMap = new Map();
    for (const contributorNode of this.contributorNodes) {
      this.contributorNodesMap.set(contributorNode.id, contributorNode);
    }

    const validData = this.validateData();
    if (!validData) {
      throw new Error(`Data is not valid`);
    }
    this.updateFilteredData();
  }

  private validateData() {
    if (!this.data?.edges) {
      throw new Error('No data');
    }
    let result = true;
    // Check that all the nodes specified in the edges are known
    for (const edge of this.data?.edges) {
      const sourceFound = this.validateNodeExists(edge.sourceID);
      const targetFound = this.validateNodeExists(edge.targetID);
      if (!sourceFound || !targetFound) {
        result = false;
      }
    }
    return result;
  }

  private validateNodeExists(nodeID: string): boolean {
    const contributorNode = this.contributorNodesMap.get(nodeID);
    if (!contributorNode) {
      const spaceNode = this.spaceNodesMap.get(nodeID);
      if (!spaceNode) {
        console.log(`Unable to find node with ID: ${nodeID}`);
        return false;
      }
    }
    return true;
  }

  private showSingleSpace(): boolean {
    if (this.showSingleSpaceID && this.showSingleSpaceID.length > 0) return true;
    return false;
  }

  private getEdgesFilteredByGroup() {
    if (!this.showSingleSpace()) return this.getRawData().edges;

    return this.getRawData().edges.filter(
      edge => edge.group === this.showSingleSpaceID
    );
  }

  private updateFilteredData() {
    // Filter the edges
    this.filteredEdges = this.getEdgesFilteredByGroup();
    if (!this.showContributorsFlag) {
      this.filteredEdges = this.filteredEdges.filter(
        edge => edge.type !== 'member' && edge.type !== 'lead'
      );
    }

    // Filter the nodes
    const changeNodesFiltered: GraphNodeModel[] = this.getChangeNodesFilteredByGroup();
    // Get the relevant contributors
    const contributors = this.getContributorNodesFilteredByRole();

    this.filteredNodes = changeNodesFiltered.concat(contributors);

    // Deep clone to avoid returning the original data
    const nodesJson = JSON.stringify(this.filteredNodes);
    this.filteredNodes = JSON.parse(nodesJson);
    const edgesJson = JSON.stringify(this.filteredEdges);
    this.filteredEdges = JSON.parse(edgesJson);

    console.log(
      `Single Space[${this.showSingleSpace()}], contributors (${
        this.showContributorsFlag
      }), contributors without roles (${
        this.showContributorsWithoutRolesFlag
      }): Data consists of ${changeNodesFiltered.length} change nodes, ${
        contributors.length
      } contributors, ${this.filteredEdges.length} edges`
    );
  }

  getFilteredEdges(): GraphEdgeModel[] {
    return this.filteredEdges;
  }

  getFilteredNodes(): GraphNodeModel[] {
    return this.filteredNodes;
  }

  private getChangeNodesFilteredByGroup() {
    if (!this.showSingleSpace()) return this.spaceNodes;

    return this.spaceNodes.filter(node => node.group === this.showSingleSpaceID);
  }

  showSpecificSpace(spaceID: string) {
    this.showSingleSpaceID = spaceID;
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

  getRawSpaceNodes() {
    if (!this.data) throw new Error('Not loaded');
    return this.data.nodes.spacesL0;

    // const spacesJson = JSON.stringify(this.data.nodes.spaces);
    // return this.filteredNodes = JSON.parse(spacesJson);
  }

  getSpaceNodes() {
    if (!this.data) throw new Error('Not loaded');
    // Only return a single space if only one selected
    if (this.showSingleSpace()) {
      const space = this.data.nodes.spacesL0.find(
        space => (space.id = this.showSingleSpaceID)
      );
      if (space) return [space];
      return [];
    }
    return this.data.nodes.spacesL0;
  }

  private getContributorNodesFilteredByRole(): GraphNodeModel[] {
    if (!this.showContributorsFlag) {
      return [];
    }
    if (this.showContributorsWithoutRolesFlag) {
      return this.getRawData().nodes.contributors;
    }
    // Get the relevant contributors
    const contributorEdges = this.filteredEdges.filter(
      e => e.type === 'member' || e.type === 'lead'
    );

    const contributorResultsMap: Map<string, GraphNodeModel> = new Map();
    for (const edge of contributorEdges) {
      const contributorID = edge.sourceID;
      const contributorNode = this.contributorNodesMap.get(contributorID);
      if (!contributorNode) {
        console.log(
          `Identified edge with unknown contributor:${contributorID} - type: ${edge.type}`
        );
        continue;
      }
      contributorResultsMap.set(contributorID, contributorNode);
    }
    const result: GraphNodeModel[] = Array.from(contributorResultsMap.values());
    return result;
  }

  getRawData(): IDisplayData {
    if (!this.data) throw new Error('Not loaded');
    return this.data;
  }

  getSpaceEdges(): GraphEdgeModel[] {
    const result: GraphEdgeModel[] = [];
    if (this.showSingleSpace()) {
      // Only one Space so no Space-Space edges to add
      return result;
    }
    const spaceNodes = this.getRawData().nodes.spacesL0;

    for (let i = 1; i < spaceNodes.length; i++) {
      for (let j = 1; j < spaceNodes.length; j++) {
        if (j > i) {
          const edge = {
            sourceID: spaceNodes[i].id,
            targetID: spaceNodes[j].id,
            source: spaceNodes[i].id,
            target: spaceNodes[j].id,
            weight: 10,
            type: 'space-space',
            group: 'spaces',
          };

          result.push(edge);
        }
      }
    }
    return result;
  }
}
