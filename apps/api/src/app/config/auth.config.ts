import type { JwtSignOptions } from '@nestjs/jwt';
import { registerAs, type ConfigType } from '@nestjs/config';

import { getValidatedEnvironment } from './env.validation';

export const authConfig = registerAs('auth', () => {
  const environment = getValidatedEnvironment();

  return {
    accessTokenSecret: environment.auth.accessTokenSecret,
    accessTokenTtl:
      environment.auth.accessTokenTtl as NonNullable<JwtSignOptions['expiresIn']>,
    refreshTokenSecret: environment.auth.refreshTokenSecret,
    refreshTokenTtl:
      environment.auth.refreshTokenTtl as NonNullable<JwtSignOptions['expiresIn']>,
  };
});

export type AuthConfig = ConfigType<typeof authConfig>;

export default authConfig;
