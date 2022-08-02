import { Node } from "./node";

export class NodeChallenge extends Node {
  leadOrgsCount: number;

  constructor(id: string, nameID: string, displayName: string, type: string, group: string, weight: number, leadOrgsCount: number) {
    super(id, nameID, displayName, type, group, weight);
    this.leadOrgsCount = leadOrgsCount;
  }
}
