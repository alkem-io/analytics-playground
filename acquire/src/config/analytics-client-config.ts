import { AlkemioClientConfig } from '@alkemio/client-lib/dist/config/alkemio-client-config';

export interface AnalyticsClientConfig extends AlkemioClientConfig  {
  files: {
    users: string,
    organizations: string,
    hubs: string,
    challenges: string,
    opportunities: string
  }
}
