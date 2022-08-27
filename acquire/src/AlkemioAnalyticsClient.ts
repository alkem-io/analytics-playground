/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient } from 'graphql-request';
import { AnalyticsClientConfig } from './types/config';
import { ErrorHandler, handleErrors } from './util/handleErrors';
import { Sdk, getSdk } from './generated/graphql';
import { Logger } from 'winston';
import { AlkemioClient } from '@alkemio/client-lib';

export class AlkemioAnalyticsClient {
  public config!: AnalyticsClientConfig;
  public sdkClient!: Sdk;
  private errorHandler: ErrorHandler;
  private logger: Logger;

  constructor(config: AnalyticsClientConfig, logger: Logger) {
    this.config = config;
    this.errorHandler = handleErrors();
    this.logger = logger;
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

}
