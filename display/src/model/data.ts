import { IDataNodes } from "./dataNodes";
import { Edge } from "./edge";
import { Node } from "./node";

export interface IData {
  edges: Edge[];
  nodes: IDataNodes;
}
