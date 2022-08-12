import { createLogger } from './util';
import fs from 'fs';
import { NodeChallenge } from './model/graph/nodeChallenge';
import { NodeContributor } from './model/graph/nodeContributor';
import { Edge } from './model/graph/edge';
import organizationsData from './acquired-data/organizations.json';
import usersData from './acquired-data/users.json';
import hubsData from './acquired-data/hubs-roles.json';
import challengesData from './acquired-data/challenges-roles.json';
import opportunitiesData from './acquired-data/opportunities-roles.json';
import { NodeType } from './common/node.type';
import { NodeGroup } from './common/node.group';
import { NodeWeight } from './common/node.weight';
import { EdgeWeight } from './common/edge.weight';
import { EdgeType } from './common/edge.type';
import { GeoapifyGeocodeHandler } from './handlers/GeoapifyGeocodeHandler';

const TRANSFORMED_DATA_FILE =
  '../display/public/data/transformed-graph-data.json';

export class AlkemioGraphTransformer {
  logger;
  urlBase: string;
  geocodeHandler: GeoapifyGeocodeHandler;

  constructor(urlBase: string, geocodeHandler: GeoapifyGeocodeHandler) {
    this.logger = createLogger();
    this.urlBase = urlBase;
    this.geocodeHandler = geocodeHandler;
  }

  async transformData() {
    // create the graph
    const hubNodes: NodeChallenge[] = [];
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
        `${contributor.displayName}`,
        NodeType.USER,
        NodeGroup.CONTRIBUTORS,
        NodeWeight.USER,
        `${this.urlBase}/user/${contributor.nameID}`,
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
        `${contributor.displayName}`,
        NodeType.ORGANIZATION,
        NodeGroup.CONTRIBUTORS,
        NodeWeight.ORGANIZATION,
        `${this.urlBase}/organization/${contributor.nameID}`,
        contributor.profile.avatar.uri,
        location.country,
        location.city,
        locationExact[0],
        locationExact[1]
      );
      contributorNodes.push(contributorNode);
    }

    // Process Hubs
    for (const hub of hubsData.data.hubs) {
      const location = hub.context.location;
      const locationExact = await this.geocodeHandler.lookup(
        location.city,
        location.country,
        hub.nameID
      );
      const hubNode = new NodeChallenge(
        hub.id,
        hub.nameID,
        hub.displayName,
        NodeType.HUB,
        hub.id,
        NodeWeight.HUB,
        1,
        `${this.urlBase}/${hub.nameID}`,
        '',
        location.country,
        location.city,
        locationExact[0],
        locationExact[1]
      );

      hubNodes.push(hubNode);
      this.addCommunityRoleEdges(
        hub,
        hub.community.memberUsers,
        edges,
        EdgeType.MEMBER,
        hub.id
      );
      this.addCommunityRoleEdges(
        hub,
        hub.community.memberOrganizations,
        edges,
        EdgeType.MEMBER,
        hub.id
      );
      this.addCommunityRoleEdges(
        hub,
        hub.community.leadOrganizations,
        edges,
        EdgeType.LEAD,
        hub.id
      );
      this.addCommunityRoleEdges(
        hub,
        hub.community.leadUsers,
        edges,
        EdgeType.LEAD,
        hub.id
      );
    }

    // Process Challenges
    for (const hub of challengesData.data.hubs) {
      for (const challenge of hub.challenges) {
        const location = challenge.context.location;
        const locationExact = await this.geocodeHandler.lookup(
          location.city,
          location.country,
          challenge.nameID
        );
        const challengeNode = new NodeChallenge(
          challenge.id,
          challenge.nameID,
          challenge.displayName,
          NodeType.CHALLENGE,
          hub.id,
          NodeWeight.CHALLENGE,
          challenge.community.leadOrganizations.length,
          `${this.urlBase}/${hub.nameID}/challenges/${challenge.nameID}`,
          '',
          location.country,
          location.city,
          locationExact[0],
          locationExact[1]
        );

        challengeNodes.push(challengeNode);

        const edge = new Edge(
          challenge.id,
          hub.id,
          EdgeWeight.CHILD,
          EdgeType.CHILD,
          hub.id
        );
        edges.push(edge);

        this.addCommunityRoleEdges(
          challenge,
          challenge.community.memberUsers,
          edges,
          EdgeType.MEMBER,
          hub.id
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.memberOrganizations,
          edges,
          EdgeType.MEMBER,
          hub.id
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.leadOrganizations,
          edges,
          EdgeType.LEAD,
          hub.id
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.leadUsers,
          edges,
          EdgeType.LEAD,
          hub.id
        );
      }
    }

    // Process Opportunities
    for (const hub of opportunitiesData.data.hubs) {
      for (const challenge of hub.challenges) {
        for (const opportunity of challenge.opportunities) {
          const location = opportunity.context.location;
          const locationExact = await this.geocodeHandler.lookup(
            location.city,
            location.country,
            opportunity.nameID
          );
          const opportunityNode = new NodeChallenge(
            opportunity.id,
            opportunity.nameID,
            opportunity.displayName,
            NodeType.OPPORTUNITY,
            hub.id,
            NodeWeight.OPPORTUNITY,
            opportunity.community.leadOrganizations.length,
            `${this.urlBase}/${hub.nameID}/challenges/${challenge.nameID}/opportunities/${opportunity.nameID}`,
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
            hub.id
          );
          edges.push(edge);

          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.memberUsers,
            edges,
            EdgeType.MEMBER,
            hub.id
          );
          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.memberOrganizations,
            edges,
            EdgeType.MEMBER,
            hub.id
          );
          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.leadOrganizations,
            edges,
            EdgeType.LEAD,
            hub.id
          );
          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.leadUsers,
            edges,
            EdgeType.LEAD,
            hub.id
          );
        }
      }
    }

    const data = {
      edges: edges,
      nodes: {
        contributors: contributorNodes,
        hubs: hubNodes,
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
