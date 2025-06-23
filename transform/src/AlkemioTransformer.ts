import fs from 'fs';
import { GraphNodeSpaceModel } from '@lib/graph/graphNodeSpace';
import { GraphNodeContributorModel } from '@lib/graph/graphNodeContributor';
import { GraphEdgeModel } from '@lib/graph/graphEdge';
import { NodeType } from '@lib/common/node.type';
import { NodeGroup } from '@lib/common/node.group';
import { NodeWeight } from '@lib/common/node.weight';
import { EdgeWeight } from '@lib/common/edge.weight';
import { EdgeType } from '@lib/common/edge.type';
import { Logger } from 'winston';
import { IDisplayData } from '../../display/src/graph/model/data.interface';
import {
  ContributorModel,
  SpaceModel,
} from '../../acquire/src/model/spaceModel';
import { GraphLocationModel } from '@lib/graph/graphLocationModel';
import { GraphProfileModel } from '../../lib/src/graph/graphProfileModel';

const TRANSFORMED_DATA_FILE =
  '../display/public/data/transformed-graph-data.json';

export class AlkemioGraphTransformer {
  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
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
    return new GraphNodeSpaceModel(
      space.id,
      space.nameID,
      nodeType,
      parentId,
      nodeWeight,
      leadOrgCount,
      url,
      this.createProfileModel(space.about.profile)
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

      const contributorNode = new GraphNodeContributorModel(
        contributor.id,
        `${contributor.nameID}`,
        NodeType.USER,
        NodeGroup.CONTRIBUTORS,
        NodeWeight.USER,
        contributor.profile.avatar?.uri,
        this.createProfileModel(contributor.profile)
      );
      contributorNodes.push(contributorNode);
    }

    for (let i = 0; i < organizations.length; i++) {
      const contributor = organizations[i];

      const contributorNode = new GraphNodeContributorModel(
        contributor.id,
        `${contributor.nameID}`,
        NodeType.ORGANIZATION,
        NodeGroup.CONTRIBUTORS,
        NodeWeight.ORGANIZATION,
        contributor.profile.avatar?.uri,
        this.createProfileModel(contributor.profile)
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

  private createProfileModel(profileData: any): GraphProfileModel {
    const locationData = profileData.location;
    const locationModel: GraphLocationModel = new GraphLocationModel(
      locationData.country || '',
      locationData.city || '',
      locationData.geoLocation.latitude,
      locationData.geoLocation.longitude
    );
    const profileModel: GraphProfileModel = new GraphProfileModel(
      profileData.displayName,
      profileData.url || '',
      locationModel
    );
    return profileModel;
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
