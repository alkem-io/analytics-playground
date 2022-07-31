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

const TRANSFORMED_DATA_FILE = '../display/data/transformed-data.json';

export class AlkemioTransformer {
  logger;

  constructor() {
    this.logger = createLogger();
  }

  transformData() {
    // create the graph
    const challengeNodes: NodeChallenge[] = [];
    const contributorNodes: NodeContributor[] = [];
    const edges: Edge[] = [];

    // Nodes for users + orgs
    const users = usersData.data.users;
    for (let i = 0; i < users.length; i++) {
      const contributor = users[i];
      const contributorNode = new NodeContributor(
        contributor.id,
        `${contributor.nameID}`,
        `${contributor.displayName}`,
        NodeType.USER,
        NodeGroup.CONTRIBUTORS,
        NodeWeight.USER
      );
      contributorNodes.push(contributorNode);
    }

    const organizations = organizationsData.data.organizations;
    for (let i = 0; i < organizations.length; i++) {
      const contributor = organizations[i];
      const contributorNode = new NodeContributor(
        contributor.id,
        `${contributor.nameID}`,
        `${contributor.displayName}`,
        NodeType.ORGANIZATION,
        NodeGroup.CONTRIBUTORS,
        NodeWeight.ORGANIZATION
      );
      contributorNodes.push(contributorNode);
    }

    // Process Hubs
    for (const hub of hubsData.data.hubs) {
      const hubNode = new NodeChallenge(
        hub.id,
        `'${hub.nameID}'`,
        `${hub.nameID}`,
        NodeType.HUB,
        hub.nameID,
        NodeWeight.HUB,
        1
      );

      challengeNodes.push(hubNode);
      this.addCommunityRoleEdges(
        hub,
        hub.community.memberUsers,
        edges,
        EdgeType.MEMBER
      );
      this.addCommunityRoleEdges(
        hub,
        hub.community.memberOrganizations,
        edges,
        EdgeType.MEMBER
      );
      this.addCommunityRoleEdges(
        hub,
        hub.community.leadOrganizations,
        edges,
        EdgeType.LEAD
      );
      this.addCommunityRoleEdges(
        hub,
        hub.community.leadUsers,
        edges,
        EdgeType.LEAD
      );
    }

    // Process Challenges
    for (const hub of challengesData.data.hubs) {
      for (const challenge of hub.challenges) {
        const challengeNode = new NodeChallenge(
          challenge.id,
          `${challenge.nameID}`,
          `${challenge.displayName}`,
          NodeType.CHALLENGE,
          hub.nameID,
          NodeWeight.CHALLENGE,
          challenge.community.leadOrganizations.length
        );

        challengeNodes.push(challengeNode);

        const edge = new Edge(
          challenge.id,
          hub.id,
          EdgeWeight.CHILD,
          EdgeType.CHILD
        );
        edges.push(edge);

        this.addCommunityRoleEdges(
          challenge,
          challenge.community.memberUsers,
          edges,
          EdgeType.MEMBER
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.memberOrganizations,
          edges,
          EdgeType.MEMBER
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.leadOrganizations,
          edges,
          EdgeType.LEAD
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.leadUsers,
          edges,
          EdgeType.LEAD
        );
      }
    }

    // Process Opportunities
    for (const hub of opportunitiesData.data.hubs) {
      for (const challenge of hub.challenges) {
        for (const opportunity of challenge.opportunities) {
          const opportunityNode = new NodeChallenge(
            opportunity.id,
            `'${opportunity.nameID}'`,
            `${opportunity.displayName}`,
            NodeType.OPPORTUNITY,
            hub.nameID,
            NodeWeight.OPPORTUNITY,
            opportunity.community.leadOrganizations.length
          );

          challengeNodes.push(opportunityNode);

          const edge = new Edge(
            opportunity.id,
            challenge.id,
            EdgeWeight.CHILD,
            EdgeType.CHILD
          );
          edges.push(edge);

          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.memberUsers,
            edges,
            EdgeType.MEMBER
          );
          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.memberOrganizations,
            edges,
            EdgeType.MEMBER
          );
          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.leadOrganizations,
            edges,
            EdgeType.LEAD
          );
          this.addCommunityRoleEdges(
            opportunity,
            opportunity.community.leadUsers,
            edges,
            EdgeType.LEAD
          );
        }
      }
    }

    const data = {
      edges: edges,
      nodes: {
        contributors: contributorNodes,
        challenges: challengeNodes,
      },
    };

    // save the results to files
    fs.writeFileSync(TRANSFORMED_DATA_FILE, JSON.stringify(data));
  }

  addCommunityRoleEdges(
    parent: any,
    contributors: any[],
    edges: Edge[],
    type: EdgeType
  ) {
    for (const contributor of contributors) {
      let weight = EdgeWeight.MEMBER;
      if (type === EdgeType.LEAD) weight = EdgeWeight.LEAD;
      const edge = new Edge(contributor.id, parent.id, weight, type);
      edges.push(edge);
    }
  }
}
