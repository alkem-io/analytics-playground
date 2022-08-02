import { IDataNodes } from "./nodes.interface";
import { IEdge } from "./edge.interface";
import { INode } from "./node.interface";

export interface IData {
  edges: IEdge[];
  nodes: IDataNodes;
}
