export class Edge {
  source: string;
  target: string;
  weight: number;
  type: string;
  group: string;

  constructor(from: string, to: string, weight: number, type: string, group: string) {
    this.source = from;
    this.target = to;
    this.weight = weight;
    this.type = type;
    this.group = group;
  }
}
