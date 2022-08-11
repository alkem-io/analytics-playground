import { Node } from "./node";

export class NodeChallenge extends Node {
  leadOrgsCount: number;

  constructor(id: string, nameID: string, displayName: string, type: string, group: string, weight: number, leadOrgsCount: number, url: string, avatar: string, country: string, city: string, lon = 0, lat = 0) {
    super(id, nameID, displayName, type, group, weight, url, avatar, country, city, lon , lat);
    this.leadOrgsCount = leadOrgsCount;
  }
}
