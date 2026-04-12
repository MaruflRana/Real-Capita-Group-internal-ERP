import {
  DEFAULT_API_PORT,
  DEFAULT_API_PREFIX,
  DEFAULT_API_VERSION,
  DEFAULT_APP_NAME,
  DEFAULT_SWAGGER_PATH,
} from './defaults';

export type NodeEnvironment = 'development' | 'test' | 'production';

export interface ValidatedEnvironment {
  nodeEnv: NodeEnvironment;
  appName: string;
  api: {
    port: number;
    globalPrefix: string;
    version: string;
    enableSwagger: boolean;
    swaggerPath: string;
  };
  urls: {
    webAppUrl: string;
    apiBaseUrl: string;
    corsOrigins: string[];
  };
  database: {
    url: string;
  };
  storage: {
    endpoint: string;
    publicEndpoint: string;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    forcePathStyle: boolean;
  };
  auth: {
    accessTokenSecret: string;
    accessTokenTtl: string;
    refreshTokenSecret: string;
    refreshTokenTtl: string;
  };
}

type RawEnvironment = Partial<Record<string, string | undefined>>;

const ALLOWED_NODE_ENVS = new Set<NodeEnvironment>([
  'development',
  'test',
  'production',
]);
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

let cachedEnvironment: ValidatedEnvironment | undefined;

const readRequiredString = (
  environment: RawEnvironment,
  key: string,
  errors: string[],
): string => {
  const value = environment[key]?.trim();

  if (!value) {
    errors.push(`${key} is required.`);

    return '';
  }

  return value;
};

const readOptionalString = (
  environment: RawEnvironment,
  key: string,
): string | undefined => {
  const value = environment[key]?.trim();

  return value ? value : undefined;
};

const readRequiredSecret = (
  environment: RawEnvironment,
  key: string,
  errors: string[],
): string => {
  const value = readRequiredString(environment, key, errors);

  if (value && value.length < 32) {
    errors.push(`${key} must be at least 32 characters long.`);
  }

  return value;
};

const parseDuration = (
  rawValue: string | undefined,
  key: string,
  errors: string[],
): string => {
  const value = rawValue?.trim();

  if (!value) {
    errors.push(`${key} is required.`);

    return '';
  }

  if (!/^\d+(ms|s|m|h|d|w|y)?$/i.test(value)) {
    errors.push(`${key} must be a numeric duration such as 900, 15m, or 7d.`);
  }

  return value;
};

const normalizeUrl = (value: string, key: string, errors: string[]): string => {
  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    errors.push(`${key} must be a valid URL.`);

    return value;
  }
};

const normalizeUrlList = (
  value: string,
  key: string,
  errors: string[],
): string[] => {
  const values = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (values.length === 0) {
    errors.push(`${key} must include at least one URL.`);

    return [];
  }

  return values.map((entry) => normalizeUrl(entry, key, errors));
};

const normalizeRoutePath = (value: string): string =>
  value.replace(/^\/+|\/+$/g, '');

const parsePort = (
  rawValue: string | undefined,
  key: string,
  errors: string[],
  fallback = DEFAULT_API_PORT,
): number => {
  if (rawValue === undefined || rawValue.trim().length === 0) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > 65_535
  ) {
    errors.push(`${key} must be a valid TCP port.`);

    return fallback;
  }

  return parsedValue;
};

const parseBoolean = (
  rawValue: string | undefined,
  key: string,
  errors: string[],
  fallback?: boolean,
): boolean => {
  if (rawValue === undefined || rawValue.trim().length === 0) {
    if (fallback !== undefined) {
      return fallback;
    }

    errors.push(`${key} is required.`);

    return false;
  }

  const normalizedValue = rawValue.trim().toLowerCase();

  if (TRUE_VALUES.has(normalizedValue)) {
    return true;
  }

  if (FALSE_VALUES.has(normalizedValue)) {
    return false;
  }

  errors.push(`${key} must be a boolean value.`);

  return fallback ?? false;
};

const parseNodeEnvironment = (
  rawValue: string | undefined,
  errors: string[],
): NodeEnvironment => {
  const value = rawValue?.trim().toLowerCase();

  if (!value) {
    errors.push('NODE_ENV is required.');

    return 'development';
  }

  if (!ALLOWED_NODE_ENVS.has(value as NodeEnvironment)) {
    errors.push(
      `NODE_ENV must be one of ${Array.from(ALLOWED_NODE_ENVS).join(', ')}.`,
    );

    return 'development';
  }

  return value as NodeEnvironment;
};

const parseApiVersion = (
  rawValue: string | undefined,
  errors: string[],
): string => {
  const value = rawValue?.trim() || DEFAULT_API_VERSION;
  const normalizedValue = value.replace(/^v/i, '');

  if (!/^\d+$/.test(normalizedValue)) {
    errors.push('API_VERSION must contain only digits or a v-prefixed number.');

    return DEFAULT_API_VERSION;
  }

  return normalizedValue;
};

const parseEnvironment = (environment: RawEnvironment): ValidatedEnvironment => {
  const errors: string[] = [];
  const nodeEnv = parseNodeEnvironment(environment.NODE_ENV, errors);
  const appName =
    readOptionalString(environment, 'APP_NAME') ?? DEFAULT_APP_NAME;
  const port = parsePort(environment.API_PORT, 'API_PORT', errors);
  const globalPrefix = normalizeRoutePath(
    readOptionalString(environment, 'API_GLOBAL_PREFIX') ?? DEFAULT_API_PREFIX,
  );
  const swaggerPath = normalizeRoutePath(
    readOptionalString(environment, 'SWAGGER_PATH') ?? DEFAULT_SWAGGER_PATH,
  );
  const webAppUrl = normalizeUrl(
    readRequiredString(environment, 'WEB_APP_URL', errors),
    'WEB_APP_URL',
    errors,
  );
  const apiBaseUrl = normalizeUrl(
    readRequiredString(environment, 'API_BASE_URL', errors),
    'API_BASE_URL',
    errors,
  );
  const corsOrigins = normalizeUrlList(
    readOptionalString(environment, 'CORS_ORIGIN') ?? webAppUrl,
    'CORS_ORIGIN',
    errors,
  );
  const storageEndpoint = normalizeUrl(
    readRequiredString(environment, 'S3_ENDPOINT', errors),
    'S3_ENDPOINT',
    errors,
  );
  const storagePublicEndpoint = normalizeUrl(
    readOptionalString(environment, 'S3_PUBLIC_ENDPOINT') ?? storageEndpoint,
    'S3_PUBLIC_ENDPOINT',
    errors,
  );

  if (!globalPrefix) {
    errors.push('API_GLOBAL_PREFIX must not be empty.');
  }

  if (!swaggerPath) {
    errors.push('SWAGGER_PATH must not be empty.');
  }

  const validatedEnvironment: ValidatedEnvironment = {
    nodeEnv,
    appName,
    api: {
      port,
      globalPrefix,
      version: parseApiVersion(environment.API_VERSION, errors),
      enableSwagger: parseBoolean(
        environment.ENABLE_SWAGGER,
        'ENABLE_SWAGGER',
        errors,
        true,
      ),
      swaggerPath,
    },
    urls: {
      webAppUrl,
      apiBaseUrl,
      corsOrigins,
    },
    database: {
      url: readRequiredString(environment, 'DATABASE_URL', errors),
    },
    storage: {
      endpoint: storageEndpoint,
      publicEndpoint: storagePublicEndpoint,
      region: readRequiredString(environment, 'S3_REGION', errors),
      bucket: readRequiredString(environment, 'S3_BUCKET', errors),
      accessKey: readRequiredString(environment, 'S3_ACCESS_KEY', errors),
      secretKey: readRequiredString(environment, 'S3_SECRET_KEY', errors),
      forcePathStyle: parseBoolean(
        environment.S3_FORCE_PATH_STYLE,
        'S3_FORCE_PATH_STYLE',
        errors,
      ),
    },
    auth: {
      accessTokenSecret: readRequiredSecret(
        environment,
        'JWT_ACCESS_TOKEN_SECRET',
        errors,
      ),
      accessTokenTtl: parseDuration(
        environment.JWT_ACCESS_TOKEN_TTL,
        'JWT_ACCESS_TOKEN_TTL',
        errors,
      ),
      refreshTokenSecret: readRequiredSecret(
        environment,
        'JWT_REFRESH_TOKEN_SECRET',
        errors,
      ),
      refreshTokenTtl: parseDuration(
        environment.JWT_REFRESH_TOKEN_TTL,
        'JWT_REFRESH_TOKEN_TTL',
        errors,
      ),
    },
  };

  if (errors.length > 0) {
    throw new Error(
      `API environment validation failed:\n- ${errors.join('\n- ')}`,
    );
  }

  return validatedEnvironment;
};

export const getValidatedEnvironment = (
  environment: RawEnvironment = process.env,
): ValidatedEnvironment => {
  if (environment === process.env && cachedEnvironment) {
    return cachedEnvironment;
  }

  const parsedEnvironment = parseEnvironment(environment);

  if (environment === process.env) {
    cachedEnvironment = parsedEnvironment;
  }

  return parsedEnvironment;
};

export const validateEnvironment = (
  environment: Record<string, unknown>,
): Record<string, string> => {
  const parsedEnvironment = getValidatedEnvironment(environment as RawEnvironment);

  return {
    ...Object.fromEntries(
      Object.entries(environment).map(([key, value]) => [key, String(value)]),
    ),
    NODE_ENV: parsedEnvironment.nodeEnv,
    APP_NAME: parsedEnvironment.appName,
    API_PORT: String(parsedEnvironment.api.port),
    API_GLOBAL_PREFIX: parsedEnvironment.api.globalPrefix,
    API_VERSION: parsedEnvironment.api.version,
    ENABLE_SWAGGER: String(parsedEnvironment.api.enableSwagger),
    SWAGGER_PATH: parsedEnvironment.api.swaggerPath,
    WEB_APP_URL: parsedEnvironment.urls.webAppUrl,
    API_BASE_URL: parsedEnvironment.urls.apiBaseUrl,
    CORS_ORIGIN: parsedEnvironment.urls.corsOrigins.join(','),
    DATABASE_URL: parsedEnvironment.database.url,
    S3_ENDPOINT: parsedEnvironment.storage.endpoint,
    S3_PUBLIC_ENDPOINT: parsedEnvironment.storage.publicEndpoint,
    S3_REGION: parsedEnvironment.storage.region,
    S3_BUCKET: parsedEnvironment.storage.bucket,
    S3_ACCESS_KEY: parsedEnvironment.storage.accessKey,
    S3_SECRET_KEY: parsedEnvironment.storage.secretKey,
    S3_FORCE_PATH_STYLE: String(parsedEnvironment.storage.forcePathStyle),
    JWT_ACCESS_TOKEN_SECRET: parsedEnvironment.auth.accessTokenSecret,
    JWT_ACCESS_TOKEN_TTL: parsedEnvironment.auth.accessTokenTtl,
    JWT_REFRESH_TOKEN_SECRET: parsedEnvironment.auth.refreshTokenSecret,
    JWT_REFRESH_TOKEN_TTL: parsedEnvironment.auth.refreshTokenTtl,
  };
};
