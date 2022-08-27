import { ClientConfig } from "@alkemio/client-lib/dist/config/ClientConfig";

export interface AnalyticsClientConfig extends ClientConfig  {
  files: {
    users: string,
    organizations: string,
    hubs: string,
    challenges: string,
    opportunities: string
  }
}
