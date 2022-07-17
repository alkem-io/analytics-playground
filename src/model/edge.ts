export class Edge {
  source: string;
  target: string;

  constructor(from: string, to: string) {
    this.source = from;
    this.target = to;
  }
}
