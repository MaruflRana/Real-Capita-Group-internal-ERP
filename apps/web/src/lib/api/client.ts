import { buildApiUrl, HEALTH_ROUTE } from '@real-capita/config';
import type { HealthCheckResponse } from '@real-capita/types';

const DEFAULT_API_BASE_URL = 'http://localhost:3333';

const getApiBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export const fetchHealthStatus = async (): Promise<HealthCheckResponse> => {
  const response = await fetch(buildApiUrl(getApiBaseUrl(), HEALTH_ROUTE), {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Health check request failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as HealthCheckResponse;
};
