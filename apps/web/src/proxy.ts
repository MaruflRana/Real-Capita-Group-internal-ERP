import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { APP_ROUTES, PROTECTED_ROUTE_PREFIXES } from './lib/routes';

const ACCESS_COOKIE_NAME = 'rc_access_token';
const REFRESH_COOKIE_NAME = 'rc_refresh_token';

const isProtectedRoute = (pathname: string): boolean =>
  PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export const proxy = (request: NextRequest) => {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie =
    request.cookies.has(ACCESS_COOKIE_NAME) ||
    request.cookies.has(REFRESH_COOKIE_NAME);

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
