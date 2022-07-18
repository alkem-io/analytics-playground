import * as dotenv from 'dotenv';
import { AlkemioAdapter } from './AlkemioAdapter';
import { alkemioClientFactory } from './util/alkemio-client.factory';
import { createLogger } from './util/create-logger';

const main = async () => {
  dotenv.config();
  const logger = createLogger();

  // const alClient = await alkemioClientFactory();
  // logger.info(`Alkemio server: ${alClient.config.apiEndpointPrivateGraphql}`);
  // await alClient.validateConnection();

  // const hubs = await alClient.hubs();
  // logger.info(`Hubs count: ${hubs?.length}`);
  // if (hubs) {
  //   let count = 0;
  //   for (const hub of hubs) {
  //     count++;
  //     logger.info(`[${count}] - processing hub (${hub.displayName})`);
  //   }
  // }
  const alkemioServer = '';
  const alkemioAdapter = new AlkemioAdapter();
  alkemioAdapter.generateGraphData();
};

main().catch(error => {
  console.error(error);
});
