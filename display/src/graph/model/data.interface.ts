import { IDataNodes } from "./nodes.interface";
import { GraphEdgeModel } from '@lib/graph/graphEdge';

export interface IDisplayData {
  edges: GraphEdgeModel[];
  nodes: IDataNodes;
}
