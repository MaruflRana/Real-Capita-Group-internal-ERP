export const APP_NAME = 'Real Capita ERP';
export const API_PREFIX = 'api';
export const API_VERSION = '1';
export const HEALTH_ROUTE = 'health';
export const DEFAULT_API_PORT = 3333;
export const DEFAULT_WEB_PORT = 3000;
export const DEFAULT_SWAGGER_PATH = `${API_PREFIX}/docs`;

export * from './access';

export const buildVersionedApiPath = (
  resource: string,
  version = API_VERSION,
): string => {
  const normalizedResource = resource.replace(/^\/+/, '');

  return `/${API_PREFIX}/v${version}/${normalizedResource}`;
};

export const buildApiUrl = (
  baseUrl: string,
  resource: string,
  version = API_VERSION,
): string => {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  return `${normalizedBaseUrl}${buildVersionedApiPath(resource, version)}`;
};

export const parseIntegerEnv = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsedValue = Number.parseInt(value ?? '', 10);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
};

export const parseBooleanEnv = (
  value: string | undefined,
  fallback: boolean,
): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const parseOrigins = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};
