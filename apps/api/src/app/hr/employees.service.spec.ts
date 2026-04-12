const assert = require('node:assert/strict');
const test = require('node:test');

const {
  BadRequestException,
  NotFoundException,
} = require('@nestjs/common');

const { EmployeesService } = require('./employees.service');

const ISO_DATE = new Date('2026-03-16T00:00:00.000Z');

const makeEmployee = (overrides = {}) => ({
  id: 'employee-1',
  companyId: 'company-1',
  departmentId: null,
  locationId: null,
  userId: null,
  managerEmployeeId: null,
  employeeCode: 'EMP-001',
  fullName: 'Jane Doe',
  isActive: true,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
  department: null,
  location: null,
  user: null,
  manager: null,
  ...overrides,
});

test('employees service creates an employee and normalizes code/name', async () => {
  let createdData;
  const service = new EmployeesService(
    {
      employee: {
        findFirst: async () => null,
        create: async ({ data }) => {
          createdData = data;

          return makeEmployee({
            ...data,
          });
        },
      },
    },
    {
      assertCompanyExists: async () => undefined,
      getDepartmentRecord: async () => null,
      getLocationRecord: async () => null,
      getUserCompanyAccessRecord: async () => null,
      getEmployeeRecord: async () => makeEmployee(),
    },
  );

  const employee = await service.createEmployee('company-1', {
    employeeCode: ' emp-001 ',
    fullName: '  Jane Doe  ',
  });

  assert.equal(createdData.employeeCode, 'EMP-001');
  assert.equal(createdData.fullName, 'Jane Doe');
  assert.equal(employee.employeeCode, 'EMP-001');
});

test('employees service rejects inactive department assignment', async () => {
  const service = new EmployeesService(
    {
      employee: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getDepartmentRecord: async () => ({
        id: 'department-1',
        isActive: false,
      }),
      getLocationRecord: async () => null,
      getUserCompanyAccessRecord: async () => null,
      getEmployeeRecord: async () => makeEmployee(),
    },
  );

  await assert.rejects(
    () =>
      service.createEmployee('company-1', {
        employeeCode: 'EMP-002',
        fullName: 'John Doe',
        departmentId: 'department-1',
      }),
    BadRequestException,
  );
});

test('employees service rejects manager cycles on update', async () => {
  const service = new EmployeesService(
    {
      employee: {
        findFirst: async ({ where }) => {
          if (where.employeeCode || where.userId) {
            return null;
          }

          if (where.id === 'manager-1') {
            return {
              id: 'manager-1',
              managerEmployeeId: 'employee-1',
            };
          }

          return null;
        },
      },
    },
    {
      getDepartmentRecord: async () => null,
      getLocationRecord: async () => null,
      getUserCompanyAccessRecord: async () => null,
      getEmployeeRecord: async (_companyId, employeeId) =>
        employeeId === 'employee-1'
          ? makeEmployee({
              id: 'employee-1',
              managerEmployeeId: null,
            })
          : makeEmployee({
              id: 'manager-1',
              employeeCode: 'MGR-001',
            }),
    },
  );

  await assert.rejects(
    () =>
      service.updateEmployee('company-1', 'employee-1', {
        managerEmployeeId: 'manager-1',
      }),
    BadRequestException,
  );
});

test('employees service keeps company-scoped detail lookup strict', async () => {
  const service = new EmployeesService(
    {
      employee: {},
    },
    {
      assertCompanyExists: async () => undefined,
      getEmployeeRecord: async () => {
        throw new NotFoundException('Employee not found.');
      },
    },
  );

  await assert.rejects(
    () => service.getEmployeeDetail('company-1', 'employee-other-company'),
    NotFoundException,
  );
});

test('employees service toggles active state', async () => {
  const service = new EmployeesService(
    {
      employee: {
        update: async ({ data }) =>
          makeEmployee({
            isActive: data.isActive,
          }),
      },
    },
    {
      getEmployeeRecord: async () => makeEmployee(),
    },
  );

  const employee = await service.setEmployeeActiveState(
    'company-1',
    'employee-1',
    false,
  );

  assert.equal(employee.isActive, false);
});
