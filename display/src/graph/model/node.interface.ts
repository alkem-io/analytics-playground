export interface INode {
  nameID: string;
  id: string;
  displayName: string;
  type: string;
  group: string;
  weight: number;
  country: string;
  city: string;
  url: string;
  avatar: string;
  lon: number;
  lat: number;

  x?: number;
  y?: number;
  vx?: number;
  vy?: number;

}
