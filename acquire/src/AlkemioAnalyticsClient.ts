/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient } from 'graphql-request';
import { AnalyticsClientConfig } from './config/analytics-client-config';
import { Sdk, getSdk } from './generated/graphql';
import { Logger } from 'winston';
import fs from 'fs';
import { AlkemioClient } from '@alkemio/client-lib';
import { SpaceModel } from './model/spaceModel';
import { mapSpaceDataToSpaceModel } from './util/mapSpacesDataToModel';

export class AlkemioAnalyticsClient {
  public config!: AnalyticsClientConfig;
  public sdkClient!: Sdk;
  private logger: Logger;

  constructor(config: AnalyticsClientConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.logger.info(
      `Alkemio server: ${config.apiEndpointPrivateGraphql}`
    );
  }

  async initialise() {
    try {
      const alkemioClient = new AlkemioClient(this.config);
      await alkemioClient.enableAuthentication();
      const apiToken = alkemioClient.apiToken;

      this.logger.info(`API token: ${apiToken}`);
      const client = new GraphQLClient(this.config.apiEndpointPrivateGraphql, {
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      });
      this.sdkClient = getSdk(client);
    } catch (error) {
      throw new Error(
        `Unable to create client for Alkemio endpoint: ${error}`
      );
    }

  }

  async logUser() {
    const userResponse = await this.sdkClient.me();
    this.logger.info(`Authenticated user: '${userResponse.data.me.user?.profile.displayName}'`);
  }

  async acquireSpacesL0() {
    const spacesResponse = await this.sdkClient.spaceRolesL0();
    const spacesData: SpaceModel[] = spacesResponse.data.spaces.map(mapSpaceDataToSpaceModel);
    this.logger.info(`Acquired data on Spaces L0: '${spacesData.length}'`);
    fs.writeFileSync(this.config.files.spacesL0, JSON.stringify(spacesData));
  }

  async acquireSpacesL1() {
    const spacesL1Response = await this.sdkClient.spaceRolesL1();
    const spacesL1Data: SpaceModel[] = spacesL1Response.data.spaces.map(mapSpaceDataToSpaceModel);
    const spacesL1Count = spacesL1Data.reduce((acc, space) => acc + (space.subspaces ? space.subspaces.length : 0), 0);
    this.logger.info(`Acquired data on Spaces L1: '${spacesL1Count}'`);
    fs.writeFileSync(this.config.files.spacesL1, JSON.stringify(spacesL1Data));
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
    fs.writeFileSync(this.config.files.spacesL2, JSON.stringify(spacesL2Data));
  }

  async acquireUsers() {
    const usersResponse = await this.sdkClient.users();
    this.logger.info(`Acquired data on Users: '${usersResponse.data.users.length}'`);
    fs.writeFileSync(this.config.files.users, JSON.stringify(usersResponse));
  }

  async acquireOrganizations() {
    const organizationsResponse = await this.sdkClient.organizations();
    this.logger.info(`Acquired data on Organizations: '${organizationsResponse.data.organizations.length}'`);
    fs.writeFileSync(this.config.files.organizations, JSON.stringify(organizationsResponse));
  }

}
