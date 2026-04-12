'use client';

import {
  startTransition,
  useEffect,
  type ReactNode,
} from 'react';
import { Button } from '@real-capita/ui';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '../providers/auth-provider';
import { APP_ROUTES } from '../../lib/routes';

import { StateScreen } from '../ui/state-screen';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const {
    refreshSession,
    sessionError,
    status,
    user,
  } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'unauthenticated') {
      return;
    }

    const nextPath = `${pathname}${typeof window !== 'undefined' ? window.location.search : ''}`;
    const target = new URLSearchParams({
      next: nextPath,
    });

    startTransition(() => {
      router.replace(`${APP_ROUTES.login}?${target.toString()}`);
    });
  }, [pathname, router, status]);

  if (status === 'loading') {
    return (
      <StateScreen
        title="Restoring session"
        description="Checking the current browser session and company scope."
      />
    );
  }

  if (!user) {
    if (sessionError && sessionError.statusCode !== 401) {
      return (
        <StateScreen
          title="Session check failed"
          description={sessionError.message}
          actions={
            <Button onClick={() => void refreshSession()} size="sm">
              Retry
            </Button>
          }
        />
      );
    }

    return (
      <StateScreen
        title="Redirecting to sign in"
        description="This workspace requires an authenticated session."
      />
    );
  }

  return <>{children}</>;
};
