import * as fs from "fs";
import { createLogger } from "./util/create-logger";
import { createConfigUsingEnvVars } from "./util/create-config-using-envvars";
import { AlkemioAnalyticsClient } from "./AlkemioAnalyticsClient";
import { SpaceModel } from "./model/spaceModel";
import { mapSpaceDataToSpaceModel } from "./util/mapSpacesDataToModel";
import { Sdk } from "./generated/graphql";

class SpacesLevelAcquirer {
  constructor(
    private alkemioAnalyticsClient: AlkemioAnalyticsClient,
    private logger: any,
    private config: any,
  ) {}

  async acquireSpacesL0() {
    const spacesL0Response = await this.alkemioAnalyticsClient.sdkClient.spaceRolesL0();
    const spacesL0Data: SpaceModel[] = spacesL0Response.data.spaces.map(
      mapSpaceDataToSpaceModel,
    );
    this.logger.info(`Acquired data on Spaces L0: '${spacesL0Data.length}'`);
    const spacesL1Count = spacesL0Data.reduce(
      (acc, space) => acc + (space.subspaces ? space.subspaces.length : 0),
      0,
    );
    this.logger.info(`Acquired data on Spaces L1: '${spacesL1Count}'`);
    function countSpacesExactly2LevelsDeep(spaces: SpaceModel[]): number {
      return spaces.reduce((acc, space) => {
        if (Array.isArray(space.subspaces)) {
          return (
            acc +
            space.subspaces.reduce((a, sub1) => {
              if (Array.isArray(sub1.subspaces)) {
                return a + sub1.subspaces.length;
              }
              return a;
            }, 0)
          );
        }
        return acc;
      }, 0);
    }
    const spacesL2Count = countSpacesExactly2LevelsDeep(spacesL0Data);
    this.logger.info(`Acquired data on Spaces L2: '${spacesL2Count}'`);
    fs.writeFileSync(
      this.config.files.spacesL0,
      JSON.stringify(spacesL0Data, null, 2),
    );
  }
}

const main = async () => {
  const logger = createLogger();
  const config = createConfigUsingEnvVars();
  const alkemioAnalyticsClient = new AlkemioAnalyticsClient(config, logger);
  await alkemioAnalyticsClient.initialise();
  await alkemioAnalyticsClient.logUser();
  const acquirer = new SpacesLevelAcquirer(
    alkemioAnalyticsClient,
    logger,
    config,
  );
  await acquirer.acquireSpacesL0();
};

main().catch((error) => {
  console.error(error);
});
