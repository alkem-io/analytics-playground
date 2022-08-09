
export class Node {
  nameID: string;
  id: string;
  displayName: string;
  type: string;
  group: string;
  weight: number;

  url: string;
  avatar: string;
  country: string;
  city: string;

  constructor(id: string, nameID: string, displayName: string, type: string, group: string, weight: number, url: string, avatar: string, country: string, city: string) {
    this.id = id;
    this.nameID = nameID;
    this.displayName = displayName;
    this.type = type;
    this.group = group;
    this.weight = weight;
    this.url = url;
    this.avatar = avatar;
    this.country = country;
    this.city = city;
  }
}
