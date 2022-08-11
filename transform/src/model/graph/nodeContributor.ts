import { Node } from "./node";

export class NodeContributor extends Node {

  constructor(id: string, nameID: string, displayName: string, type: string, group: string, weight: number, url: string, avatar: string, country: string, city: string, lon: number, lat: number) {
    super(id, nameID, displayName, type, group, weight, url, avatar, country, city, lon, lat);
  }
}
