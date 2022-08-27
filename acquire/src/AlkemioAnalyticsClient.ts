/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient } from 'graphql-request';
import { ClientConfig } from './config/ClientConfig';

import { ErrorHandler, handleErrors } from './util/handleErrors';
import { Sdk, getSdk } from './generated/graphql';
import { Logger } from 'winston';

export class AlkemioAnalyticsClient {
  public apiToken: string;
  public config!: ClientConfig;
  private sdkClient!: Sdk;
  private errorHandler: ErrorHandler;
  private logger: Logger;

  constructor(config: ClientConfig, apiToken: string, logger: Logger) {
    this.apiToken = apiToken;
    this.errorHandler = handleErrors();
    this.logger = logger;
    this.config = config;
    this.logger.verbose(`API token: ${this.apiToken}`);
  }

  async initialise() {
    try {
      const client = new GraphQLClient(this.config.apiEndpointPrivateGraphql, {
        headers: {
          authorization: `Bearer ${this.apiToken}`,
        },
      });
      this.sdkClient = getSdk(client);
    } catch (error) {
      throw new Error(
        `Unable to create client for Alkemio endpoint: ${error}`
      );
    }

  }

}
