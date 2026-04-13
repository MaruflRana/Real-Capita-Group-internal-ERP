import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { APP_ROUTES, PROTECTED_ROUTE_PREFIXES } from './lib/routes';

const ACCESS_COOKIE_NAME = 'rc_access_token';
const REFRESH_COOKIE_NAME = 'rc_refresh_token';

const isProtectedRoute = (pathname: string): boolean =>
  PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const getCanonicalOrigin = (): string | null => {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredOrigin) {
    return null;
  }

  try {
    return new URL(configuredOrigin).origin;
  } catch {
    return null;
  }
};

const getRequestOrigin = (request: NextRequest): string => {
  const host = request.headers.get('host');

  if (!host) {
    return request.nextUrl.origin;
  }

  try {
    return new URL(`${request.nextUrl.protocol}//${host}`).origin;
  } catch {
    return request.nextUrl.origin;
  }
};

export const proxy = (request: NextRequest) => {
  const { pathname, search } = request.nextUrl;
  const canonicalOrigin = getCanonicalOrigin();
  const requestOrigin = getRequestOrigin(request);
  const hasSessionCookie =
    request.cookies.has(ACCESS_COOKIE_NAME) ||
    request.cookies.has(REFRESH_COOKIE_NAME);

  if (
    canonicalOrigin &&
    canonicalOrigin !== requestOrigin &&
    (request.method === 'GET' || request.method === 'HEAD')
  ) {
    return NextResponse.redirect(
      new URL(`${pathname}${search}`, canonicalOrigin),
      307,
    );
  }

  if (pathname === APP_ROUTES.home) {
    return NextResponse.redirect(
      new URL(
        hasSessionCookie ? APP_ROUTES.dashboard : APP_ROUTES.login,
        request.url,
      ),
    );
  }

  if (pathname === APP_ROUTES.login && hasSessionCookie) {
    return NextResponse.redirect(new URL(APP_ROUTES.dashboard, request.url));
  }

  if (isProtectedRoute(pathname) && !hasSessionCookie) {
    const loginUrl = new URL(APP_ROUTES.login, request.url);
    const nextPath =
      pathname === APP_ROUTES.home ? APP_ROUTES.dashboard : `${pathname}${search}`;

    loginUrl.searchParams.set('next', nextPath);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/accounting/:path*',
    '/audit-documents/:path*',
    '/payroll/:path*',
    '/project-property/:path*',
    '/crm-property-desk/:path*',
    '/hr/:path*',
    '/org-security/:path*',
  ],
};
