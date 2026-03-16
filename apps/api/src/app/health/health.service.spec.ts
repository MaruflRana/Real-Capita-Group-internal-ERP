const assert = require('node:assert/strict');
const test = require('node:test');

const { HealthService } = require('./health.service');

const createAppConfig = () => ({
  nodeEnv: 'development',
  appName: 'Real Capita ERP API',
  port: 3333,
  globalPrefix: 'api',
  apiVersion: '1',
  enableSwagger: true,
  swaggerPath: 'api/docs',
  corsOrigins: ['http://localhost:3000'],
  urls: {
    webAppUrl: 'http://localhost:3000',
    apiBaseUrl: 'http://localhost:3333',
  },
});

const createDependencyResult = (
  status: 'ok' | 'error',
  target: string,
  summary: string,
) => ({
  status,
  target,
  summary,
});

test('health service reports ready when database and storage checks pass', async () => {
  const service = new HealthService(
    createAppConfig(),
    {
      checkConnection: async () =>
        createDependencyResult(
          'ok',
          'postgresql',
          'Prisma connectivity check to PostgreSQL succeeded.',
        ),
    } as never,
    {
      checkConnection: async () =>
        createDependencyResult(
          'ok',
          'real-capita-erp-dev',
          'S3-compatible storage endpoint is reachable.',
        ),
    } as never,
  );

  const readiness = await service.getReadiness();

  assert.equal(readiness.status, 'ok');
  assert.equal(readiness.checks.database.status, 'ok');
  assert.equal(readiness.checks.storage.status, 'ok');
});

test('health service surfaces a database readiness failure', async () => {
  const service = new HealthService(
    createAppConfig(),
    {
      checkConnection: async () =>
        createDependencyResult('error', 'postgresql', 'Database unavailable.'),
    } as never,
    {
      checkConnection: async () =>
        createDependencyResult(
          'ok',
          'real-capita-erp-dev',
          'S3-compatible storage endpoint is reachable.',
        ),
    } as never,
  );

  const readiness = await service.getReadiness();

  assert.equal(readiness.status, 'error');
  assert.equal(readiness.checks.database.status, 'error');
});

test('health service surfaces a storage readiness failure', async () => {
  const service = new HealthService(
    createAppConfig(),
    {
      checkConnection: async () =>
        createDependencyResult(
          'ok',
          'postgresql',
          'Prisma connectivity check to PostgreSQL succeeded.',
        ),
    } as never,
    {
      checkConnection: async () =>
        createDependencyResult(
          'error',
          'real-capita-erp-dev',
          'S3-compatible storage connectivity failed.',
        ),
    } as never,
  );

  const readiness = await service.getReadiness();

  assert.equal(readiness.status, 'error');
  assert.equal(readiness.checks.storage.status, 'error');
});
