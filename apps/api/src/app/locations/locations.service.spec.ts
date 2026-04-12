const assert = require('node:assert/strict');
const test = require('node:test');

const { ConflictException } = require('@nestjs/common');

const { LocationsService } = require('./locations.service');

test('locations service creates a location when code and name are unique within the company', async () => {
  const service = new LocationsService(
    {
      company: {
        findUnique: async () => ({
          id: 'company-1',
        }),
      },
      location: {
        findFirst: async () => null,
        create: async ({ data }) => ({
          id: 'location-1',
          companyId: data.companyId,
          code: data.code,
          name: data.name,
          description: data.description,
          isActive: true,
          createdAt: new Date('2026-03-16T00:00:00.000Z'),
          updatedAt: new Date('2026-03-16T00:00:00.000Z'),
        }),
      },
    },
    {
      recordEvent: async () => undefined,
    },
  );

  const location = await service.createLocation('company-1', 'user-1', undefined, {
    code: 'hq',
    name: 'Headquarters',
    description: 'Primary office',
  });

  assert.equal(location.code, 'HQ');
  assert.equal(location.name, 'Headquarters');
});

test('locations service rejects duplicate location codes within the same company', async () => {
  let locationFindFirstCall = 0;
  const service = new LocationsService(
    {
      company: {
        findUnique: async () => ({
          id: 'company-1',
        }),
      },
      location: {
        findFirst: async () => {
          locationFindFirstCall += 1;

          return locationFindFirstCall === 1
            ? {
                id: 'location-existing',
              }
            : null;
        },
      },
    },
    {
      recordEvent: async () => undefined,
    },
  );

  await assert.rejects(
    () =>
      service.createLocation('company-1', 'user-1', undefined, {
        code: 'hq',
        name: 'Headquarters',
      }),
    ConflictException,
  );
});
