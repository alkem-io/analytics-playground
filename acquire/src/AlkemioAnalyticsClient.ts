/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient } from 'graphql-request';
import { AnalyticsClientConfig } from './config/analytics-client-config';
import { Sdk, getSdk } from './generated/graphql';
import { Logger } from 'winston';
import fs from 'fs';
import { AlkemioClient } from '@alkemio/client-lib';

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
    this.logger.info(`Authenticated user: '${userResponse.data.me.displayName}'`);
  }

  async acquireHubs() {
    const hubsResponse = await this.sdkClient.hubRoles();
    this.logger.info(`Acquired data on Hubs: '${hubsResponse.data.hubs.length}'`);
    fs.writeFileSync(this.config.files.hubs, JSON.stringify(hubsResponse));
  }

  async acquireChallenges() {
    const challengesResponse = await this.sdkClient.challengeRoles();
    this.logger.info(`Acquired data on Challenges, # Hubs: '${challengesResponse.data.hubs.length}'`);
    fs.writeFileSync(this.config.files.challenges, JSON.stringify(challengesResponse));
  }

  async acquireOpportunities() {
    const opportunitiesResponse = await this.sdkClient.opportunityRoles();
    this.logger.info(`Acquired data on Opportunities, # Hubs: '${opportunitiesResponse.data.hubs.length}'`);
    fs.writeFileSync(this.config.files.opportunities, JSON.stringify(opportunitiesResponse));
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
