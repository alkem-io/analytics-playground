// Model for the output of acquire-spaces-nameid, using SpaceModel for spaces
// filepath: acquire/src/model/fullDataModel.ts

import { SpaceModel } from './spaceModel';

export interface UserModel {
  id: string;
  nameID: string;
  profile: {
    displayName: string;
    avatar?: { uri: string };
    location?: { country: string | null; city: string | null };
    url?: string;
  };
}

export interface OrganizationModel {
  id: string;
  nameID: string;
  profile: {
    displayName: string;
    avatar?: { uri: string };
    location?: { country: string | null; city: string | null };
    url?: string;
  };
}

export interface FullDataModel {
  spaces: SpaceModel[];
  users: UserModel[];
  organizations: OrganizationModel[];
}
