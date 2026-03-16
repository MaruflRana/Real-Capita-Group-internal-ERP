import { registerAs, type ConfigType } from '@nestjs/config';

import { getValidatedEnvironment } from './env.validation';

export const appConfig = registerAs('app', () => {
  const environment = getValidatedEnvironment();

  return {
    nodeEnv: environment.nodeEnv,
    appName: environment.appName,
    port: environment.api.port,
    globalPrefix: environment.api.globalPrefix,
    apiVersion: environment.api.version,
    enableSwagger: environment.api.enableSwagger,
    swaggerPath: environment.api.swaggerPath,
    corsOrigins: environment.urls.corsOrigins,
    urls: {
      webAppUrl: environment.urls.webAppUrl,
      apiBaseUrl: environment.urls.apiBaseUrl,
    },
  };
});

export type AppConfig = ConfigType<typeof appConfig>;

export default appConfig;
