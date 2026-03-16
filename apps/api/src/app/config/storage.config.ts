import { registerAs, type ConfigType } from '@nestjs/config';

import { getValidatedEnvironment } from './env.validation';

export const storageConfig = registerAs('storage', () => {
  const environment = getValidatedEnvironment();

  return {
    endpoint: environment.storage.endpoint,
    region: environment.storage.region,
    bucket: environment.storage.bucket,
    accessKey: environment.storage.accessKey,
    secretKey: environment.storage.secretKey,
    forcePathStyle: environment.storage.forcePathStyle,
  };
});

export type StorageConfig = ConfigType<typeof storageConfig>;

export default storageConfig;
