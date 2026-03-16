import { registerAs, type ConfigType } from '@nestjs/config';

import { getValidatedEnvironment } from './env.validation';

export const databaseConfig = registerAs('database', () => {
  const environment = getValidatedEnvironment();

  return {
    url: environment.database.url,
  };
});

export type DatabaseConfig = ConfigType<typeof databaseConfig>;

export default databaseConfig;
