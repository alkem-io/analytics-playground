import { IDataNodes } from "./nodes.interface";
import { IEdge } from "./edge.interface";

export interface IData {
  edges: IEdge[];
  nodes: IDataNodes;
}
