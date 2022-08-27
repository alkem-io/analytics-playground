import dotenv from 'dotenv';
import { AlkemioClient } from '@alkemio/client-lib';

export const createClientUsingEnvVars = async () => {
  dotenv.config();

  const server =
    process.env.API_ENDPOINT_PRIVATE_GRAPHQL ||
    'http://localhost:3000/api/private/non-interactive/graphql';
  const alkemioClient = new AlkemioClient({
    apiEndpointPrivateGraphql: server,
  });

  alkemioClient.config.authInfo = {
    credentials: {
      email: process.env.AUTH_ADMIN_EMAIL ?? 'admin@alkem.io',
      password: process.env.AUTH_ADMIN_PASSWORD ?? 'Fin1.tan',
    },
  };

  await alkemioClient.enableAuthentication();
  return alkemioClient;
};
