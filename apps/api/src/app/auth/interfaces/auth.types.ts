import type { ACCESS_TOKEN_TYPE, REFRESH_TOKEN_TYPE } from '../constants/auth.constants';

export interface CompanyAssignment {
  companyId: string;
  companyName: string;
  companySlug: string;
  roles: string[];
}

export interface AuthAssignment {
  company: {
    id: string;
    name: string;
    slug: string;
  };
  roles: string[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  roles: string[];
}

export interface AuthProfile {
  id: string;
  email: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  currentCompany: {
    id: string;
    name: string;
    slug: string;
  };
  roles: string[];
  assignments: AuthAssignment[];
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  companyId: string;
  roles: string[];
  type: typeof ACCESS_TOKEN_TYPE;
}

export interface RefreshTokenPayload {
  sub: string;
  companyId: string;
  familyId: string;
  type: typeof REFRESH_TOKEN_TYPE;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface IssuedTokenSet {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  refreshTokenId: string;
  familyId: string;
}

export interface BootstrapAdminInput {
  companyName: string;
  companySlug: string;
  adminEmail: string;
  adminPassword: string;
}

export interface BootstrapAdminResult {
  companyId: string;
  adminUserId: string;
  createdCompany: boolean;
  createdUser: boolean;
  reusedExistingUser: boolean;
  attachedAdminRole: boolean;
  ensuredRoles: string[];
}
