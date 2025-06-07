import { GraphLocationModel } from "./graphLocationModel";
import { GraphNodeModel } from "./graphNode";

export class GraphNodeSpaceModel extends GraphNodeModel {
  leadOrgsCount: number;

  constructor(id: string, nameID: string, displayName: string, type: string, group: string, weight: number, leadOrgsCount: number, url: string, avatar: string, location: GraphLocationModel) {
    super(id, nameID, displayName, type, group, weight, url, avatar, location);
    this.leadOrgsCount = leadOrgsCount;
  }
}
