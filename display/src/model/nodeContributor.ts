import { Node } from "./node";

export class NodeContributor extends Node {

  constructor(id: string, nameID: string, displayName: string, type: string, group: string, weight: number) {
    super(id, nameID, displayName, type, group, weight);
  }
}
