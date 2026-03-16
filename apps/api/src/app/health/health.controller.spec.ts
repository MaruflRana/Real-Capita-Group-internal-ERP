const assert = require('node:assert/strict');
const test = require('node:test');
const { HttpStatus } = require('@nestjs/common');

const { HealthController } = require('./health.controller');

const livenessResponse = {
  status: 'ok',
  service: 'api',
  version: 'v1',
  timestamp: new Date().toISOString(),
  checks: {
    runtime: {
      status: 'ok',
      target: 'development',
      summary: 'Application runtime is responsive.',
    },
  },
};

const readinessResponse = {
  status: 'error',
  service: 'api',
  version: 'v1',
  timestamp: new Date().toISOString(),
  checks: {
    runtime: {
      status: 'ok',
      target: 'development',
      summary: 'Application runtime is responsive.',
    },
    database: {
      status: 'error',
      target: 'postgresql',
      summary: 'Database unavailable.',
    },
    storage: {
      status: 'ok',
      target: 'real-capita-erp-dev',
      summary: 'Storage reachable.',
    },
  },
};

test('health controller returns liveness payload', () => {
  const controller = new HealthController({
    getLiveness: () => livenessResponse,
    getReadiness: async () => readinessResponse,
    getDependencies: async () => readinessResponse,
  } as never);

  assert.deepEqual(controller.getLiveness(), livenessResponse);
});

test('health controller sets readiness status code for failing dependencies', async () => {
  const controller = new HealthController({
    getLiveness: () => livenessResponse,
    getReadiness: async () => readinessResponse,
    getDependencies: async () => readinessResponse,
  } as never);
  const response = {
    statusCode: HttpStatus.OK,
    status(code: number) {
      this.statusCode = code;

      return this;
    },
  };

  const result = await controller.getReadiness(response as never);

  assert.equal(response.statusCode, HttpStatus.SERVICE_UNAVAILABLE);
  assert.equal(result.status, 'error');
});
