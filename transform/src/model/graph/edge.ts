export class Edge {
  source: string;
  target: string;
  weight: number;
  type: string;

  constructor(from: string, to: string, weight: number, type: string) {
    this.source = from;
    this.target = to;
    this.weight = weight;
    this.type = type;
  }
}
