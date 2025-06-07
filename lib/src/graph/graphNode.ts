import { GraphProfileModel } from "./graphProfileModel";

export class GraphNodeModel {
  nameID: string;
  id: string;
  type: string;
  group: string;
  weight: number;
  avatar: string;
  profile: GraphProfileModel;


  constructor(
    id: string,
    nameID: string,
    type: string,
    group: string,
    weight: number,
    avatar: string,
    profile: GraphProfileModel
  ) {
    this.id = id;
    this.nameID = nameID;
    this.type = type;
    this.group = group;
    this.weight = weight;
    this.avatar = avatar;
    this.profile = profile;
  }
}
