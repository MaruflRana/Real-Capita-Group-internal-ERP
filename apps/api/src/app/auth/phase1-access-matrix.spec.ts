import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPhase1AccessSummary,
  PHASE1_ACCESS_MATRIX,
  PHASE1_MODULE_KEYS,
  type Phase1ModuleKey,
} from '@real-capita/config';

import { AttachmentsController } from '../attachments/attachments.controller';
import { AUTH_ROLES_KEY } from './constants/auth.constants';
import { BookingsController } from '../crm-property-desk/bookings.controller';
import { EmployeesController } from '../hr/employees.controller';
import { FinancialReportingController } from '../financial-reporting/financial-reporting.controller';
import { PayrollRunsController } from '../payroll/payroll-runs.controller';
import { ProjectsController } from '../project-property/projects.controller';
import { AuditController } from '../audit/audit.controller';
import { UsersController } from '../users/users.controller';
import { VouchersController } from '../vouchers/vouchers.controller';

const expectControllerRoles = (
  controller: object,
  moduleKey: Phase1ModuleKey,
) => {
  const roles = Reflect.getMetadata(AUTH_ROLES_KEY, controller) ?? [];

  assert.deepEqual(
    roles,
    PHASE1_ACCESS_MATRIX[moduleKey].allowedRoles,
    `${controller.constructor.name} should use the Phase 1 ${moduleKey} access roles.`,
  );
};

test('Phase 1 module controllers use the documented access matrix', () => {
  expectControllerRoles(UsersController, 'orgSecurity');
  expectControllerRoles(VouchersController, 'accounting');
  expectControllerRoles(FinancialReportingController, 'financialReports');
  expectControllerRoles(ProjectsController, 'projectProperty');
  expectControllerRoles(BookingsController, 'crmPropertyDesk');
  expectControllerRoles(EmployeesController, 'hr');
  expectControllerRoles(PayrollRunsController, 'payroll');
  expectControllerRoles(AttachmentsController, 'auditDocuments');
  expectControllerRoles(AuditController, 'auditEvents');
});

test('Phase 1 matrix grants the expected representative company-role access', () => {
  const adminAccess = buildPhase1AccessSummary(['company_admin']);
  const accountantAccess = buildPhase1AccessSummary(['company_accountant']);
  const hrAccess = buildPhase1AccessSummary(['company_hr']);
  const payrollAccess = buildPhase1AccessSummary(['company_payroll']);
  const salesAccess = buildPhase1AccessSummary(['company_sales']);
  const memberAccess = buildPhase1AccessSummary(['company_member']);

  for (const moduleKey of PHASE1_MODULE_KEYS) {
    assert.equal(
      adminAccess[moduleKey],
      true,
      `company_admin should retain Phase 1 access to ${moduleKey}.`,
    );
  }

  assert.deepEqual(
    accountantAccess,
    {
      dashboard: true,
      orgSecurity: false,
      accounting: true,
      financialReports: true,
      projectProperty: false,
      crmPropertyDesk: false,
      hr: false,
      payroll: false,
      auditDocuments: true,
      auditEvents: false,
    },
    'company_accountant access should stay aligned with the Phase 1 matrix.',
  );

  assert.deepEqual(
    hrAccess,
    {
      dashboard: true,
      orgSecurity: false,
      accounting: false,
      financialReports: false,
      projectProperty: false,
      crmPropertyDesk: false,
      hr: true,
      payroll: true,
      auditDocuments: true,
      auditEvents: false,
    },
    'company_hr access should stay aligned with the Phase 1 matrix.',
  );

  assert.deepEqual(
    payrollAccess,
    {
      dashboard: true,
      orgSecurity: false,
      accounting: false,
      financialReports: false,
      projectProperty: false,
      crmPropertyDesk: false,
      hr: false,
      payroll: true,
      auditDocuments: true,
      auditEvents: false,
    },
    'company_payroll access should stay aligned with the Phase 1 matrix.',
  );

  assert.deepEqual(
    salesAccess,
    {
      dashboard: true,
      orgSecurity: false,
      accounting: false,
      financialReports: false,
      projectProperty: false,
      crmPropertyDesk: true,
      hr: false,
      payroll: false,
      auditDocuments: true,
      auditEvents: false,
    },
    'company_sales access should stay aligned with the Phase 1 matrix.',
  );

  assert.deepEqual(
    memberAccess,
    {
      dashboard: true,
      orgSecurity: false,
      accounting: false,
      financialReports: false,
      projectProperty: false,
      crmPropertyDesk: false,
      hr: false,
      payroll: false,
      auditDocuments: false,
      auditEvents: false,
    },
    'company_member access should stay limited to the dashboard in Phase 1.',
  );
});
