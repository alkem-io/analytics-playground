import { createLogger } from './util';
import fs from 'fs';
import { NodeChallenge } from './model/nodeChallenge';
import { NodeContributor } from './model/nodeContributor';
import { Edge } from './model/edge';

const NODES_CHALLENGES_FILE = './private/graph-nodes-challenges.json';
const NODES_CONTRIBUTORS_FILE = './private/graph-nodes-contributors.json';
const EDGES_FILE = './private/graph-edges.json';
const TEMPLATE_FILE = './src/display/page-template.html';

export class AlkemioAdapter {
  logger;

  constructor() {
    this.logger = createLogger();
  }

  generateGraphData() {
    const contributors: string | any[] = [];
    const challenges: string | any[] = [];

    // create the graph
    const challengeNodes: NodeChallenge[] = [];
    const contributorNodes: NodeContributor[] = [];
    const edges: Edge[] = [];
    for (let i = 0; i < challenges.length; i++) {
      const challenge = challenges[i];
      const challengeNode = new NodeChallenge(
        challenge.id,
        challenge.id.substring(0, 6),
        `${challenge.id} - nameID: ${challenge.nameID}`,
        'challenge'
      );

      challengeNodes.push(challengeNode);

    }

    // save the results to files
    fs.writeFileSync(EDGES_FILE, JSON.stringify(edges));
    fs.writeFileSync(NODES_CONTRIBUTORS_FILE, JSON.stringify(challengeNodes));
    fs.writeFileSync(NODES_CHALLENGES_FILE, JSON.stringify(contributorNodes));
  }


  async generateVisualisation() {
    const htmlTemplateFileStr = fs.readFileSync(TEMPLATE_FILE).toString();

    // Load the raw files
    const nodesChallengesJsonStr = fs.readFileSync(NODES_CHALLENGES_FILE).toString();
    const nodesContributosJsonStr = fs.readFileSync(NODES_CONTRIBUTORS_FILE).toString();
    const edgesJsonStr = fs.readFileSync(EDGES_FILE).toString();

    let updatedFileStr = htmlTemplateFileStr.replace('$$EDGES$$', edgesJsonStr);
    updatedFileStr = updatedFileStr.replace('$$CONTRIBUTOR_NODES$$', nodesContributosJsonStr);
    updatedFileStr = updatedFileStr.replace('$$CHALLENGES_NODES$$', nodesChallengesJsonStr);

    const date = new Date();
    const fileName = `./private/graph-display-${
      date.toISOString().split('T')[0]
    }.html`;

    fs.writeFileSync(fileName, updatedFileStr);
    this.logger.info(`Generated visualisation in: ${fileName}`);
  }
}
