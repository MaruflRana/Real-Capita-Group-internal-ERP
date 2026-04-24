'use client';

import {
  createContext,
  useContext,
  useMemo,
  startTransition,
  type ReactNode,
} from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Phase1AccessSummary } from '@real-capita/config';

import { getCurrentUser, login, logout } from '../../lib/api/auth';
import { isApiError } from '../../lib/api/client';
import { getUserAccessSummary } from '../../lib/access';
import { APP_ROUTES } from '../../lib/routes';

import type {
  ApiErrorResponse,
  AuthSessionResponse,
  CompanyAssignment,
  CurrentUser,
  LoginPayload,
} from '../../lib/api/types';

interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: CurrentUser | null;
  sessionError: ApiErrorResponse | null;
  adminAssignments: CompanyAssignment[];
  access: Phase1AccessSummary;
  canAccessDashboard: boolean;
  canAccessAccounting: boolean;
  canAccessDocuments: boolean;
  canAccessAuditEvents: boolean;
  canAccessPayroll: boolean;
  canAccessProjectProperty: boolean;
  canAccessCrmPropertyDesk: boolean;
  canAccessHr: boolean;
  canAccessOrgSecurity: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthSessionResponse>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isSigningIn: boolean;
  isSigningOut: boolean;
}

const SESSION_QUERY_KEY = ['auth', 'session'] as const;

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getCurrentUser,
    retry: false,
  });

  const signInMutation = useMutation({
    mutationFn: login,
    onSuccess: async (session) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, session.user);
      await queryClient.invalidateQueries({
        queryKey: SESSION_QUERY_KEY,
      });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.clear();
      startTransition(() => {
        router.replace(APP_ROUTES.login);
      });
    },
  });

  const sessionError =
    isApiError(sessionQuery.error) ? sessionQuery.error.apiError : null;
  const user = sessionQuery.data ?? null;
  const adminAssignments =
    user?.assignments.filter((assignment) =>
      assignment.roles.includes('company_admin'),
    ) ?? [];
  const access = getUserAccessSummary(user);
  const canAccessAccounting = access.accounting;
  const canAccessDocuments = access.auditDocuments;
  const canAccessPayroll = access.payroll;
  const canAccessProjectProperty = access.projectProperty;
  const canAccessCrmPropertyDesk = access.crmPropertyDesk;
  const canAccessHr = access.hr;

  const value = useMemo<AuthContextValue>(
    () => ({
      status: sessionQuery.isPending
        ? 'loading'
        : user
          ? 'authenticated'
          : 'unauthenticated',
      user,
      sessionError,
      adminAssignments,
      access,
      canAccessDashboard: access.dashboard,
      canAccessAccounting,
      canAccessDocuments,
      canAccessAuditEvents: access.auditEvents,
      canAccessPayroll,
      canAccessProjectProperty,
      canAccessCrmPropertyDesk,
      canAccessHr,
      canAccessOrgSecurity: access.orgSecurity,
      signIn: signInMutation.mutateAsync,
      signOut: async () => {
        await signOutMutation.mutateAsync();
      },
      refreshSession: async () => {
        await queryClient.invalidateQueries({
          queryKey: SESSION_QUERY_KEY,
        });
      },
      isSigningIn: signInMutation.isPending,
      isSigningOut: signOutMutation.isPending,
    }),
    [
      access,
      adminAssignments,
      canAccessAccounting,
      canAccessDocuments,
      canAccessPayroll,
      canAccessCrmPropertyDesk,
      canAccessHr,
      canAccessProjectProperty,
      queryClient,
      sessionError,
      sessionQuery.isPending,
      signInMutation.isPending,
      signInMutation.mutateAsync,
      signOutMutation.isPending,
      signOutMutation.mutateAsync,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
};
