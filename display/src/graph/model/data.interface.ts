import { IDataNodes } from "./nodes.interface";
import { GraphEdgeModel } from '../../../../transform/src/model/graph/graphEdge';

export interface IDisplayData {
  edges: GraphEdgeModel[];
  nodes: IDataNodes;
}
