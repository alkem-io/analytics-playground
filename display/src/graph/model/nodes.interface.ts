import { GraphNodeSpaceModel } from '../../../../transform/src/model/graph/graphNodeSpace';
import { GraphNodeContributorModel } from '../../../../transform/src/model/graph/graphNodeContributor';
export interface IDataNodes {
  spacesL0: GraphNodeSpaceModel[];
  spacesL1: GraphNodeSpaceModel[];
  spacesL2: GraphNodeSpaceModel[];
  contributors: GraphNodeContributorModel[];
}
