// ── Audit events generator: operational audit events ──────────────────

import { VOLUME_TARGETS } from '../config.mjs';
import { SeededRandom, Sequences, dateOnly } from '../shared.mjs';
import { assignYearToCustomer, assignMonthInYear } from './timeline.mjs';

const AUDIT_CATEGORY_DISTRIBUTION = {
  ACCOUNTING: { fraction: 0.30, count: 150 },
  CRM_PROPERTY_DESK: { fraction: 0.24, count: 120 },
  ADMIN: { fraction: 0.10, count: 50 },
  PAYROLL: { fraction: 0.16, count: 80 },
  ATTACHMENT: { fraction: 0.20, count: 100 },
};

const AUDIT_EVENT_TYPES = {
  ACCOUNTING: [
    'voucher_created', 'voucher_posted', 'voucher_draft_saved',
    'chart_of_accounts_updated', 'receipt_processed',
  ],
  CRM_PROPERTY_DESK: [
    'booking_created', 'sale_contract_signed', 'collection_recorded',
    'customer_registered', 'installment_schedule_created',
  ],
  ADMIN: [
    'company_settings_updated', 'user_role_assigned', 'department_created',
    'location_added', 'employee_profile_updated',
  ],
  PAYROLL: [
    'payroll_run_created', 'payroll_run_finalized', 'payroll_run_posted',
    'salary_structure_updated', 'payroll_line_generated',
  ],
  ATTACHMENT: [
    'attachment_uploaded', 'attachment_finalized', 'attachment_linked',
    'attachment_archived', 'attachment_download_generated',
  ],
};

const ENTITY_TYPE_MAP = {
  ACCOUNTING: ['VOUCHER', 'COMPANY'],
  CRM_PROPERTY_DESK: ['BOOKING', 'SALE_CONTRACT', 'CUSTOMER', 'UNIT'],
  ADMIN: ['COMPANY', 'USER', 'USER_ROLE', 'EMPLOYEE', 'DEPARTMENT', 'LOCATION'],
  PAYROLL: ['PAYROLL_RUN', 'EMPLOYEE'],
  ATTACHMENT: ['ATTACHMENT', 'ATTACHMENT_LINK'],
};

export const seedAudit = async (tx, companyId, refs, rng, seqs) => {
  const adminUserId = refs.get('user', 'admin@realcapita.com.bd');
  const accountantUserId = refs.get('user', 'accountant@realcapita.com.bd');
  const hrUserId = refs.get('user', 'hr@realcapita.com.bd');
  const payrollUserId = refs.get('user', 'payroll@realcapita.com.bd');

  const actorMap = {
    ACCOUNTING: [adminUserId, accountantUserId],
    CRM_PROPERTY_DESK: [adminUserId, refs.get('user', 'sales@realcapita.com.bd')],
    ADMIN: [adminUserId, hrUserId],
    PAYROLL: [adminUserId, payrollUserId],
    ATTACHMENT: [adminUserId, accountantUserId, hrUserId],
  };

  const unitRefList = refs.list('unit') || [];
  const entityIds = {
    VOUCHER: [], SALE_CONTRACT: refs.list('saleContract') || [],
    BOOKING: refs.list('booking') || [], CUSTOMER: refs.list('customer') || [],
    UNIT: unitRefList.map(u => typeof u === 'object' && u !== null ? u.id : u) || [],
    COMPANY: [companyId],
    USER: refs.list('user') || [], EMPLOYEE: refs.list('employee') || [],
    DEPARTMENT: refs.list('department') || [], LOCATION: refs.list('location') || [],
    PAYROLL_RUN: refs.list('payrollRun') || [],
    ATTACHMENT: refs.list('attachment') || [], ATTACHMENT_LINK: [],
    USER_ROLE: [],
  };

  // Fetch vouchers for audit
  const vouchers = await tx.voucher.findMany({ where: { companyId }, select: { id: true }, take: 100 });
  entityIds.VOUCHER = vouchers.map(v => v.id);

  let requestSeq = {};

  for (const [category, spec] of Object.entries(AUDIT_CATEGORY_DISTRIBUTION)) {
    const eventTypes = AUDIT_EVENT_TYPES[category];
    const entityTypes = ENTITY_TYPE_MAP[category];
    const actors = actorMap[category];

    for (let i = 0; i < spec.count; i += 1) {
      const eventType = rng.pick(eventTypes);
      const entityType = rng.pick(entityTypes);
      const entityIdPool = entityIds[entityType] || [];
      const entityId = entityIdPool.length > 0 ? rng.pick(entityIdPool) : null;
      const actorUserId = rng.pick(actors);

      const year = assignYearToCustomer(rng);
      const month = assignMonthInYear(rng, year);
      const day = rng.nextInt(1, 28);

      // Request ID format
      if (!requestSeq[year]) requestSeq[year] = 0;
      requestSeq[year] += 1;
      const requestId = `REQ-${year}-${String(requestSeq[year]).padStart(6, '0')}`;

      // Metadata with realistic event summary
      const metadata = generateAuditMetadata(category, eventType, entityId, refs, rng);

      await tx.auditEvent.create({
        data: {
          companyId,
          actorUserId,
          category,
          eventType,
          targetEntityType: entityId ? entityType : null,
          targetEntityId: entityId,
          requestId,
          metadata,
          createdAt: dateOnly(year, month, day),
        },
      });
    }
  }
};

function generateAuditMetadata(category, eventType, entityId, refs, rng) {
  const summaries = {
    voucher_created: 'New voucher entry recorded for period processing',
    voucher_posted: 'Voucher posting completed — debits and credits verified',
    voucher_draft_saved: 'Draft voucher saved for review before posting',
    chart_of_accounts_updated: 'Chart of accounts structure updated',
    receipt_processed: 'Customer receipt processed and bank entry recorded',
    booking_created: 'New booking registered for available unit',
    sale_contract_signed: 'Sale contract executed and installment schedule generated',
    collection_recorded: 'Payment collection recorded against installment schedule',
    customer_registered: 'New customer profile created in CRM system',
    installment_schedule_created: 'Installment payment schedule configured for contract',
    company_settings_updated: 'Company workspace configuration updated',
    user_role_assigned: 'Access role assignment updated for operator account',
    department_created: 'New department structure added to organization',
    location_added: 'New operational location registered',
    employee_profile_updated: 'Employee profile information updated',
    payroll_run_created: 'Monthly payroll computation initiated',
    payroll_run_finalized: 'Payroll run review completed and finalized',
    payroll_run_posted: 'Payroll posting completed — expense voucher generated',
    salary_structure_updated: 'Salary component structure updated',
    payroll_line_generated: 'Individual payroll line computed for employee',
    attachment_uploaded: 'Document attachment metadata recorded',
    attachment_finalized: 'Attachment upload finalized and status confirmed',
    attachment_linked: 'Document linked to related business entity',
    attachment_archived: 'Attachment archived — access restricted',
    attachment_download_generated: 'Secure download access generated for attachment',
  };

  return {
    summary: summaries[eventType] || `${eventType} performed`,
    category,
    timestamp: new Date().toISOString(),
  };
}
