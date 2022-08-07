export class Edge {
  sourceID: string;
  targetID: string;
  source: string;
  target: string;
  weight: number;
  type: string;
  group: string;

  constructor(from: string, to: string, weight: number, type: string, group: string) {
    this.sourceID = from;
    this.targetID = to;
    this.source = from;
    this.target = to;
    this.weight = weight;
    this.type = type;
    this.group = group;
  }
}
