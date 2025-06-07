import { SpaceModel } from "../model/spaceModel";

/**
 * Maps a Space object from spaces-l0-roles.json to a SpaceModel.
 * Returns empty objects for missing fields.
 * @param space any (from JSON)
 * @returns SpaceModel
 */
export function mapSpaceDataToSpaceModel(space: any): SpaceModel {
  return {
    id: space?.id ?? '',
    nameID: space?.nameID ?? '',
    about: space?.about && space.about.profile ? {
      profile: {
        displayName: space.about.profile.displayName ?? '',
        tagline: space.about.profile.tagline ?? '',
        location: space.about.profile.location ?? { country: '', city: '' },
        url: space.about.profile.url ?? '',
      },
    } : { profile: { displayName: '', tagline: '', location: { country: '', city: '' }, url: '' } },
    community: space?.community && space.community.roleSet ? {
      roleSet: {
        memberUsers: Array.isArray(space.community.roleSet.memberUsers) ? space.community.roleSet.memberUsers.map((c: any) => ({ id: c.id ?? '' })) : [],
        memberOrganizations: Array.isArray(space.community.roleSet.memberOrganizations) ? space.community.roleSet.memberOrganizations.map((c: any) => ({ id: c.id ?? '' })) : [],
        leadOrganizations: Array.isArray(space.community.roleSet.leadOrganizations) ? space.community.roleSet.leadOrganizations.map((c: any) => ({ id: c.id ?? '' })) : [],
        leadUsers: Array.isArray(space.community.roleSet.leadUsers) ? space.community.roleSet.leadUsers.map((c: any) => ({ id: c.id ?? '' })) : [],
      },
    } : { roleSet: { memberUsers: [], memberOrganizations: [], leadOrganizations: [], leadUsers: [] } },
    account: space?.account && space.account.host ? {
      host: { id: space.account.host.id ?? '' },
    } : { host: { id: '' } },
    subspaces: Array.isArray(space?.subspaces) ? space.subspaces.map(mapSpaceDataToSpaceModel) : [],
  };
}