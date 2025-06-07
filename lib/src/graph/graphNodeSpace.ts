import { GraphNodeModel } from "./graphNode";
import { GraphProfileModel } from "./graphProfileModel";

export class GraphNodeSpaceModel extends GraphNodeModel {
  leadOrgsCount: number;

  constructor(id: string, nameID: string, type: string, group: string, weight: number, leadOrgsCount: number, avatar: string, profile: GraphProfileModel) {
    super(id, nameID, type, group, weight, avatar, profile);
    this.leadOrgsCount = leadOrgsCount;
  }
}
