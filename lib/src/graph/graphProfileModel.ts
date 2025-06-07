import { GraphLocationModel } from "./graphLocationModel";

export class GraphProfileModel {
  location: GraphLocationModel;
  url: string;
  displayName: string;

  constructor(
    displayName: string,
    url: string,
    location: GraphLocationModel) {
    this.location = location;
    this.url = url;
    this.displayName = displayName;
  }
}
