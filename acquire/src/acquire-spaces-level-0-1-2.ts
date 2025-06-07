import * as fs from 'fs';
import { createLogger } from './util/create-logger';
import { createConfigUsingEnvVars } from './util/create-config-using-envvars';
import { AlkemioAnalyticsClient } from './AlkemioAnalyticsClient';
import { SpaceModel } from './model/spaceModel';
import { mapSpaceDataToSpaceModel } from './util/mapSpacesDataToModel';

class SpacesLevelAcquirer {
  constructor(private sdkClient: any, private logger: any, private config: any) {}

  async acquireSpacesL0() {
    const spacesResponse = await this.sdkClient.spaceRolesL0();
    const spacesData: SpaceModel[] = spacesResponse.data.spaces.map(mapSpaceDataToSpaceModel);
    this.logger.info(`Acquired data on Spaces L0: '${spacesData.length}'`);
    fs.writeFileSync(this.config.files.spacesL0, JSON.stringify(spacesData, null, 2));
  }

  async acquireSpacesL1() {
    const spacesL1Response = await this.sdkClient.spaceRolesL1();
    const spacesL1Data: SpaceModel[] = spacesL1Response.data.spaces.map(mapSpaceDataToSpaceModel);
    const spacesL1Count = spacesL1Data.reduce((acc, space) => acc + (space.subspaces ? space.subspaces.length : 0), 0);
    this.logger.info(`Acquired data on Spaces L1: '${spacesL1Count}'`);
    fs.writeFileSync(this.config.files.spacesL1, JSON.stringify(spacesL1Data, null, 2));
  }

  async acquireSpacesL2() {
    const spacesL2Response = await this.sdkClient.spaceRolesL2();
    const spacesL2Data: SpaceModel[] = spacesL2Response.data.spaces.map(mapSpaceDataToSpaceModel);
    function countSpacesExactly2LevelsDeep(spaces: SpaceModel[]): number {
      return spaces.reduce((acc, space) => {
        if (Array.isArray(space.subspaces)) {
          return acc + space.subspaces.reduce((a, sub1) => {
            if (Array.isArray(sub1.subspaces)) {
              return a + sub1.subspaces.length;
            }
            return a;
          }, 0);
        }
        return acc;
      }, 0);
    }
    const spacesL2Count = countSpacesExactly2LevelsDeep(spacesL2Data);
    this.logger.info(`Acquired data on Spaces L2: '${spacesL2Count}'`);
    fs.writeFileSync(this.config.files.spacesL2, JSON.stringify(spacesL2Data, null, 2));
  }
}

const main = async () => {
  const logger = createLogger();
  const config = createConfigUsingEnvVars();
  const alkemioAnalyticsClient = new AlkemioAnalyticsClient(config, logger);
  await alkemioAnalyticsClient.initialise();
  await alkemioAnalyticsClient.logUser();
  const acquirer = new SpacesLevelAcquirer(alkemioAnalyticsClient, logger, config);
  await acquirer.acquireSpacesL0();
  await acquirer.acquireSpacesL1();
  await acquirer.acquireSpacesL2();
};

main().catch(error => {
  console.error(error);
});