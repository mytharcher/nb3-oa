import '@nocobase/app-client';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    enterpriseIdentity: {
      enabled?: boolean;
      providerId?: string;
      label?: string;
    };
  }
}
