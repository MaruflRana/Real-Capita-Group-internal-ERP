import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

import authConfig, { type AuthConfig } from '../config/auth.config';
import {
  ACCESS_TOKEN_TYPE,
  REFRESH_TOKEN_TYPE,
} from './constants/auth.constants';
import type {
  AuthenticatedUser,
  IssuedTokenSet,
  RefreshTokenPayload,
} from './interfaces/auth.types';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(authConfig.KEY) private readonly config: AuthConfig,
  ) {}

  async issueTokenSet(
    user: AuthenticatedUser,
    existingFamilyId?: string,
  ): Promise<IssuedTokenSet> {
    const familyId = existingFamilyId ?? randomUUID();
    const refreshTokenId = randomUUID();
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        companyId: user.companyId,
        roles: user.roles,
        type: ACCESS_TOKEN_TYPE,
      },
      {
        secret: this.config.accessTokenSecret,
        expiresIn: this.config.accessTokenTtl,
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        companyId: user.companyId,
        familyId,
        type: REFRESH_TOKEN_TYPE,
      },
      {
        secret: this.config.refreshTokenSecret,
        expiresIn: this.config.refreshTokenTtl,
        jwtid: refreshTokenId,
      },
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: this.extractExpiration(accessToken),
      refreshTokenExpiresAt: this.extractExpiration(refreshToken),
      refreshTokenId,
      familyId,
    };
  }

  async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.config.refreshTokenSecret,
        },
      );
    } catch (error) {
      if (
        error instanceof Error &&
        typeof error.name === 'string' &&
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Refresh token has expired.');
      }

      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (payload.type !== REFRESH_TOKEN_TYPE) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    return payload;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  matchesTokenHash(token: string, storedHash: string): boolean {
    const computedHashBuffer = Buffer.from(this.hashToken(token), 'hex');
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (computedHashBuffer.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(computedHashBuffer, storedHashBuffer);
  }

  private extractExpiration(token: string): Date {
    const decodedToken = this.jwtService.decode(token);

    if (
      !decodedToken ||
      typeof decodedToken !== 'object' ||
      typeof (decodedToken as { exp?: unknown }).exp !== 'number'
    ) {
      throw new UnauthorizedException(
        'Unable to determine token expiration.',
      );
    }

    return new Date((decodedToken as { exp: number }).exp * 1000);
  }
}
