// Utility functions to map raw API data to UserModel and OrganizationModel
// filepath: acquire/src/util/mapUserAndOrgDataToModel.ts

import { UserModel, OrganizationModel } from '../model/fullDataModel';

export function mapUserDataToUserModel(user: any): UserModel {
  return {
    id: user.id,
    nameID: user.nameID,
    profile: {
      displayName: user.profile?.displayName || '',
      avatar: user.profile?.avatar ? { uri: user.profile.avatar.uri } : undefined,
      location: user.profile?.location
        ? {
            country: user.profile.location.country ?? null,
            city: user.profile.location.city ?? null,
          }
        : { country: null, city: null },
      url: user.profile?.url,
    },
  };
}

export function mapOrganizationDataToOrganizationModel(org: any): OrganizationModel {
  return {
    id: org.id,
    nameID: org.nameID,
    profile: {
      displayName: org.profile?.displayName || '',
      avatar: org.profile?.avatar ? { uri: org.profile.avatar.uri } : undefined,
      location: org.profile?.location
        ? {
            country: org.profile.location.country ?? null,
            city: org.profile.location.city ?? null,
          }
        : { country: null, city: null },
      url: org.profile?.url,
    },
  };
}
