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

const TRANSFORMED_DATA_FILE = '../display/data/transformed-data.json';

export class AlkemioAdapter {
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
        `User: ${contributor.nameID}`,
        `User: : ${contributor.nameID}`,
        'user'
      );
      contributorNodes.push(contributorNode);
    }

    const organizations = organizationsData.data.organizations;
    for (let i = 0; i < organizations.length; i++) {
      const contributor = organizations[i];
      const contributorNode = new NodeContributor(
        contributor.id,
        `Org: ${contributor.nameID}`,
        `Organization: : ${contributor.nameID}`,
        'organization'
      );
      contributorNodes.push(contributorNode);
    }

    // Process Hubs
    for (const hub of hubsData.data.hubs) {
      const hubNode = new NodeChallenge(
        hub.id,
        `Hub '${hub.nameID}'`,
        `Hub : ${hub.nameID}`,
        'hub',
        1
      );

      challengeNodes.push(hubNode);
      this.addCommunityRoleEdges(hub, hub.community.memberUsers, edges);
      this.addCommunityRoleEdges(hub, hub.community.memberOrganizations, edges);
      this.addCommunityRoleEdges(hub, hub.community.leadOrganizations, edges);
      this.addCommunityRoleEdges(hub, hub.community.leadUsers, edges);
    }

    // Process Challenges
    for (const hub of challengesData.data.hubs) {
      for (const challenge of hub.challenges) {
        const challengeNode = new NodeChallenge(
          challenge.id,
          `Challenge '${challenge.nameID}' in Hub: ${hub.nameID}`,
          `Challenge : ${challenge.nameID} [${hub.nameID}]`,
          'challenge',
          challenge.community.leadOrganizations.length
        );

        challengeNodes.push(challengeNode);

        const edge = new Edge(challenge.id, hub.id);
        edges.push(edge);

        this.addCommunityRoleEdges(
          challenge,
          challenge.community.memberUsers,
          edges
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.memberOrganizations,
          edges
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.leadOrganizations,
          edges
        );
        this.addCommunityRoleEdges(
          challenge,
          challenge.community.leadUsers,
          edges
        );
      }
    }

    // Process Opportunities
    for (const hub of opportunitiesData.data.hubs) {
      for (const challenge of hub.challenges) {
        for (const opportunity of challenge.opportunities) {
        const opportunityNode = new NodeChallenge(
          opportunity.id,
          `Opportunity '${opportunity.nameID}' in Hub: ${hub.nameID}`,
          `Opportunity : ${opportunity.nameID} [${hub.nameID}]`,
          'opportunity',
          opportunity.community.leadOrganizations.length
        );

        challengeNodes.push(opportunityNode);

        const edge = new Edge(opportunity.id, challenge.id);
        edges.push(edge);

        this.addCommunityRoleEdges(
          opportunity,
          opportunity.community.memberUsers,
          edges
        );
        this.addCommunityRoleEdges(
          opportunity,
          opportunity.community.memberOrganizations,
          edges
        );
        this.addCommunityRoleEdges(
          opportunity,
          opportunity.community.leadOrganizations,
          edges
        );
        this.addCommunityRoleEdges(
          opportunity,
          opportunity.community.leadUsers,
          edges
        );
      }}
    }

    const data = {
      edges: edges,
      nodes: {
        contributors: contributorNodes,
        challenges: challengeNodes
      }
    }

    // save the results to files
    fs.writeFileSync(TRANSFORMED_DATA_FILE, JSON.stringify(data));
  }

  addCommunityRoleEdges(parent: any, contributors: any[], edges: Edge[]) {
    for (const contributor of contributors) {
      const edge = new Edge(contributor.id, parent.id);
      edges.push(edge);
    }
  }

}
