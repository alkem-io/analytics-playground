export class Node {
  nameID: string;
  id: string;
  displayName: string;
  type: string;
  group: string;
  weight: number;

  constructor(id: string, nameID: string, displayName: string, type: string, group: string, weight: number) {
    this.id = id;
    this.nameID = nameID;
    this.displayName = displayName;
    this.type = type;
    this.group = group;
    this.weight = weight;
  }
}
