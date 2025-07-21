import { createLogger } from "./util/create-logger";
import { createConfigUsingEnvVars } from "./util/create-config-using-envvars";
import { AlkemioAnalyticsClient } from "./AlkemioAnalyticsClient";
import fs from "fs";
import { ContributorModel } from "./model/fullDataModel";
import { mapContributorDataToContributorModel } from "./util/mapUserAndOrgDataToModel";


class AcquireMySpaceMemberships {
  constructor(private alkemioAnalyticsClient: AlkemioAnalyticsClient, private logger: any) {}

  async acquire(outputFile: string = "../transform/src/acquired-data/spaces-my-memberships.json") {
    // 1. Get my memberships
    const myMembershipsResponse = await this.alkemioAnalyticsClient.sdkClient.mySpacesHierarchical();
    if (!myMembershipsResponse.data) {
      throw new Error("No memberships found for the user");
    }
    const myL0Memberships = myMembershipsResponse.data.me.spaceMembershipsHierarchical;
    const spaces: any[] = [];
    for (const l0Membership of myL0Memberships) {
      const space = l0Membership.space;
      spaces.push(space);
      for (const childMembership of l0Membership.childMemberships) {
        spaces.push(childMembership.space);
        for (const grandChildMembership of childMembership.childMemberships) {
          spaces.push(grandChildMembership.space);
        }
      }
    }
    this.logger.info(`Found ${spaces.length} spaces in my memberships`);

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
    const users: ContributorModel[] = (usersResponseData.data.users || []).map(user => mapContributorDataToContributorModel(user, 'user'));

    // 4. Fetch organization details and map
    const organizations: ContributorModel[] = [];
    for (const orgID of orgIDs) {
      const org = await this.alkemioAnalyticsClient.sdkClient.organizationByID({ id: orgID });
      if (org.data.lookup.organization) {
        organizations.push(mapContributorDataToContributorModel(org.data.lookup.organization, 'organization'));
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
  const acquirer = new AcquireMySpaceMemberships(alkemioAnalyticsClient, logger);

  await acquirer.acquire("../transform/src/acquired-data/spaces-my-memberships.json");
};

main().catch((error) => {
  console.error(error);
});
