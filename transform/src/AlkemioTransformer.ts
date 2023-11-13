import fs from 'fs';
import { NodeChallenge } from './model/graph/nodeChallenge';
import { NodeContributor } from './model/graph/nodeContributor';
import { Edge } from './model/graph/edge';
import organizationsData from './acquired-data/organizations.json';
import usersData from './acquired-data/users.json';
import spacesData from './acquired-data/spaces-roles.json';
import challengesData from './acquired-data/challenges-roles.json';
import opportunitiesData from './acquired-data/opportunities-roles.json';
import { NodeType } from './common/node.type';
import { NodeGroup } from './common/node.group';
import { NodeWeight } from './common/node.weight';
import { EdgeWeight } from './common/edge.weight';
import { EdgeType } from './common/edge.type';
import { GeoapifyGeocodeHandler } from './handlers/GeoapifyGeocodeHandler';
import { Logger } from 'winston';

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
        location.city,
        location.country,
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
        location.country,
        location.city,
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
        location.city,
        location.country,
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
        location.country,
        location.city,
        locationExact[0],
        locationExact[1]
      );
      contributorNodes.push(contributorNode);
    }

    // Process Spaces
    for (const space of spacesData.data.spaces) {
      const location = space.profile.location;
      const locationExact = await this.geocodeHandler.lookup(
        location.city,
        location.country,
        space.nameID
      );
      const spaceNode = new NodeChallenge(
        space.id,
        space.nameID,
        space.profile.displayName,
        NodeType.SPACE,
        space.id,
        NodeWeight.HUB,
        1,
        space.profile.url,
        '',
        location.country,
        location.city,
        locationExact[0],
        locationExact[1]
      );

      spaceNodes.push(spaceNode);
      this.addCommunityRoleEdges(
        space,
        space.community.memberUsers,
        edges,
        EdgeType.MEMBER,
        space.id
      );
      this.addCommunityRoleEdges(
        space,
        space.community.memberOrganizations,
        edges,
        EdgeType.MEMBER,
        space.id
      );
      this.addCommunityRoleEdges(
        space,
        space.community.leadOrganizations,
        edges,
        EdgeType.LEAD,
        space.id
      );
      this.addCommunityRoleEdges(
        space,
        space.community.leadUsers,
        edges,
        EdgeType.LEAD,
        space.id
      );
    }

    // Process Challenges
    for (const space of challengesData.data.spaces) {
      for (const challenge of space.challenges) {
        const location = challenge.profile.location;
        const locationExact = await this.geocodeHandler.lookup(
          location.city,
          location.country,
          challenge.nameID
        );
        const challengeNode = new NodeChallenge(
          challenge.id,
          challenge.nameID,
          challenge.profile.displayName,
          NodeType.CHALLENGE,
          space.id,
          NodeWeight.CHALLENGE,
          challenge.community.leadOrganizations.length,
          challenge.profile.url,
          '',
          location.country,
          location.city,
          locationExact[0],
          locationExact[1]
        );

        challengeNodes.push(challengeNode);

        const edge = new Edge(
          challenge.id,
          space.id,
          EdgeWeight.CHILD,
          EdgeType.CHILD,
          space.id
        );
        edges.push(edge);

        this.addCommunityRoleEdges(
          challenge,
          challenge.community.memberUsers,
          edges,
          EdgeType.MEMBER,
          space.id
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.memberOrganizations,
          edges,
          EdgeType.MEMBER,
          space.id
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.leadOrganizations,
          edges,
          EdgeType.LEAD,
          space.id
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.leadUsers,
          edges,
          EdgeType.LEAD,
          space.id
        );
      }
    }

    // Process Opportunities
    for (const space of opportunitiesData.data.spaces) {
      for (const challenge of space.challenges) {
        for (const opportunity of challenge.opportunities) {
          const location = opportunity.profile.location;
          const locationExact = await this.geocodeHandler.lookup(
            location.city,
            location.country,
            opportunity.nameID
          );
          const opportunityNode = new NodeChallenge(
            opportunity.id,
            opportunity.nameID,
            opportunity.profile.displayName,
            NodeType.OPPORTUNITY,
            space.id,
            NodeWeight.OPPORTUNITY,
            opportunity.community.leadOrganizations.length,
            opportunity.profile.url,
            '',
            location.country,
            location.city,
            locationExact[0],
            locationExact[1]
          );

          opportunityNodes.push(opportunityNode);

          const edge = new Edge(
            opportunity.id,
            challenge.id,
            EdgeWeight.CHILD,
            EdgeType.CHILD,
            space.id
          );
          edges.push(edge);

          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.memberUsers,
            edges,
            EdgeType.MEMBER,
            space.id
          );
          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.memberOrganizations,
            edges,
            EdgeType.MEMBER,
            space.id
          );
          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.leadOrganizations,
            edges,
            EdgeType.LEAD,
            space.id
          );
          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.leadUsers,
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
