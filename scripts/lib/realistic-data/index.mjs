// ── Realistic UAT Seed Orchestrator ──────────────────────────────────
// Main entry point for seed, reset, and verify operations.

import {
  COMPANY_NAME, COMPANY_SLUG, VOLUME_TARGETS, CONTAMINATION_PATTERNS,
} from './config.mjs';
import {
  SeededRandom, RefMap, Sequences,
  loadEnvironmentFiles, assertDatabaseEnvironment,
  createPrismaClient, resetCompanyData, deleteOrphanedUsers,
  checkContamination, dateOnly, parseCommonArguments,
  disableTriggerConstraints, enableTriggerConstraints,
} from './shared.mjs';
import { WALKTHROUGH_USERS } from './config.mjs';

import { seedOrganization, seedCostCenters } from './generators/org.mjs';
import { seedUsers } from './generators/users.mjs';
import { seedAccounts } from './generators/accounts.mjs';
import { seedProjects } from './generators/projects.mjs';
import { seedCRM } from './generators/crm.mjs';
import { seedVouchers } from './generators/vouchers.mjs';
import { seedHR } from './generators/hr.mjs';
import { seedPayroll } from './generators/payroll.mjs';
import { seedAttachments } from './generators/attachments.mjs';
import { seedAudit } from './generators/audit.mjs';

// ── Seed command ──────────────────────────────────────────────────────

export const runSeedRealisticCommand = async (options = {}) => {
  const parsedOptions = parseCommonArguments(
    `Usage: corepack pnpm seed:realistic:uat [-- --dry-run]

Creates or refreshes realistic UAT data in the "${COMPANY_NAME}" company.
The reserved company is rebuilt before seeding so the result stays authoritative and clean.

Options:
  --dry-run                         Print the seed plan without connecting to the database
  --confirm-production-realistic-data    Required if NODE_ENV=production
  -h, --help                        Show this help text
`,
  );

  const resolvedOptions = Object.keys(options).length > 0 ? options : parsedOptions;

  const loadedFiles = loadEnvironmentFiles();
  console.log(`Loaded environment files: ${loadedFiles.join(', ')}`);

  assertDatabaseEnvironment(resolvedOptions);

  if (resolvedOptions.dryRun) {
    console.log('\n[DRY RUN] Realistic UAT seed plan:');
    console.log(`  Company: ${COMPANY_NAME} (${COMPANY_SLUG})`);
    console.log(`  Volume targets: ${JSON.stringify(VOLUME_TARGETS, null, 2)}`);
    console.log('  No database operations will be performed.');
    return;
  }

  console.log(`\nSeeding realistic UAT data for "${COMPANY_NAME}"...`);

  const prisma = await createPrismaClient();
  const rng = new SeededRandom(42);
  const refs = new RefMap();
  const seqs = new Sequences();

  // Extend transaction timeout for large dataset
  const SEED_TIMEOUT = 300_000; // 300 seconds

  try {
    await prisma.$transaction(async (tx) => {
      // ── Step 1: Ensure or create company ────────────────────────────
      console.log('  [1/11] Creating/updating company...');
      const company = await tx.company.upsert({
        where: { slug: COMPANY_SLUG },
        create: { name: COMPANY_NAME, slug: COMPANY_SLUG, isActive: true },
        update: { name: COMPANY_NAME, isActive: true },
      });

      const companyId = company.id;
      refs.set('company', COMPANY_SLUG, companyId);
      console.log(`    Company ID: ${companyId}`);

      // ── Step 2: Reset existing company data ─────────────────────────
      console.log('  [2/11] Resetting existing company data...');
      await resetCompanyData(tx, companyId);

      // ── Disable business-rule triggers for the entire seed ────────────
      // This allows creating posted vouchers with lines and posted payroll in one pass
      // Triggers will be re-enabled before the transaction closes
      await disableTriggerConstraints(tx);

      // ── Step 3: Organization (roles, locations, departments, cost centers) ──
      console.log('  [3/11] Seeding organization structure...');
      const { roles } = await seedOrganization(tx, companyId, refs, seqs);

      // ── Step 4: Users ────────────────────────────────────────────────
      console.log('  [4/11] Seeding walkthrough users...');
      const users = await seedUsers(tx, companyId, refs, roles);

      // ── Step 5: Chart of accounts ────────────────────────────────────
      console.log('  [5/11] Seeding chart of accounts...');
      await seedAccounts(tx, companyId, refs);

      // ── Step 6: Projects and units ───────────────────────────────────
      console.log('  [6/12] Seeding projects, units...');
      await seedProjects(tx, companyId, refs, rng, seqs);

      // ── Step 6b: Cost centers (after projects so project IDs are resolved) ──
      console.log('  [6b/12] Seeding cost centers...');
      await seedCostCenters(tx, companyId, refs);

      // ── Step 7: HR (employees, salary, attendance, leave) ────────────
      console.log('  [7/12] Seeding HR data...');
      await seedHR(tx, companyId, refs, rng, seqs);

      // ── Step 8: CRM (customers, leads, bookings, contracts, collections) ──
      console.log('  [8/12] Seeding CRM data...');
      await seedCRM(tx, companyId, refs, rng, seqs);

      // ── Step 9: Vouchers ──────────────────────────────────────────────
      console.log('  [9/12] Seeding vouchers...');
      await seedVouchers(tx, companyId, refs, rng, seqs);

      // ── Step 10: Payroll ──────────────────────────────────────────────
      console.log('  [10/12] Seeding payroll...');
      await seedPayroll(tx, companyId, refs, rng, seqs);

      // ── Step 11: Attachments + Audit ─────────────────────────────────
      console.log('  [11/12] Seeding attachments and audit events...');
      await seedAttachments(tx, companyId, refs, rng, seqs);
      await seedAudit(tx, companyId, refs, rng, seqs);

      // ── Re-enable business-rule triggers ──────────────────────────────
      await enableTriggerConstraints(tx);

    }, { timeout: SEED_TIMEOUT });

    console.log('\n✅ Realistic UAT seed completed successfully.');
    console.log('  Run `corepack pnpm seed:realistic:verify` to validate the dataset.');

  } catch (error) {
    console.error('\n❌ Realistic UAT seed failed:', error instanceof Error ? error.message : error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// ── Reset command ──────────────────────────────────────────────────────

export const runResetRealisticCommand = async (options = {}) => {
  const parsedOptions = parseCommonArguments(
    `Usage: corepack pnpm seed:realistic:uat:reset [-- --dry-run]

Deletes only realistic UAT data for the "${COMPANY_NAME}" company.

Options:
  --dry-run                         Print planned deletion counts without deleting data
  --confirm-production-realistic-data    Required if NODE_ENV=production
  -h, --help                        Show this help text
`,
  );

  const resolvedOptions = Object.keys(options).length > 0 ? options : parsedOptions;

  const loadedFiles = loadEnvironmentFiles();
  console.log(`Loaded environment files: ${loadedFiles.join(', ')}`);

  assertDatabaseEnvironment(resolvedOptions);

  const prisma = await createPrismaClient();

  try {
    const company = await prisma.company.findUnique({
      where: { slug: COMPANY_SLUG },
    });

    if (!company) {
      console.log(`No "${COMPANY_NAME}" company found. Nothing to reset.`);
      return;
    }

    if (resolvedOptions.dryRun) {
      console.log('\n[DRY RUN] Would reset data for:', COMPANY_NAME);
      return;
    }

    console.log(`\nResetting realistic UAT data for "${COMPANY_NAME}"...`);

    await prisma.$transaction(async (tx) => {
      await resetCompanyData(tx, company.id);

      // Delete orphaned walkthrough users
      const userEmails = WALKTHROUGH_USERS.map(u => u.email);
      await deleteOrphanedUsers(tx, userEmails);
    }, { timeout: 120_000 });

    console.log('\n✅ Reset completed successfully.');

  } catch (error) {
    console.error('\n❌ Reset failed:', error instanceof Error ? error.message : error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// ── Verify command ─────────────────────────────────────────────────────

export const runVerifyRealisticCommand = async (options = {}) => {
  const parsedOptions = parseCommonArguments(
    `Usage: corepack pnpm seed:realistic:verify

Verifies the realistic UAT company, access, module counts, report-ready accounting data,
and contamination-free business-facing text.

Options:
  --confirm-production-realistic-data    Required if NODE_ENV=production
  -h, --help                        Show this help text
`,
  );

  const resolvedOptions = Object.keys(options).length > 0 ? options : parsedOptions;

  const loadedFiles = loadEnvironmentFiles();
  console.log(`Loaded environment files: ${loadedFiles.join(', ')}`);

  assertDatabaseEnvironment(resolvedOptions);

  const prisma = await createPrismaClient();
  const failures = [];

  try {
    const company = await prisma.company.findUnique({
      where: { slug: COMPANY_SLUG },
    });

    if (!company) {
      failures.push('Company not found');
      reportVerification(failures);
      return;
    }

    const companyId = company.id;
    console.log(`\nVerifying realistic UAT data for "${COMPANY_NAME}" (ID: ${companyId})...`);

    // ── 10.1 Volume verification ──────────────────────────────────────
    console.log('\n── Volume Verification ──');

    const counts = {
      locations: await prisma.location.count({ where: { companyId } }),
      departments: await prisma.department.count({ where: { companyId } }),
      costCenters: await prisma.costCenter.count({ where: { companyId } }),
      users: await prisma.userRole.count({ where: { companyId } }),
      accountGroups: await prisma.accountGroup.count({ where: { companyId } }),
      ledgerAccounts: await prisma.ledgerAccount.count({ where: { companyId } }),
      particularAccounts: await prisma.particularAccount.count({ where: { companyId } }),
      projects: await prisma.project.count({ where: { companyId } }),
      unitTypes: await prisma.unitType.count({ where: { companyId } }),
      units: await prisma.unit.count({ where: { project: { companyId } } }),
      customers: await prisma.customer.count({ where: { companyId } }),
      leads: await prisma.lead.count({ where: { companyId } }),
      bookings: await prisma.booking.count({ where: { companyId } }),
      saleContracts: await prisma.saleContract.count({ where: { companyId } }),
      installmentSchedules: await prisma.installmentSchedule.count({ where: { companyId } }),
      installmentScheduleRows: await prisma.installmentSchedule.count({ where: { companyId } }),
      collections: await prisma.collection.count({ where: { companyId } }),
      vouchers: await prisma.voucher.count({ where: { companyId } }),
      postedVouchers: await prisma.voucher.count({ where: { companyId, status: 'POSTED' } }),
      draftVouchers: await prisma.voucher.count({ where: { companyId, status: 'DRAFT' } }),
      employees: await prisma.employee.count({ where: { companyId } }),
      salaryStructures: await prisma.salaryStructure.count({ where: { companyId } }),
      payrollRuns: await prisma.payrollRun.count({ where: { companyId } }),
      payrollRunLines: await prisma.payrollRunLine.count({ where: { companyId } }),
      leaveTypes: await prisma.leaveType.count({ where: { companyId } }),
      leaveRequests: await prisma.leaveRequest.count({ where: { companyId } }),
      attendanceDevices: await prisma.attendanceDevice.count({ where: { companyId } }),
      attendanceLogs: await prisma.attendanceLog.count({ where: { companyId } }),
      attachments: await prisma.attachment.count({ where: { companyId } }),
      attachmentLinks: await prisma.attachmentLink.count({ where: { companyId, isActive: true } }),
      auditEvents: await prisma.auditEvent.count({ where: { companyId } }),
    };

    for (const [key, target] of Object.entries(VOLUME_TARGETS)) {
      const actual = counts[key];
      const passed = actual >= target;
      console.log(`  ${key}: ${actual} (target: ${target}) ${passed ? '✅' : '❌'}`);
      if (!passed) failures.push(`Volume: ${key} count ${actual} < target ${target}`);
    }

    // ── 10.2 Zero contamination verification ──────────────────────────
    console.log('\n── Contamination Verification ──');

    const contaminationChecks = [
      { table: 'companies', field: 'name', where: { id: companyId } },
      { table: 'users', field: 'firstName', where: {} },
      { table: 'users', field: 'lastName', where: {} },
      { table: 'customers', field: 'fullName', where: { companyId } },
      { table: 'customers', field: 'email', where: { companyId } },
      { table: 'customers', field: 'phone', where: { companyId } },
      { table: 'customers', field: 'address', where: { companyId } },
      { table: 'employees', field: 'fullName', where: { companyId } },
      { table: 'projects', field: 'name', where: { companyId } },
      { table: 'projects', field: 'code', where: { companyId } },
      { table: 'vouchers', field: 'description', where: { companyId } },
      { table: 'vouchers', field: 'reference', where: { companyId } },
      { table: 'collections', field: 'reference', where: { companyId } },
      { table: 'attachments', field: 'originalFileName', where: { companyId } },
      { table: 'audit_events', field: 'requestId', where: { companyId } },
    ];

    // Check contamination in key business-facing fields
    // We use raw SQL for broad contamination scans since Prisma doesn't support regex filtering
    for (const pattern of CONTAMINATION_PATTERNS) {
      const likePattern = `%${pattern}%`;

      const contaminatedNames = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "customers" WHERE "companyId" = '${companyId}' AND LOWER("fullName") LIKE '${likePattern}'`
      );
      const count = Number(contaminatedNames[0]?.count || 0);
      if (count > 0) {
        failures.push(`Contamination: "${pattern}" found in ${count} customer names`);
      }
    }

    // Check company name directly
    if (checkContamination(company.name)) {
      failures.push(`Contamination: company name contains prohibited pattern`);
    }

    console.log('  Contamination scan complete.');

    // ── 10.4 Time-horizon verification ────────────────────────────────
    console.log('\n── Time-horizon Verification ──');

    const earliestVoucher = await prisma.voucher.findFirst({
      where: { companyId },
      orderBy: { voucherDate: 'asc' },
      select: { voucherDate: true },
    });

    const latestVoucher = await prisma.voucher.findFirst({
      where: { companyId },
      orderBy: { voucherDate: 'desc' },
      select: { voucherDate: true },
    });

    if (earliestVoucher) {
      const year = new Date(earliestVoucher.voucherDate).getFullYear();
      console.log(`  Earliest voucher date: ${earliestVoucher.voucherDate} (year: ${year})`);
      if (year > 2022) failures.push(`Timeline: earliest voucher year ${year} > 2022`);
    }

    if (latestVoucher) {
      const year = new Date(latestVoucher.voucherDate).getFullYear();
      console.log(`  Latest voucher date: ${latestVoucher.voucherDate} (year: ${year})`);
      if (year < 2026) failures.push(`Timeline: latest voucher year ${year} < 2026`);
    }

    // Check year coverage
    for (const year of [2022, 2023, 2024, 2025, 2026]) {
      const yearVouchers = await prisma.voucher.count({
        where: {
          companyId,
          voucherDate: {
            gte: dateOnly(year, 1, 1),
            lt: dateOnly(year + 1, 1, 1),
          },
        },
      });
      console.log(`  Vouchers in ${year}: ${yearVouchers}`);
      if (yearVouchers === 0) failures.push(`Timeline: no vouchers in year ${year}`);
    }

    // ── 10.5 Cross-module chain verification ─────────────────────────
    console.log('\n── Cross-module Chain Verification ──');

    // Contract-to-schedule integrity
    const contractsWithSchedules = await prisma.saleContract.findMany({
      where: { companyId },
      include: { installmentSchedules: true },
    });

    for (const contract of contractsWithSchedules.slice(0, 50)) {
      if (contract.installmentSchedules.length === 0) {
        failures.push(`Chain: contract ${contract.id} has no installment schedules`);
        continue;
      }

      const sum = contract.installmentSchedules.reduce((s, i) => s + Number(i.amount), 0);
      const contractAmount = Number(contract.contractAmount);

      if (Math.abs(sum - contractAmount) > 0.01) {
        failures.push(`Chain: contract ${contract.id} schedule sum ${sum} ≠ contract amount ${contractAmount}`);
      }
    }

    // Collection-to-voucher integrity
    const collectionsWithVouchers = await prisma.collection.findMany({
      where: { companyId },
      include: { voucher: true },
      take: 100,
    });

    for (const collection of collectionsWithVouchers) {
      if (!collection.voucher) {
        failures.push(`Chain: collection ${collection.id} has no linked voucher`);
      }
      if (collection.voucher?.status !== 'POSTED') {
        failures.push(`Chain: collection ${collection.id} voucher is not POSTED`);
      }
    }

    // Voucher balance (debits = credits for posted vouchers)
    const postedVoucherLines = await prisma.voucherLine.findMany({
      where: {
        voucher: { companyId, status: 'POSTED' },
      },
      select: { debitAmount: true, creditAmount: true },
    });

    const totalDebits = postedVoucherLines.reduce((s, l) => s + Number(l.debitAmount), 0);
    const totalCredits = postedVoucherLines.reduce((s, l) => s + Number(l.creditAmount), 0);

    console.log(`  Posted voucher total debits: ৳${totalDebits.toLocaleString()}`);
    console.log(`  Posted voucher total credits: ৳${totalCredits.toLocaleString()}`);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      failures.push(`Balance: posted debits ${totalDebits} ≠ posted credits ${totalCredits}`);
    } else {
      console.log('  ✅ Posted voucher balance verified: debits = credits');
    }

    // ── 10.6 Full-chain customers ─────────────────────────────────────
    const fullChainCustomers = await prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT c."id") as count
      FROM "customers" c
      INNER JOIN "bookings" b ON b."customerId" = c."id" AND b."companyId" = '${companyId}'
      INNER JOIN "sale_contracts" sc ON sc."bookingId" = b."id" AND sc."companyId" = '${companyId}'
      INNER JOIN "installment_schedules" ins ON ins."saleContractId" = sc."id" AND ins."companyId" = '${companyId}'
      INNER JOIN "collections" col ON col."saleContractId" = sc."id" AND col."companyId" = '${companyId}'
      WHERE c."companyId" = '${companyId}'
    `);

    const fullChainCount = Number(fullChainCustomers[0]?.count || 0);
    console.log(`  Full-chain customers: ${fullChainCount} (target: ≥10)`);
    if (fullChainCount < 10) failures.push(`Chain: only ${fullChainCount} full-chain customers (need ≥10)`);

    // ── 10.7 Payroll month coverage ───────────────────────────────────
    const payrollRuns = await prisma.payrollRun.findMany({
      where: { companyId },
      select: { payrollYear: true, payrollMonth: true },
    });

    const distinctMonths = new Set(payrollRuns.map(r => `${r.payrollYear}-${r.payrollMonth}`));
    console.log(`  Payroll month coverage: ${distinctMonths.size} distinct year-months (target: ≥46)`);
    if (distinctMonths.size < 46) failures.push(`Payroll: only ${distinctMonths.size} distinct months (need ≥46)`);

    reportVerification(failures);

  } catch (error) {
    console.error('\n❌ Verification failed:', error instanceof Error ? error.message : error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

function reportVerification(failures) {
  console.log('\n── Verification Summary ──');
  if (failures.length === 0) {
    console.log('  ✅ All checks passed. Realistic UAT dataset is valid.');
  } else {
    console.log(`  ❌ ${failures.length} check(s) failed:`);
    for (const failure of failures) {
      console.log(`    - ${failure}`);
    }
  }
}
