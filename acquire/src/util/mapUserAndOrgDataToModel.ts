// Utility functions to map raw API data to UserModel and OrganizationModel
// filepath: acquire/src/util/mapUserAndOrgDataToModel.ts

import { ContributorModel } from '../model/fullDataModel';
import { LocationModel } from '../model/spaceModel';

export function mapContributorDataToContributorModel(contributor: any, type: 'user' | 'organization'): ContributorModel {
  const locationData = contributor.profile.location || {};
  const locationModel: LocationModel = {
    country: locationData.country || null,
    city: locationData.city || null,
    geoLocation: {
      latitude: locationData.geoLocation?.latitude || null,
      longitude: locationData.geoLocation?.longitude || null,
    },
  }
  return {
    id: contributor.id,
    nameID: contributor.nameID,
    type,
    profile: {
      displayName: contributor.profile?.displayName || '',
      avatar: contributor.profile?.avatar ? { uri: contributor.profile.avatar.uri } : undefined,
      location: locationModel,
      url: contributor.profile?.url,
    },
  };
}

