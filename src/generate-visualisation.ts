import * as dotenv from 'dotenv';
import { AlkemioAdapter } from './AlkemioAdapter';

const main = async () => {
  dotenv.config();
  const alkemioAdapter = new AlkemioAdapter();

  alkemioAdapter.generateVisualisation();
};

main().catch(error => {
  console.error(error);
});
