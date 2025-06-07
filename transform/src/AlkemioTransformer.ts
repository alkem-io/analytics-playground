import fs from 'fs';
import { NodeChallenge } from './model/graph/nodeChallenge';
import { NodeContributor } from './model/graph/nodeContributor';
import { Edge } from './model/graph/edge';
import organizationsData from './acquired-data/organizations.json';
import usersData from './acquired-data/users.json';
import spacesL0Data from './acquired-data/spaces-l0-roles.json';
import spacesL1Data from './acquired-data/spaces-l1-roles.json';
import spacesL2Data from './acquired-data/spaces-l2-roles.json';
import { NodeType } from './common/node.type';
import { NodeGroup } from './common/node.group';
import { NodeWeight } from './common/node.weight';
import { EdgeWeight } from './common/edge.weight';
import { EdgeType } from './common/edge.type';
import { GeoapifyGeocodeHandler } from './handlers/GeoapifyGeocodeHandler';
import { Logger } from 'winston';
import { SpaceModel } from '../../acquire/src/model/spaceModel';
import { mapSpaceDataToSpaceModel } from '../../acquire/src/util/mapSpacesDataToModel';

const TRANSFORMED_DATA_FILE =
  '../display/public/data/transformed-graph-data.json';

export class AlkemioGraphTransformer {
  logger: Logger;
  geocodeHandler: GeoapifyGeocodeHandler;

  constructor(logger: Logger, geocodeHandler: GeoapifyGeocodeHandler) {
    this.logger = logger;
    this.geocodeHandler = geocodeHandler;
  }

  async transformData() {
    // create the graph
    const spaceNodes: NodeChallenge[] = [];
    const challengeNodes: NodeChallenge[] = [];
    const opportunityNodes: NodeChallenge[] = [];
    const contributorNodes: NodeContributor[] = [];
    const edges: Edge[] = [];

    // Nodes for users + orgs
    const users = usersData.data.users;
    for (let i = 0; i < users.length; i++) {
      const contributor = users[i];
      const location = contributor.profile.location;
      const locationExact = await this.geocodeHandler.lookup(
        location.city || '',
        location.country || '',
        contributor.nameID
      );
      const contributorNode = new NodeContributor(
        contributor.id,
        `${contributor.nameID}`,
        `${contributor.profile.displayName}`,
        NodeType.USER,
        NodeGroup.CONTRIBUTORS,
        NodeWeight.USER,
        contributor.profile.url,
        contributor.profile.avatar.uri,
        location.country || '',
        location.city || '',
        locationExact[0],
        locationExact[1]
      );
      contributorNodes.push(contributorNode);
    }

    const organizations = organizationsData.data.organizations;
    for (let i = 0; i < organizations.length; i++) {
      const contributor = organizations[i];
      const location = contributor.profile.location;
      const locationExact = await this.geocodeHandler.lookup(
        location.city || '',
        location.country || '',
        contributor.nameID
      );
      const contributorNode = new NodeContributor(
        contributor.id,
        `${contributor.nameID}`,
        `${contributor.profile.displayName}`,
        NodeType.ORGANIZATION,
        NodeGroup.CONTRIBUTORS,
        NodeWeight.ORGANIZATION,
        contributor.profile.url,
        contributor.profile.avatar.uri,
        location.country || '',
        location.city || '',
        locationExact[0],
        locationExact[1]
      );
      contributorNodes.push(contributorNode);
    }

    // Use SpaceModel[] for type safety
    const spacesL0: SpaceModel[] = spacesL0Data.map(mapSpaceDataToSpaceModel);
    const spacesL1: SpaceModel[] = spacesL1Data.map(mapSpaceDataToSpaceModel);
    const spacesL2: SpaceModel[] = spacesL2Data.map(mapSpaceDataToSpaceModel);

    // Process Spaces
    for (const space of spacesL0) {
      const location = space.about.profile.location;
      const locationExact = await this.geocodeHandler.lookup(
        location.city || '',
        location.country || '',
        space.nameID
      );
      const spaceNode = new NodeChallenge(
        space.id,
        space.nameID,
        space.about.profile.displayName,
        NodeType.SPACE,
        space.id,
        NodeWeight.HUB,
        1,
        space.about.profile.url,
        '',
        location.country,
        location.city,
        locationExact[0],
        locationExact[1]
      );

      spaceNodes.push(spaceNode);
      this.addCommunityRoleEdges(
        space,
        space.community.roleSet.memberUsers,
        edges,
        EdgeType.MEMBER,
        space.id
      );
      this.addCommunityRoleEdges(
        space,
        space.community.roleSet.memberOrganizations,
        edges,
        EdgeType.MEMBER,
        space.id
      );
      this.addCommunityRoleEdges(
        space,
        space.community.roleSet.leadOrganizations,
        edges,
        EdgeType.LEAD,
        space.id
      );
      this.addCommunityRoleEdges(
        space,
        space.community.roleSet.leadUsers,
        edges,
        EdgeType.LEAD,
        space.id
      );
    }

    // Process Challenges
    for (const space of spacesL1) {
      for (const spaceL1 of space.subspaces) {
        const location = spaceL1.about.profile.location;
        const locationExact = await this.geocodeHandler.lookup(
          location.city || '',
          location.country || '',
          spaceL1.nameID
        );
        const challengeNode = new NodeChallenge(
          spaceL1.id,
          spaceL1.nameID,
          spaceL1.about.profile.displayName,
          NodeType.CHALLENGE,
          space.id,
          NodeWeight.CHALLENGE,
          spaceL1.community.roleSet.leadOrganizations.length,
          spaceL1.about.profile.url,
          '',
          location.country,
          location.city,
          locationExact[0],
          locationExact[1]
        );

        challengeNodes.push(challengeNode);

        const edge = new Edge(
          spaceL1.id,
          space.id,
          EdgeWeight.CHILD,
          EdgeType.CHILD,
          space.id
        );
        edges.push(edge);

        this.addCommunityRoleEdges(
          spaceL1,
          spaceL1.community.roleSet.memberUsers,
          edges,
          EdgeType.MEMBER,
          space.id
        );
        this.addCommunityRoleEdges(
          spaceL1,
          spaceL1.community.roleSet.memberOrganizations,
          edges,
          EdgeType.MEMBER,
          space.id
        );
        this.addCommunityRoleEdges(
          spaceL1,
          spaceL1.community.roleSet.leadOrganizations,
          edges,
          EdgeType.LEAD,
          space.id
        );
        this.addCommunityRoleEdges(
          spaceL1,
          spaceL1.community.roleSet.leadUsers,
          edges,
          EdgeType.LEAD,
          space.id
        );
      }
    }

    // Process L2 spaces
    for (const space of spacesL2) {
      for (const spaceL1 of space.subspaces) {
        for (const spaceL2 of spaceL1.subspaces) {
          const location = spaceL2.about.profile.location;
          const locationExact = await this.geocodeHandler.lookup(
            location.city || '',
            location.country || '',
            spaceL2.nameID
          );
          const opportunityNode = new NodeChallenge(
            spaceL2.id,
            spaceL2.nameID,
            spaceL2.about.profile.displayName,
            NodeType.OPPORTUNITY,
            space.id,
            NodeWeight.OPPORTUNITY,
            spaceL2.community.roleSet.leadOrganizations.length,
            spaceL2.about.profile.url,
            '',
            (location.country ?? '') as string,
            (location.city ?? '') as string,
            locationExact[0],
            locationExact[1]
          );

          opportunityNodes.push(opportunityNode);

          const edge = new Edge(
            spaceL2.id,
            spaceL1.id,
            EdgeWeight.CHILD,
            EdgeType.CHILD,
            space.id
          );
          edges.push(edge);

          this.addCommunityRoleEdges(
            spaceL2,
            spaceL2.community.roleSet.memberUsers,
            edges,
            EdgeType.MEMBER,
            space.id
          );
          this.addCommunityRoleEdges(
            spaceL2,
            spaceL2.community.roleSet.memberOrganizations,
            edges,
            EdgeType.MEMBER,
            space.id
          );
          this.addCommunityRoleEdges(
            spaceL2,
            spaceL2.community.roleSet.leadOrganizations,
            edges,
            EdgeType.LEAD,
            space.id
          );
          this.addCommunityRoleEdges(
            spaceL2,
            spaceL2.community.roleSet.leadUsers,
            edges,
            EdgeType.LEAD,
            space.id
          );
        }
      }
    }

    const data = {
      edges: edges,
      nodes: {
        contributors: contributorNodes,
        spaces: spaceNodes,
        challenges: challengeNodes,
        opportunities: opportunityNodes,
      },
    };

    // save the results to files
    fs.writeFileSync(TRANSFORMED_DATA_FILE, JSON.stringify(data));
  }

  addCommunityRoleEdges(
    parent: any,
    contributors: any[],
    edges: Edge[],
    type: EdgeType,
    group: string
  ) {
    for (const contributor of contributors) {
      let weight = EdgeWeight.MEMBER;
      if (type === EdgeType.LEAD) weight = EdgeWeight.LEAD;
      const edge = new Edge(contributor.id, parent.id, weight, type, group);
      edges.push(edge);
    }
  }
}
