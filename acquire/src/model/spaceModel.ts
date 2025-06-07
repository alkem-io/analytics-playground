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
  location: {
    country: string;
    city: string;
  };
  url: string;
}

export interface Community {
  roleSet: RoleSet;
}

export interface RoleSet {
  memberUsers: Contributor[];
  memberOrganizations: Contributor[];
  leadOrganizations: Contributor[];
  leadUsers: Contributor[];
}

export interface Contributor {
  id: string;
}

export interface Account {
  host: {
    id: string;
  };
}

