import { GraphNodeModel } from "./graphNode";
import { GraphProfileModel } from "./graphProfileModel";

export class GraphNodeContributorModel extends GraphNodeModel {

  constructor(id: string, nameID: string, type: string, group: string, weight: number, avatar: string, profile: GraphProfileModel) {
    super(id, nameID, type, group, weight, avatar, profile);
  }
}
