import { buildApiUrl } from '@real-capita/config';

import type { ApiErrorResponse } from './types';

const DEFAULT_API_BASE_URL = 'http://localhost:3333';

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly apiError: ApiErrorResponse,
  ) {
    super(apiError.message);
    this.name = 'ApiError';
  }
}

type AuthMode = 'public' | 'required';

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  authMode?: AuthMode;
  body?: unknown;
  retryOnUnauthorized?: boolean;
}

const getApiBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

const getResourceUrl = (resource: string): string =>
  buildApiUrl(getApiBaseUrl(), resource);

const isJsonResponse = (response: Response): boolean =>
  response.headers.get('content-type')?.includes('application/json') ?? false;

const normalizeApiError = async (response: Response): Promise<ApiError> => {
  const fallbackPayload: ApiErrorResponse = {
    statusCode: response.status,
    error: response.statusText || 'Request failed',
    message: response.statusText || 'Request failed',
    path: response.url,
    timestamp: new Date().toISOString(),
  };

  if (!isJsonResponse(response)) {
    return new ApiError(response.status, fallbackPayload);
  }

  try {
    const payload = (await response.json()) as ApiErrorResponse;

    return new ApiError(response.status, payload);
  } catch {
    return new ApiError(response.status, fallbackPayload);
  }
};

let refreshPromise: Promise<void> | null = null;

const refreshBrowserSession = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('Session refresh is only supported in the browser.');
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(getResourceUrl('auth/refresh'), {
        method: 'POST',
        body: JSON.stringify({}),
        cache: 'no-store',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw await normalizeApiError(response);
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  await refreshPromise;
};

export const apiRequest = async <TResponse>(
  resource: string,
  {
    authMode = 'required',
    body,
    headers,
    retryOnUnauthorized = true,
    ...init
  }: ApiRequestOptions = {},
): Promise<TResponse> => {
  const execute = async (
    allowRetry: boolean,
  ): Promise<TResponse> => {
    const serializedBody =
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body);
    const requestInit: RequestInit = {
      ...init,
      cache: 'no-store',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body instanceof FormData
          ? {}
          : body === undefined
            ? {}
            : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    };

    if (serializedBody !== undefined) {
      requestInit.body = serializedBody;
    }

    const response = await fetch(getResourceUrl(resource), requestInit);

    if (
      response.status === 401 &&
      authMode === 'required' &&
      retryOnUnauthorized &&
      allowRetry
    ) {
      await refreshBrowserSession();

      return execute(false);
    }

    if (!response.ok) {
      throw await normalizeApiError(response);
    }

    if (response.status === 204 || !isJsonResponse(response)) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  };

  return execute(true);
};

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;
