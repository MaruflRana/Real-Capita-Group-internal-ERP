const assert = require('node:assert/strict');
const test = require('node:test');

const { validateEnvironment } = require('./env.validation');

const createValidEnvironment = (): Record<string, string> => ({
  NODE_ENV: 'development',
  APP_NAME: 'Real Capita ERP API',
  API_PORT: '3333',
  API_GLOBAL_PREFIX: 'api',
  API_VERSION: '1',
  ENABLE_SWAGGER: 'true',
  SWAGGER_PATH: 'api/docs',
  WEB_APP_URL: 'http://localhost:3000',
  API_BASE_URL: 'http://localhost:3333',
  CORS_ORIGIN: 'http://localhost:3000',
  DATABASE_URL:
    'postgresql://postgres:change-me@localhost:5432/real_capita_erp?schema=public',
  JWT_ACCESS_TOKEN_SECRET: 'prompt-four-access-token-secret-123456',
  JWT_ACCESS_TOKEN_TTL: '15m',
  JWT_REFRESH_TOKEN_SECRET: 'prompt-four-refresh-token-secret-12345',
  JWT_REFRESH_TOKEN_TTL: '7d',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'real-capita-erp-dev',
  S3_ACCESS_KEY: 'minioadmin',
  S3_SECRET_KEY: 'change-me-minio-root-password',
  S3_FORCE_PATH_STYLE: 'true',
});

test('validateEnvironment rejects missing database configuration', () => {
  const environment = createValidEnvironment();

  delete environment.DATABASE_URL;

  assert.throws(
    () => validateEnvironment(environment),
    /DATABASE_URL is required/,
  );
});

test('validateEnvironment normalizes route paths and versions', () => {
  const normalizedEnvironment = validateEnvironment({
    ...createValidEnvironment(),
    API_VERSION: 'v2',
    SWAGGER_PATH: '/api/docs/',
  });

  assert.equal(normalizedEnvironment.API_VERSION, '2');
  assert.equal(normalizedEnvironment.SWAGGER_PATH, 'api/docs');
  assert.equal(
    normalizedEnvironment.S3_PUBLIC_ENDPOINT,
    normalizedEnvironment.S3_ENDPOINT,
  );
});

test('validateEnvironment rejects short JWT secrets', () => {
  const environment = createValidEnvironment();

  environment.JWT_ACCESS_TOKEN_SECRET = 'too-short';

  assert.throws(
    () => validateEnvironment(environment),
    /JWT_ACCESS_TOKEN_SECRET must be at least 32 characters long/,
  );
});

test('validateEnvironment rejects invalid JWT duration strings', () => {
  const environment = createValidEnvironment();

  environment.JWT_REFRESH_TOKEN_TTL = 'seven-days';

  assert.throws(
    () => validateEnvironment(environment),
    /JWT_REFRESH_TOKEN_TTL must be a numeric duration/,
  );
});

test('validateEnvironment rejects mismatched web and api hosts for cookie auth', () => {
  const environment = createValidEnvironment();

  environment.API_BASE_URL = 'http://127.0.0.1:3333';

  assert.throws(
    () => validateEnvironment(environment),
    /WEB_APP_URL and API_BASE_URL must share the same scheme and hostname/,
  );
});

test('validateEnvironment rejects cors origins that omit the canonical web url', () => {
  const environment = createValidEnvironment();

  environment.CORS_ORIGIN = 'http://localhost:3100';

  assert.throws(
    () => validateEnvironment(environment),
    /CORS_ORIGIN must include WEB_APP_URL exactly/,
  );
});
