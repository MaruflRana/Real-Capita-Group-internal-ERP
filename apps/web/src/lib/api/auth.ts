import { apiRequest } from './client';
import type {
  AuthSessionResponse,
  CurrentUser,
  LoginPayload,
  LogoutResponse,
} from './types';

export const login = (payload: LoginPayload) =>
  apiRequest<AuthSessionResponse>('auth/login', {
    authMode: 'public',
    method: 'POST',
    retryOnUnauthorized: false,
    body: payload,
  });

export const getCurrentUser = () =>
  apiRequest<CurrentUser>('auth/me');

export const logout = () =>
  apiRequest<LogoutResponse>('auth/logout', {
    authMode: 'public',
    method: 'POST',
    retryOnUnauthorized: false,
    body: {},
  });
