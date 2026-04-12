const assert = require('node:assert/strict');
const test = require('node:test');

const { NotFoundException } = require('@nestjs/common');

const { LeadsService } = require('./leads.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeLead = (overrides = {}) => ({
  id: 'lead-1',
  companyId: 'company-1',
  projectId: 'project-1',
  fullName: 'Prospect One',
  email: 'prospect@example.com',
  phone: '+8801711111111',
  source: 'website',
  status: 'NEW',
  notes: null,
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  project: {
    id: 'project-1',
    companyId: 'company-1',
    code: 'PRJ-1',
    name: 'Tower One',
    description: null,
    locationId: null,
    isActive: true,
    createdAt: ISO_DATE,
    updatedAt: ISO_DATE,
  },
  ...overrides,
});

test('leads service creates a lead with the default NEW status', async () => {
  const service = new LeadsService(
    {
      lead: {
        create: async ({ data }) =>
          makeLead({
            ...data,
            project: {
              id: 'project-1',
              companyId: 'company-1',
              code: 'PRJ-1',
              name: 'Tower One',
              description: null,
              locationId: null,
              isActive: true,
              createdAt: ISO_DATE,
              updatedAt: ISO_DATE,
            },
          }),
      },
    },
    {
      assertCompanyExists: async () => undefined,
      assertProjectBelongsToCompany: async () => undefined,
    },
  );

  const lead = await service.createLead('company-1', {
    projectId: 'project-1',
    fullName: '  Prospect One ',
    email: 'Prospect@Example.com',
  });

  assert.equal(lead.status, 'NEW');
  assert.equal(lead.email, 'prospect@example.com');
  assert.equal(lead.projectCode, 'PRJ-1');
});

test('leads service updates lead status and project safely', async () => {
  let updatedData;
  const service = new LeadsService(
    {
      lead: {
        findFirst: async () => makeLead(),
        update: async ({ data }) => {
          updatedData = data;

          return makeLead({
            ...data,
            status: data.status,
            projectId: 'project-2',
            project: {
              id: 'project-2',
              companyId: 'company-1',
              code: 'PRJ-2',
              name: 'Tower Two',
              description: null,
              locationId: null,
              isActive: true,
              createdAt: ISO_DATE,
              updatedAt: ISO_DATE,
            },
          });
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      assertProjectBelongsToCompany: async () => undefined,
    },
  );

  const lead = await service.updateLead('company-1', 'lead-1', {
    projectId: 'project-2',
    status: 'QUALIFIED',
  });

  assert.equal(updatedData.status, 'QUALIFIED');
  assert.equal(lead.status, 'QUALIFIED');
  assert.equal(lead.projectId, 'project-2');
});

test('leads service keeps company-scoped detail lookup strict', async () => {
  const service = new LeadsService(
    {
      lead: {
        findFirst: async () => null,
      },
    },
    {
      assertCompanyExists: async () => undefined,
      assertProjectBelongsToCompany: async () => undefined,
    },
  );

  await assert.rejects(
    () => service.getLeadDetail('company-1', 'lead-other-company'),
    NotFoundException,
  );
});
