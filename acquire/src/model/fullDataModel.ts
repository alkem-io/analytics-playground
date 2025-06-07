// Model for the output of acquire-spaces-nameid, using SpaceModel for spaces
// filepath: acquire/src/model/fullDataModel.ts

import { SpaceModel } from './spaceModel';
export interface ContributorModel {
  id: string;
  nameID: string;
  type: 'user' | 'organization';
  profile: {
    displayName: string;
    avatar?: { uri: string };
    location?: { country: string | null; city: string | null };
    url?: string;
  };
}

export interface FullDataModel {
  spaces: SpaceModel[];
  users: ContributorModel[];
  organizations: ContributorModel[];
}
