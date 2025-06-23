export interface SpaceModel {
  id: string;
  nameID: string;
  about: About;
  community: Community;
  account: Account;
  subspaces: SpaceModel[];
}

export interface About {
  profile: Profile;
}

export interface Profile {
  displayName: string;
  tagline: string;
  location: LocationModel;
  url: string;
}

export interface LocationModel {
  country: string;
  city: string;
  geoLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface Community {
  roleSet: RoleSet;
}

export interface RoleSet {
  memberUsers: ContributorModel[];
  memberOrganizations: ContributorModel[];
  leadOrganizations: ContributorModel[];
  leadUsers: ContributorModel[];
}

export interface ContributorModel {
  id: string;
}

export interface Account {
  host: {
    id: string;
  };
}
