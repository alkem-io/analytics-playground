import * as dotenv from 'dotenv';
import { AlkemioGraphTransformer } from './AlkemioTransformer';
import { createLogger } from './util/create-logger';
import organizationsData from './acquired-data/organizations.json';
import usersData from './acquired-data/users.json';
import spacesL0Data from './acquired-data/spaces-l0-roles.json';
import { mapSpaceDataToSpaceModel } from '../../acquire/src/util/mapSpacesDataToModel';

const main = async () => {
  dotenv.config();
  const logger = createLogger();

  logger.info('Transforming acquired data into a graph for display with D3');

  const alkemioAdapter = new AlkemioGraphTransformer(logger);

  const users = usersData.data.users;
  const organizations = organizationsData.data.organizations;
  const spacesL0 = spacesL0Data.map(mapSpaceDataToSpaceModel);
  return await alkemioAdapter.transformData({ users, organizations, spacesL0 });
};

main().catch(error => {
  console.error(error);
});
