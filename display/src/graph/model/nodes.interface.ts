import { GraphNodeSpaceModel } from '@lib/graph/graphNodeSpace';
import { GraphNodeContributorModel } from '@lib/graph/graphNodeContributor';
export interface IDataNodes {
  spacesL0: GraphNodeSpaceModel[];
  spacesL1: GraphNodeSpaceModel[];
  spacesL2: GraphNodeSpaceModel[];
  contributors: GraphNodeContributorModel[];
}
