import { registerAs } from '@nestjs/config';

import {
  API_PREFIX,
  API_VERSION,
  APP_NAME,
  DEFAULT_API_PORT,
  DEFAULT_SWAGGER_PATH,
  parseBooleanEnv,
  parseIntegerEnv,
  parseOrigins,
} from '@real-capita/config';

export interface ApiRuntimeConfig {
  appName: string;
  port: number;
  globalPrefix: string;
  apiVersion: string;
  corsOrigins: string[];
  swaggerPath: string;
  enableSwagger: boolean;
}

export default registerAs(
  'api',
  (): ApiRuntimeConfig => ({
    appName: process.env.APP_NAME?.trim() || `${APP_NAME} API`,
    port: parseIntegerEnv(process.env.API_PORT, DEFAULT_API_PORT),
    globalPrefix: process.env.API_GLOBAL_PREFIX?.trim() || API_PREFIX,
    apiVersion: process.env.API_VERSION?.trim() || API_VERSION,
    corsOrigins: parseOrigins(
      process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    ),
    swaggerPath: process.env.SWAGGER_PATH?.trim() || DEFAULT_SWAGGER_PATH,
    enableSwagger: parseBooleanEnv(process.env.ENABLE_SWAGGER, true),
  }),
);
