import { IEdge } from "./edge.interface";
import { INode } from "./node.interface";

export interface IDataNodes {
  hubs: INode[];
  contributors: INode[];
  opportunities: INode[];
  challenges: INode[];
}
