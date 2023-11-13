import * as dotenv from 'dotenv';
import { AlkemioGraphTransformer } from './AlkemioTransformer';
import { GeoapifyGeocodeHandler } from './handlers/GeoapifyGeocodeHandler';
import { createLogger } from './util/create-logger';

const main = async () => {
  dotenv.config();
  const logger = createLogger();

  logger.info('Tranforming acquired data into a graph for display with D3');

  const apiKey = '4cfbe072a6904698aa21382c71a3a44c'
  const geocodeHandler = new GeoapifyGeocodeHandler(apiKey, logger);
  const alkemioAdapter = new AlkemioGraphTransformer(logger, geocodeHandler);
  alkemioAdapter.transformData();
};

main().catch(error => {
  console.error(error);
});
