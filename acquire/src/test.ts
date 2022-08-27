import * as dotenv from 'dotenv';
import { createLogger } from './util/create-logger';

const main = async () => {
  dotenv.config();
  const logger = createLogger();

  logger.info('Tranforming acquired data into a graph for display with D3');

  const apiKey = '4cfbe072a6904698aa21382c71a3a44c'
  const geocodeHandler = new GeoapifyGeocodeHandler(apiKey);
  const alkemioAdapter = new AlkemioGraphTransformer('https://alkem.io', geocodeHandler);
  alkemioAdapter.transformData();
};

main().catch(error => {
  console.error(error);
});
