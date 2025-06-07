// Utility functions to map raw API data to UserModel and OrganizationModel
// filepath: acquire/src/util/mapUserAndOrgDataToModel.ts

import { ContributorModel } from '../model/fullDataModel';

export function mapContributorDataToContributorModel(contributor: any, type: 'user' | 'organization'): ContributorModel {
  return {
    id: contributor.id,
    nameID: contributor.nameID,
    type,
    profile: {
      displayName: contributor.profile?.displayName || '',
      avatar: contributor.profile?.avatar ? { uri: contributor.profile.avatar.uri } : undefined,
      location: contributor.profile?.location
        ? {
            country: contributor.profile.location.country ?? null,
            city: contributor.profile.location.city ?? null,
          }
        : { country: null, city: null },
      url: contributor.profile?.url,
    },
  };
}

