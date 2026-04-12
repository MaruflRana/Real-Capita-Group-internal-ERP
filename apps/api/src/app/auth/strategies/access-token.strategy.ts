import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

import authConfig, { type AuthConfig } from '../../config/auth.config';
import { ACCESS_TOKEN_TYPE } from '../constants/auth.constants';
import { AuthCookieService } from '../auth-cookie.service';
import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from '../interfaces/auth.types';
import { AuthService } from '../auth.service';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(authConfig.KEY) config: AuthConfig,
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) =>
          this.authCookieService.readAccessToken(request) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.accessTokenSecret,
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    if (payload.type !== ACCESS_TOKEN_TYPE) {
      throw new UnauthorizedException('Invalid access token.');
    }

    return this.authService.validateAccessTokenPayload(payload);
  }
}
