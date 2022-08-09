import * as dotenv from 'dotenv';
import { AlkemioGraphTransformer } from './AlkemioTransformer';
import { createLogger } from './util/create-logger';

const main = async () => {
  dotenv.config();
  const logger = createLogger();

  logger.info('Tranforming acquired data into a graph for display with D3');
  const alkemioAdapter = new AlkemioGraphTransformer('https://alkem.io');
  alkemioAdapter.transformData();
};

main().catch(error => {
  console.error(error);
});
