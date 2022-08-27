import { createLogger } from './util/create-logger';
import { createClientUsingEnvVars } from './util/create-client-using-envvars';
import { AlkemioAnalyticsClient } from './AlkemioAnalyticsClient';
import dotenv from 'dotenv';

const main = async () => {
  dotenv.config()
  const logger = createLogger();

  const alkemioClient = await createClientUsingEnvVars();
  logger.info(
    `Alkemio server: ${alkemioClient.config.apiEndpointPrivateGraphql}`
  );
  await alkemioClient.validateConnection();
  const apiToken = alkemioClient.apiToken;

  const alkemioAnalyticsClient = new AlkemioAnalyticsClient(alkemioClient.config, alkemioClient.apiToken, logger);
  await alkemioAnalyticsClient.initialise();

};

main().catch(error => {
  console.error(error);
});