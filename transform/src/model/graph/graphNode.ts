import { GraphLocationModel } from "./graphLocationModel";

export class GraphNodeModel {
  nameID: string;
  id: string;
  displayName: string;
  type: string;
  group: string;
  weight: number;

  url: string;
  avatar: string;
  location: GraphLocationModel;

  constructor(
    id: string,
    nameID: string,
    displayName: string,
    type: string,
    group: string,
    weight: number,
    url: string,
    avatar: string,
    location: GraphLocationModel
  ) {
    this.id = id;
    this.nameID = nameID;
    this.displayName = displayName;
    this.type = type;
    this.group = group;
    this.weight = weight;
    this.url = url;
    this.avatar = avatar;
    this.location = location;
  }
}
