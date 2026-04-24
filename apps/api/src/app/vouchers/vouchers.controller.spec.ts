const assert = require('node:assert/strict');
const test = require('node:test');
const { GUARDS_METADATA } = require('@nestjs/common/constants');

const { AccessTokenGuard } = require('../auth/guards/access-token.guard');
const {
  CompanyAssignmentGuard,
} = require('../auth/guards/company-assignment.guard');
const { VouchersController } = require('./vouchers.controller');

test('vouchers controller keeps company-scoped accounting access on detail and export endpoints', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, VouchersController) ?? [];

  assert.ok(guards.includes(AccessTokenGuard));
  assert.ok(guards.includes(CompanyAssignmentGuard));
});
