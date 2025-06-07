import { createLogger } from './util/create-logger';
import { createConfigUsingEnvVars } from './util/create-config-using-envvars';
import { AlkemioAnalyticsClient } from './AlkemioAnalyticsClient';

const main = async () => {
  const logger = createLogger();
  const config = createConfigUsingEnvVars();

  const alkemioAnalyticsClient = new AlkemioAnalyticsClient(config, logger);
  await alkemioAnalyticsClient.initialise();
  await alkemioAnalyticsClient.logUser();
  await alkemioAnalyticsClient.acquireSpacesL0();
  await alkemioAnalyticsClient.acquireSpacesL1();
  await alkemioAnalyticsClient.acquireSpacesL2();

};

main().catch(error => {
  console.error(error);
});