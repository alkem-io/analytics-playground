import { GraphLocationModel } from "./graphLocationModel";
import { GraphNodeModel } from "./graphNode";

export class GraphNodeContributorModel extends GraphNodeModel {

  constructor(id: string, nameID: string, displayName: string, type: string, group: string, weight: number, url: string, avatar: string, location: GraphLocationModel) {
    super(id, nameID, displayName, type, group, weight, url, avatar, location);
  }
}
