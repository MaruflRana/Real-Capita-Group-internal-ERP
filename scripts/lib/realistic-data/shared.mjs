import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { forwardedArgs, workspaceRoot } from '../ops.mjs';

export const COMPANY_NAME = 'Real Capita Group';
export const COMPANY_SLUG = 'real-capita-group';
export const UAT_PASSWORD = process.env.UAT_PASSWORD || 'CHANGE_ME_SET_IN_ENV';

const ENVIRONMENT_FILE_PATHS = [
  'apps/api/.env.local',
  'apps/api/.env',
  '.env.local',
  '.env',
];

const TRIGGER_RESET_TABLES = [
  'voucher_lines', 'vouchers',
  'payroll_run_lines', 'payroll_runs',
  'bookings', 'sale_contracts', 'installment_schedules', 'collections',
  'employees', 'leave_requests',
];

// ── Seeded PRNG ──────────────────────────────────────────────────────

export class SeededRandom {
  constructor(seed = 42) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick(array) {
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  chance(probability) {
    return this.next() < probability;
  }

  nextDecimal(min, max, decimals = 2) {
    const factor = Math.pow(10, decimals);
    const value = this.nextInt(Math.round(min * factor), Math.round(max * factor));
    return value / factor;
  }
}

// ── Date helpers ─────────────────────────────────────────────────────

export const dateOnly = (year, month, day) =>
  new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`);

export const dateOnlyFromStr = (value) =>
  new Date(`${value}T00:00:00.000Z`);

export const addMonths = (date, months) => {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
};

export const formatMonthDate = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const MONTHS = [];
for (let year = 2022; year <= 2026; year += 1) {
  const endMonth = year === 2026 ? 4 : 12;
  for (let month = year === 2022 ? 1 : 1; month <= endMonth; month += 1) {
    MONTHS.push({ year, month, label: formatMonthDate(dateOnly(year, month, 1)) });
  }
}

export const PAYROLL_MONTHS = [];
for (let year = 2022; year <= 2026; year += 1) {
  const endMonth = year === 2026 ? 4 : 12;
  const startMonth = year === 2022 ? 7 : 1;
  for (let month = startMonth; month <= endMonth; month += 1) {
    PAYROLL_MONTHS.push({ year, month });
  }
}

// ── ID tracking ──────────────────────────────────────────────────────

export class RefMap {
  constructor() {
    this.map = {};
  }

  set(entityType, key, value) {
    if (!this.map[entityType]) this.map[entityType] = {};
    this.map[entityType][key] = value;
  }

  get(entityType, key) {
    return this.map[entityType]?.[key];
  }

  list(entityType) {
    return Object.values(this.map[entityType] || {});
  }

  keys(entityType) {
    return Object.keys(this.map[entityType] || {});
  }

  count(entityType) {
    return Object.keys(this.map[entityType] || {}).length;
  }
}

// ── Sequence counter ─────────────────────────────────────────────────

export class Sequences {
  constructor() {
    this.counters = {};
  }

  next(prefix) {
    if (!this.counters[prefix]) this.counters[prefix] = 0;
    this.counters[prefix] += 1;
    return `${prefix}-${String(this.counters[prefix]).padStart(4, '0')}`;
  }

  nextYearSeq(prefix, year) {
    const key = `${prefix}-${year}`;
    if (!this.counters[key]) this.counters[key] = 0;
    this.counters[key] += 1;
    return `${prefix}-${year}-${String(this.counters[key]).padStart(4, '0')}`;
  }

  nextSeq(prefix) {
    if (!this.counters[prefix]) this.counters[prefix] = 0;
    this.counters[prefix] += 1;
    return this.counters[prefix];
  }
}

// ── Environment and safety ───────────────────────────────────────────

export const parseEnvironmentFile = (filePath) => {
  const entries = {};
  const fileContent = readFileSync(filePath, 'utf8');

  for (const line of fileContent.split(/\r?\n/u)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }

  return entries;
};

export const loadEnvironmentFiles = () => {
  const externallyDefinedKeys = new Set(Object.keys(process.env));
  const loadedFiles = [];

  for (const filePath of [...ENVIRONMENT_FILE_PATHS].reverse()) {
    const absoluteFilePath = resolve(workspaceRoot, filePath);
    if (!existsSync(absoluteFilePath)) continue;
    const parsedEntries = parseEnvironmentFile(absoluteFilePath);
    for (const [key, value] of Object.entries(parsedEntries)) {
      if (externallyDefinedKeys.has(key)) continue;
      process.env[key] = value;
    }
    loadedFiles.push(filePath);
  }

  return loadedFiles;
};

export const assertDatabaseEnvironment = (options) => {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env or provide DATABASE_URL explicitly.');
  }
  if (process.env.NODE_ENV === 'production' && !options.confirmProductionRealisticData) {
    throw new Error('Refusing realistic data command in NODE_ENV=production without --confirm-production-realistic-data.');
  }
};

export const createPrismaClient = async () => {
  const { PrismaClient } = await import('@prisma/client');
  return new PrismaClient();
};

export const parseCommonArguments = (usage, extraOptions = {}) => {
  const { values } = parseArgs({
    args: forwardedArgs(),
    options: {
      'dry-run': { type: 'boolean' },
      'confirm-production-realistic-data': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      ...extraOptions,
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(usage);
    process.exit(0);
  }

  return {
    dryRun: values['dry-run'] ?? false,
    confirmProductionRealisticData: values['confirm-production-realistic-data'] ?? false,
  };
};

// ── Reset helpers ────────────────────────────────────────────────────

export const disableTriggerConstraints = async (tx) => {
  for (const table of TRIGGER_RESET_TABLES) {
    await tx.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE TRIGGER ALL`);
  }
};

export const enableTriggerConstraints = async (tx) => {
  for (const table of TRIGGER_RESET_TABLES) {
    await tx.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE TRIGGER ALL`);
  }
};

export const resetCompanyData = async (tx, companyId) => {
  await disableTriggerConstraints(tx);

  // NOTE: This Prisma schema uses camelCase column names (companyId, not company_id).
  // Delete in strict dependency order: children first, parents later.

  // Phase 1: Tables without companyId — delete through parent entity joins
  // These must be deleted BEFORE their parent tables are cleared.

  // voucher_lines: linked through voucherId -> vouchers.companyId
  await tx.$executeRawUnsafe(
    `DELETE FROM "voucher_lines" WHERE "voucherId" IN (SELECT "id" FROM "vouchers" WHERE "companyId" = '${companyId}')`
  );

  // collections: linked through bookingId -> bookings.companyId (must be before units)
  await tx.$executeRawUnsafe(
    `DELETE FROM "collections" WHERE "companyId" = '${companyId}'`
  );

  // installment_schedules: linked through saleContractId (must be before sale_contracts)
  await tx.$executeRawUnsafe(
    `DELETE FROM "installment_schedules" WHERE "companyId" = '${companyId}'`
  );

  // sale_contracts: linked through bookingId (must be before bookings)
  await tx.$executeRawUnsafe(
    `DELETE FROM "sale_contracts" WHERE "companyId" = '${companyId}'`
  );

  // bookings: linked through unitId -> units (must be before units)
  await tx.$executeRawUnsafe(
    `DELETE FROM "bookings" WHERE "companyId" = '${companyId}'`
  );

  // units: linked through projectId -> projects.companyId (after bookings)
  await tx.$executeRawUnsafe(
    `DELETE FROM "units" WHERE "projectId" IN (SELECT "id" FROM "projects" WHERE "companyId" = '${companyId}')`
  );

  // zones: linked through projectId
  await tx.$executeRawUnsafe(
    `DELETE FROM "zones" WHERE "projectId" IN (SELECT "id" FROM "projects" WHERE "companyId" = '${companyId}')`
  );

  // blocks: linked through projectId
  await tx.$executeRawUnsafe(
    `DELETE FROM "blocks" WHERE "projectId" IN (SELECT "id" FROM "projects" WHERE "companyId" = '${companyId}')`
  );

  // project_phases: linked through projectId
  await tx.$executeRawUnsafe(
    `DELETE FROM "project_phases" WHERE "projectId" IN (SELECT "id" FROM "projects" WHERE "companyId" = '${companyId}')`
  );

  // Phase 2: Tables with direct companyId column — delete with simple WHERE
  // Deletion order respects ALL foreign key dependencies (children before parents)
  const directCompanyTables = [
    'audit_events',
    'attachment_links',
    'attachments',
    'payroll_run_lines',
    'payroll_runs',
    'leads',
    'customers',
    'leave_requests',
    'leave_types',
    'attendance_logs',
    'device_users',
    'attendance_devices',
    'employees',
    'salary_structures',
    'user_roles',
    'refresh_tokens',
    'vouchers',
    'cost_centers',
    'projects',
    'particular_accounts',
    'ledger_accounts',
    'account_groups',
    'unit_types',
    'departments',
    'locations',
  ];

  for (const table of directCompanyTables) {
    await tx.$executeRawUnsafe(
      `DELETE FROM "${table}" WHERE "companyId" = '${companyId}'`
    );
  }

  await enableTriggerConstraints(tx);
};

export const deleteOrphanedUsers = async (tx, userEmails) => {
  for (const email of userEmails) {
    await tx.user.deleteMany({ where: { email } });
  }
};

// ── Contamination checker ────────────────────────────────────────────

export const CONTAMINATION_PATTERNS = [
  'demo', 'demouat', 'synth', 'synthetic', 'test', 'sample',
  'mock', 'seed', 'uat', 'placeholder', 'fake', 'example',
];

export const checkContamination = (value) => {
  if (!value) return false;
  const lower = String(value).toLowerCase().replace(/[_\-.]/g, '');
  return CONTAMINATION_PATTERNS.some((pattern) => lower.includes(pattern));
};

// ── Decimal helpers ──────────────────────────────────────────────────

export const toDecimal = (value) => parseFloat(value.toFixed(2));
