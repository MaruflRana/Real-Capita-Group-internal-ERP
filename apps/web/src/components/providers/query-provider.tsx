'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

const getQueryClient = (): QueryClient => {
  if (typeof window === 'undefined') {
    return createQueryClient();
  }

  browserQueryClient ??= createQueryClient();

  return browserQueryClient;
};

export const QueryProvider = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
);
