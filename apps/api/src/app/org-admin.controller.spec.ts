const assert = require('node:assert/strict');
const test = require('node:test');
const { GUARDS_METADATA } = require('@nestjs/common/constants');

const { AccessTokenGuard } = require('./auth/guards/access-token.guard');
const { CompanyAssignmentGuard } = require('./auth/guards/company-assignment.guard');
const { RolesGuard } = require('./auth/guards/roles.guard');
const { CompaniesController } = require('./companies/companies.controller');
const { RolesController } = require('./roles/roles.controller');
const { UsersController } = require('./users/users.controller');

test('companies controller protects list and detail routes with admin guards', () => {
  const listGuards =
    Reflect.getMetadata(GUARDS_METADATA, CompaniesController.prototype.listCompanies) ??
    [];
  const detailGuards =
    Reflect.getMetadata(GUARDS_METADATA, CompaniesController.prototype.getCompany) ??
    [];

  assert.ok(listGuards.includes(AccessTokenGuard));
  assert.ok(listGuards.includes(RolesGuard));
  assert.ok(detailGuards.includes(AccessTokenGuard));
  assert.ok(detailGuards.includes(CompanyAssignmentGuard));
});

test('roles controller requires authenticated admin access at the controller level', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, RolesController) ?? [];

  assert.ok(guards.includes(AccessTokenGuard));
  assert.ok(guards.includes(RolesGuard));
});

test('users controller requires company-scoped admin access at the controller level', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, UsersController) ?? [];

  assert.ok(guards.includes(AccessTokenGuard));
  assert.ok(guards.includes(CompanyAssignmentGuard));
});
