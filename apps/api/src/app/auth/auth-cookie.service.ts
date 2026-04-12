import { Inject, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

import appConfig, { type AppConfig } from '../config/app.config';
import {
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_REFRESH_COOKIE_NAME,
} from './constants/auth.constants';

interface SessionCookiePayload {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

@Injectable()
export class AuthCookieService {
  constructor(
    @Inject(appConfig.KEY) private readonly config: AppConfig,
  ) {}

  setSessionCookies(
    response: Response,
    session: SessionCookiePayload,
  ): void {
    this.appendCookie(
      response,
      this.serializeCookie(
        AUTH_ACCESS_COOKIE_NAME,
        session.accessToken,
        new Date(session.accessTokenExpiresAt),
      ),
    );
    this.appendCookie(
      response,
      this.serializeCookie(
        AUTH_REFRESH_COOKIE_NAME,
        session.refreshToken,
        new Date(session.refreshTokenExpiresAt),
      ),
    );
  }

  clearSessionCookies(response: Response): void {
    this.appendCookie(
      response,
      this.serializeExpiredCookie(AUTH_ACCESS_COOKIE_NAME),
    );
    this.appendCookie(
      response,
      this.serializeExpiredCookie(AUTH_REFRESH_COOKIE_NAME),
    );
  }

  readAccessToken(request: Request): string | undefined {
    return this.readCookie(request, AUTH_ACCESS_COOKIE_NAME);
  }

  readRefreshToken(request: Request): string | undefined {
    return this.readCookie(request, AUTH_REFRESH_COOKIE_NAME);
  }

  private readCookie(request: Request, name: string): string | undefined {
    const header = request.headers.cookie;
    const cookieHeader = Array.isArray(header) ? header.join(';') : header;

    if (!cookieHeader) {
      return undefined;
    }

    for (const part of cookieHeader.split(';')) {
      const trimmedPart = part.trim();

      if (!trimmedPart.startsWith(`${name}=`)) {
        continue;
      }

      return decodeURIComponent(trimmedPart.slice(name.length + 1));
    }

    return undefined;
  }

  private appendCookie(response: Response, cookie: string): void {
    const existingCookies = response.getHeader('Set-Cookie');
    const nextCookies = Array.isArray(existingCookies)
      ? existingCookies
      : existingCookies
        ? [String(existingCookies)]
        : [];

    response.setHeader('Set-Cookie', [...nextCookies, cookie]);
  }

  private serializeCookie(
    name: string,
    value: string,
    expiresAt: Date,
  ): string {
    const parts = [
      `${name}=${encodeURIComponent(value)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Expires=${expiresAt.toUTCString()}`,
    ];

    if (this.config.nodeEnv === 'production') {
      parts.push('Secure');
    }

    return parts.join('; ');
  }

  private serializeExpiredCookie(name: string): string {
    const parts = [
      `${name}=`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=0',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ];

    if (this.config.nodeEnv === 'production') {
      parts.push('Secure');
    }

    return parts.join('; ');
  }
}
