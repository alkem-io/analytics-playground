import { createLogger } from "./util/create-logger";
import { createConfigUsingEnvVars } from "./util/create-config-using-envvars";
import { AlkemioAnalyticsClient } from "./AlkemioAnalyticsClient";
import fs from "fs";
import { OrganizationModel, UserModel } from "./model/fullDataModel";
import { mapUserDataToUserModel, mapOrganizationDataToOrganizationModel } from "./util/mapUserAndOrgDataToModel";

// TODO: Replace with your actual list of space nameIDs
const SPACE_NAMEIDS = ["test2", "eco1"];

class SpacesByNameIDAcquirer {
  constructor(private alkemioAnalyticsClient: AlkemioAnalyticsClient, private logger: any) {}

  async acquire(spaceNameIDs: string[], outputFile: string = "full-data.json") {
    // 1. Fetch spaces by nameID
    const spaces: any[] = [];
    for (const nameID of spaceNameIDs) {
      const space = await this.alkemioAnalyticsClient.sdkClient.spaceByName({
        nameId: nameID,
      });
      if (space.data.lookupByName.space) {
        spaces.push(space.data.lookupByName.space);
      }
    }

    // 2. Collect user and organization IDs
    const userIDsSet = new Set<string>();
    const orgIDs = new Set<string>();
    function collectContributors(space: any) {
      const roleSet = space.community?.roleSet;
      if (roleSet) {
        (roleSet.memberUsers || []).forEach((u: any) => userIDsSet.add(u.id));
        (roleSet.leadUsers || []).forEach((u: any) => userIDsSet.add(u.id));
        (roleSet.memberOrganizations || []).forEach((o: any) => orgIDs.add(o.id));
        (roleSet.leadOrganizations || []).forEach((o: any) => orgIDs.add(o.id));
      }
      (space.subspaces || []).forEach(collectContributors);
    }
    spaces.forEach(collectContributors);

    // 3. Fetch user details and map
    const userIDs = Array.from(userIDsSet);
    const usersResponseData = await this.alkemioAnalyticsClient.sdkClient.usersByIDs({
      ids: userIDs,
    });
    const users: UserModel[] = (usersResponseData.data.users || []).map(mapUserDataToUserModel);

    // 4. Fetch organization details and map
    const organizations: OrganizationModel[] = [];
    for (const orgID of orgIDs) {
      const org = await this.alkemioAnalyticsClient.sdkClient.organizationByID({ id: orgID });
      if (org.data.lookup.organization) {
        organizations.push(mapOrganizationDataToOrganizationModel(org.data.lookup.organization));
      }
    }

    // 5. Write to file
    const result = { spaces, users, organizations };
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    this.logger.info(`Full data written to ${outputFile}`);
  }
}

const main = async () => {
  const logger = createLogger();
  const config = createConfigUsingEnvVars();
  const alkemioAnalyticsClient = new AlkemioAnalyticsClient(config, logger);
  await alkemioAnalyticsClient.initialise();
  await alkemioAnalyticsClient.logUser();
  const acquirer = new SpacesByNameIDAcquirer(alkemioAnalyticsClient, logger);
  await acquirer.acquire(SPACE_NAMEIDS);
};

main().catch((error) => {
  console.error(error);
});
