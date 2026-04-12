const assert = require('node:assert/strict');
const test = require('node:test');
const { GUARDS_METADATA } = require('@nestjs/common/constants');

const { AccessTokenGuard } = require('../auth/guards/access-token.guard');
const {
  CompanyAssignmentGuard,
} = require('../auth/guards/company-assignment.guard');
const {
  FinancialReportingController,
} = require('./financial-reporting.controller');

test('financial reporting controller requires company-scoped accounting access', () => {
  const guards =
    Reflect.getMetadata(GUARDS_METADATA, FinancialReportingController) ?? [];

  assert.ok(guards.includes(AccessTokenGuard));
  assert.ok(guards.includes(CompanyAssignmentGuard));
});
