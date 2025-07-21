import * as dotenv from 'dotenv';
import { AlkemioGraphTransformer } from './AlkemioTransformer';
import { createLogger } from './util/create-logger';
import spacesNameid from './acquired-data/spaces-nameid.json';
import { mapSpaceDataToSpaceModel } from '../../acquire/src/util/mapSpacesDataToModel';

const main = async () => {
  dotenv.config();
  const logger = createLogger();

  logger.info('Transforming acquired data into a graph for display with D3');

  const alkemioAdapter = new AlkemioGraphTransformer(logger);
  const users = spacesNameid.users;
  const spacesL0 = spacesNameid.spaces.map(mapSpaceDataToSpaceModel);
  const organizations = spacesNameid.organizations;
  await alkemioAdapter.transformData({ users, organizations, spacesL0 });
};

main().catch(error => {
  console.error(error);
});
