import fs from 'fs';
import { GraphNodeSpaceModel } from '@lib/graph/graphNodeSpace';
import { GraphNodeContributorModel } from '@lib/graph/graphNodeContributor';
import { GraphEdgeModel } from '@lib/graph/graphEdge';
import { NodeType } from '@lib/common/node.type';
import { NodeGroup } from '@lib/common/node.group';
import { NodeWeight } from '@lib/common/node.weight';
import { EdgeWeight } from '@lib/common/edge.weight';
import { EdgeType } from '@lib/common/edge.type';
import { GeoapifyGeocodeHandler } from './handlers/GeoapifyGeocodeHandler';
import { Logger } from 'winston';
import { IDisplayData } from '../../display/src/graph/model/data.interface';
import {
  ContributorModel,
  SpaceModel,
} from '../../acquire/src/model/spaceModel';
import countries from 'i18n-iso-countries';
import { GraphLocationModel } from '@lib/graph/graphLocationModel';
import { GraphProfileModel } from '../../lib/src/graph/graphProfileModel';

countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

const TRANSFORMED_DATA_FILE =
  '../display/public/data/transformed-graph-data.json';

function resolveCountryName(codeOrName: string): string {
  if (!codeOrName) return '';
  const code = codeOrName.trim().toUpperCase();
  // Try ISO-2 and ISO-3
  const name = countries.getName(code, 'en');
  return name || codeOrName;
}

export class AlkemioGraphTransformer {
  logger: Logger;
  geocodeHandler: GeoapifyGeocodeHandler;

  constructor(logger: Logger, geocodeHandler: GeoapifyGeocodeHandler) {
    this.logger = logger;
    this.geocodeHandler = geocodeHandler;
  }

  // Helper to create a NodeSpace for any level
  private async createSpaceNode(
    space: any,
    parentId: string,
    nodeType: NodeType,
    nodeWeight: number,
    url: string,
    leadOrgCount: number
  ): Promise<GraphNodeSpaceModel> {
    const locationData = space.about.profile.location;
    const countryName = resolveCountryName(locationData.country || '');
    const locationExact = await this.geocodeHandler.lookup(
      countryName,
      locationData.city || '',
      space.nameID
    );
    const locationModel: GraphLocationModel = new GraphLocationModel(
      locationData.country || '',
      locationData.city || '',
      locationExact[0],
      locationExact[1]
    );
    const profileModel: GraphProfileModel = new GraphProfileModel(
      space.about.profile.displayName,
      space.about.profile.url || '',
      locationModel
    );
    return new GraphNodeSpaceModel(
      space.id,
      space.nameID,
      nodeType,
      parentId,
      nodeWeight,
      leadOrgCount,
      url,
      profileModel
    );
  }

  // New: Accepts data as parameters
  async transformData({
    users,
    organizations,
    spacesL0,
  }: {
    users: any[];
    organizations: any[];
    spacesL0: SpaceModel[];
  }) {
    // create the graph
    const spaceL0Nodes: GraphNodeSpaceModel[] = [];
    const spaceL1Nodes: GraphNodeSpaceModel[] = [];
    const spaceL2Nodes: GraphNodeSpaceModel[] = [];
    const contributorNodes: GraphNodeContributorModel[] = [];
    const edges: GraphEdgeModel[] = [];

    // Nodes for users + orgs
    for (let i = 0; i < users.length; i++) {
      const contributor = users[i];
      const locationData = contributor.profile.location;
      const countryName = resolveCountryName(locationData.country || '');
      const locationExact = await this.geocodeHandler.lookup(
        countryName,
        locationData.city || '',
        contributor.nameID
      );
      const locationModel: GraphLocationModel = new GraphLocationModel(
        locationData.country || '',
        locationData.city || '',
        locationExact[0],
        locationExact[1]
      );
      const profileModel: GraphProfileModel = new GraphProfileModel(
        contributor.profile.displayName,
        contributor.profile.url || '',
        locationModel
      );
      const contributorNode = new GraphNodeContributorModel(
        contributor.id,
        `${contributor.nameID}`,
        NodeType.USER,
        NodeGroup.CONTRIBUTORS,
        NodeWeight.USER,
        contributor.profile.avatar?.uri,
        profileModel
      );
      contributorNodes.push(contributorNode);
    }

    for (let i = 0; i < organizations.length; i++) {
      const contributor = organizations[i];
      const locationData = contributor.profile.location;
      const countryName = resolveCountryName(locationData.country || '');
      const locationExact = await this.geocodeHandler.lookup(
        countryName,
        locationData.city || '',
        contributor.nameID
      );
      const locationModel: GraphLocationModel = new GraphLocationModel(
        locationData.country || '',
        locationData.city || '',
        locationExact[0],
        locationExact[1]
      );
      const profileModel: GraphProfileModel = new GraphProfileModel(
        contributor.profile.displayName,
        contributor.profile.url || '',
        locationModel
      );
      const contributorNode = new GraphNodeContributorModel(
        contributor.id,
        `${contributor.nameID}`,
        NodeType.ORGANIZATION,
        NodeGroup.CONTRIBUTORS,
        NodeWeight.ORGANIZATION,
        contributor.profile.avatar?.uri,
        profileModel
      );
      contributorNodes.push(contributorNode);
    }

    // Process Spaces
    for (const space of spacesL0) {
      const spaceNode = await this.createSpaceNode(
        space,
        space.id,
        NodeType.SPACE_L0,
        NodeWeight.SPACE_L0,
        space.about.profile.url,
        1
      );
      spaceL0Nodes.push(spaceNode);
      this.addAllCommunityRoleEdges(space, edges, space.id);
    }

    // Process Challenges
    for (const spaceL0 of spacesL0) {
      for (const spaceL1 of spaceL0.subspaces) {
        const spaceL1Node = await this.createSpaceNode(
          spaceL1,
          spaceL0.id,
          NodeType.SPACE_L1,
          NodeWeight.SPACE_L1,
          spaceL1.about.profile.url,
          spaceL1.community.roleSet.leadOrganizations.length
        );
        spaceL1Nodes.push(spaceL1Node);
        const edge = new GraphEdgeModel(
          spaceL1.id,
          spaceL0.id,
          EdgeWeight.CHILD,
          EdgeType.CHILD,
          spaceL0.id
        );
        edges.push(edge);
        this.addAllCommunityRoleEdges(spaceL1, edges, spaceL0.id);
      }
    }

    // Process L2 spaces
    for (const spaceL0 of spacesL0) {
      for (const spaceL1 of spaceL0.subspaces) {
        for (const spaceL2 of spaceL1.subspaces) {
          const spaceL2Node = await this.createSpaceNode(
            spaceL2,
            spaceL1.id,
            NodeType.SPACE_L2,
            NodeWeight.SPACE_L2,
            spaceL2.about.profile.url,
            spaceL2.community.roleSet.leadOrganizations.length
          );
          spaceL2Nodes.push(spaceL2Node);
          const edge = new GraphEdgeModel(
            spaceL2.id,
            spaceL1.id,
            EdgeWeight.CHILD,
            EdgeType.CHILD,
            spaceL0.id
          );
          edges.push(edge);
          this.addAllCommunityRoleEdges(spaceL2, edges, spaceL0.id);
        }
      }
    }

    const data: IDisplayData = {
      edges: edges,
      nodes: {
        contributors: contributorNodes,
        spacesL0: spaceL0Nodes,
        spacesL1: spaceL1Nodes,
        spacesL2: spaceL2Nodes,
      },
    };
    // save the results to files
    fs.writeFileSync(TRANSFORMED_DATA_FILE, JSON.stringify(data));
  }

  // Helper to add all community role edges for a space node
  private addAllCommunityRoleEdges(
    space: SpaceModel,
    edges: GraphEdgeModel[],
    group: string
  ) {
    this.addCommunityRoleEdges(
      space,
      space.community.roleSet.memberUsers,
      edges,
      EdgeType.MEMBER,
      group
    );
    this.addCommunityRoleEdges(
      space,
      space.community.roleSet.memberOrganizations,
      edges,
      EdgeType.MEMBER,
      group
    );
    this.addCommunityRoleEdges(
      space,
      space.community.roleSet.leadOrganizations,
      edges,
      EdgeType.LEAD,
      group
    );
    this.addCommunityRoleEdges(
      space,
      space.community.roleSet.leadUsers,
      edges,
      EdgeType.LEAD,
      group
    );
  }

  addCommunityRoleEdges(
    parent: SpaceModel,
    contributors: ContributorModel[],
    edges: GraphEdgeModel[],
    type: EdgeType,
    group: string
  ) {
    for (const contributor of contributors) {
      let weight = EdgeWeight.MEMBER;
      if (type === EdgeType.LEAD) weight = EdgeWeight.LEAD;
      const edge = new GraphEdgeModel(
        contributor.id,
        parent.id,
        weight,
        type,
        group
      );
      edges.push(edge);
    }
  }
}
