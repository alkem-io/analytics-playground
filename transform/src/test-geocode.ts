import * as dotenv from 'dotenv';
import { GeoapifyGeocodeHandler } from './handlers/GeoapifyGeocodeHandler';
import { createLogger } from './util/create-logger';

const main = async () => {
  dotenv.config();
  const logger = createLogger();

  logger.info('Testing out Geocode api');
  const apiKey = '4cfbe072a6904698aa21382c71a3a44c'
  const geocodeHandler = new GeoapifyGeocodeHandler(apiKey);
  const resuolt = await geocodeHandler.lookup('IE', '', 'test');
};

main().catch(error => {
  console.error(error);
});
