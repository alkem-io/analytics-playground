import { createLogger } from './util/create-logger';
import { AlkemioAnalyticsClient } from './AlkemioAnalyticsClient';
import dotenv from 'dotenv';
import { createConfigUsingEnvVars } from './util/create-config-using-envvars';

const main = async () => {
  dotenv.config()
  const logger = createLogger();

  const config = createConfigUsingEnvVars();
  logger.info(
    `Alkemio server: ${config.apiEndpointPrivateGraphql}`
  );
  logger.info(
    `Auth info: ${JSON.stringify(config.authInfo)}`
  );

  const alkemioAnalyticsClient = new AlkemioAnalyticsClient(config, logger);
  await alkemioAnalyticsClient.initialise();
  await alkemioAnalyticsClient.logUser();

};

main().catch(error => {
  console.error(error);
});