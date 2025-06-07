import dotenv from "dotenv";
import { AnalyticsClientConfig } from "../config/analytics-client-config";

export const createConfigUsingEnvVars = (): AnalyticsClientConfig => {
  dotenv.config();
  const acquiredDataFolder = '../transform/src/acquired-data';

  const server =
    process.env.API_ENDPOINT_PRIVATE_GRAPHQL ||
    "http://localhost:3000/api/private/non-interactive/graphql";

  return {
    apiEndpointPrivateGraphql: server,
    authInfo: {
      credentials: {
        email: process.env.AUTH_ADMIN_EMAIL ?? "admin@alkem.io",
        password: process.env.AUTH_ADMIN_PASSWORD ?? "test",
      },
    },
    files: {
      users: `${acquiredDataFolder}/users.json`,
      organizations: `${acquiredDataFolder}/organizations.json`,
      spacesL0: `${acquiredDataFolder}/spaces-l0-roles.json`,
      spacesL1: `${acquiredDataFolder}/spaces-l1-roles.json`,
      spacesL2: `${acquiredDataFolder}/spaces-l2-roles.json`
    }
  };
};
