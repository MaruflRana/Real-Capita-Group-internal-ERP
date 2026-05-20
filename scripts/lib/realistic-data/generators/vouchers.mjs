// ── Vouchers generator: receipt, payment, journal, contra vouchers ────
// with cross-module linkage and balanced books

import {
  VOUCHER_TYPE_COUNTS, VOUCHER_STATUS_MIX, VOUCHER_REF_PREFIXES,
  BDT_RANGES,
} from '../config.mjs';
import { SeededRandom, Sequences, dateOnly, toDecimal } from '../shared.mjs';
import { randomBDT, randomBDTRange, pickExpenseCategory } from './bdt.mjs';
import { MonthlyActivityPlanner, assignVoucherDate } from './timeline.mjs';

export const seedVouchers = async (tx, companyId, refs, rng, seqs) => {
  const planner = new MonthlyActivityPlanner(rng);
  planner.planVoucherVolumes();

  const adminUserId = refs.get('user', 'admin@realcapita.com.bd');
  const accountantUserId = refs.get('user', 'accountant@realcapita.com.bd');

  // Account references
  const bankAccounts = [
    refs.get('particularAccount', 'AST-BANK-01'),
    refs.get('particularAccount', 'AST-BANK-02'),
    refs.get('particularAccount', 'AST-BANK-03'),
  ];
  const cashAccountId = refs.get('particularAccount', 'AST-BANK-CASH-01');

  const payablesAccounts = [
    refs.get('particularAccount', 'LIA-PAY-VEND-01'),
    refs.get('particularAccount', 'LIA-PAY-VEND-02'),
  ];

  const expenseAccounts = {
    land: refs.get('particularAccount', 'EXP-LAND-ACQ-01'),
    contractor: refs.get('particularAccount', 'EXP-CONSTR-DEV-01'),
    materials: refs.get('particularAccount', 'EXP-CONSTR-MAT-01'),
    marketing: refs.get('particularAccount', 'EXP-MKTG-CAMP-01'),
    payrollGross: refs.get('particularAccount', 'EXP-PAYROLL-GROSS-01'),
    payrollDed: refs.get('particularAccount', 'EXP-PAYROLL-DED-01'),
    office: refs.get('particularAccount', 'EXP-OFFICE-RENT-01'),
    legal: refs.get('particularAccount', 'EXP-LEGAL-REG-01'),
    maintenance: refs.get('particularAccount', 'EXP-MAINT-LOG-01'),
    consultancy: refs.get('particularAccount', 'EXP-OPEX-SURV-01'),
  };

  const revenueAccounts = [
    refs.get('particularAccount', 'REV-SALES-PL-01'),
    refs.get('particularAccount', 'REV-SALES-APT-01'),
    refs.get('particularAccount', 'REV-BOOKING-FEE-01'),
  ];

  const assetAccounts = [
    refs.get('particularAccount', 'AST-PROP-WIP-01'),
    refs.get('particularAccount', 'AST-PROP-WIP-02'),
  ];

  // ── Pay payment vouchers (1,200) ────────────────────────────────────
  let paySeq = {};
  for (let y = 2022; y <= 2026; y += 1) paySeq[y] = 0;

  const totalPayment = VOUCHER_TYPE_COUNTS.PAYMENT;

  for (let i = 0; i < totalPayment; i += 1) {
    const year = assignVoucherYear(rng, planner);
    const month = rng.nextInt(1, year === 2026 ? 4 : 12);
    const voucherDate = assignVoucherDate(rng, year, month);
    const isDraft = rng.chance(VOUCHER_STATUS_MIX.DRAFT);

    paySeq[year] += 1;
    const reference = `${VOUCHER_REF_PREFIXES.PAYMENT}-${year}-${String(paySeq[year]).padStart(4, '0')}`;

    // Pick expense category
    const category = pickExpenseCategory(rng);
    const amount = randomBDTRange(rng, category.rangeKey);

    // Determine accounts
    let debitAccountId, creditAccountId, description;

    if (category.name === 'Land acquisition payment') {
      debitAccountId = expenseAccounts.land;
      creditAccountId = rng.pick(bankAccounts);
      description = `Land acquisition payment — ${rng.pick(['Maya Kanon area', 'Rivery Village area', 'South Valley area', 'Munshiganj'])}`;
    } else if (category.name.includes('Contractor')) {
      debitAccountId = expenseAccounts.contractor;
      creditAccountId = rng.pick(bankAccounts);
      description = `Contractor payment — ${category.name}`;
    } else if (category.name.includes('material') || category.name.includes('Material')) {
      debitAccountId = expenseAccounts.materials;
      creditAccountId = rng.pick(bankAccounts);
      description = category.name;
    } else if (category.name.includes('Marketing')) {
      debitAccountId = expenseAccounts.marketing;
      creditAccountId = rng.pick(bankAccounts);
      description = category.name;
    } else if (category.name.includes('Office')) {
      debitAccountId = expenseAccounts.office;
      creditAccountId = rng.pick(bankAccounts);
      description = category.name;
    } else if (category.name.includes('Registration') || category.name.includes('Legal')) {
      debitAccountId = expenseAccounts.legal;
      creditAccountId = rng.pick(bankAccounts);
      description = category.name;
    } else if (category.name.includes('Maintenance')) {
      debitAccountId = expenseAccounts.maintenance;
      creditAccountId = rng.pick(bankAccounts);
      description = category.name;
    } else {
      debitAccountId = expenseAccounts.consultancy;
      creditAccountId = rng.pick(bankAccounts);
      description = category.name;
    }

    const createdById = rng.chance(0.5) ? adminUserId : accountantUserId;

    await tx.voucher.create({
      data: {
        companyId,
        createdById,
        voucherType: 'PAYMENT',
        status: isDraft ? 'DRAFT' : 'POSTED',
        voucherDate,
        description,
        reference,
        postedAt: isDraft ? null : voucherDate,
        createdAt: voucherDate,
        voucherLines: {
          create: [
            { lineNumber: 1, particularAccountId: debitAccountId, debitAmount: amount, creditAmount: 0 },
            { lineNumber: 2, particularAccountId: creditAccountId, debitAmount: 0, creditAmount: amount },
          ],
        },
      },
    });
  }

  // ── Journal vouchers (600) ──────────────────────────────────────────
  let jrnSeq = {};
  for (let y = 2022; y <= 2026; y += 1) jrnSeq[y] = 0;

  for (let i = 0; i < VOUCHER_TYPE_COUNTS.JOURNAL; i += 1) {
    const year = assignVoucherYear(rng, planner);
    const month = rng.nextInt(1, year === 2026 ? 4 : 12);
    const voucherDate = assignVoucherDate(rng, year, month);
    const isDraft = rng.chance(VOUCHER_STATUS_MIX.DRAFT);

    jrnSeq[year] += 1;
    const reference = `${VOUCHER_REF_PREFIXES.JOURNAL}-${year}-${String(jrnSeq[year]).padStart(4, '0')}`;

    const journalType = rng.nextInt(0, 3);
    let lines, description;

    if (journalType === 0) {
      // Revenue recognition: debit receivables, credit sales revenue
      const amount = randomBDT(rng, 500000, 5000000);
      description = `Revenue recognition adjustment — period ${year}-${String(month).padStart(2, '0')}`;
      lines = [
        { lineNumber: 1, particularAccountId: refs.get('particularAccount', 'AST-CUR-REC-01'), debitAmount: amount, creditAmount: 0 },
        { lineNumber: 2, particularAccountId: rng.pick(revenueAccounts), debitAmount: 0, creditAmount: amount },
      ];
    } else if (journalType === 1) {
      // Expense accrual: debit expense, credit accrued expenses
      const amount = randomBDT(rng, 100000, 2000000);
      description = `Expense accrual — period ${year}-${String(month).padStart(2, '0')}`;
      lines = [
        { lineNumber: 1, particularAccountId: rng.pick([expenseAccounts.office, expenseAccounts.consultancy, expenseAccounts.maintenance]), debitAmount: amount, creditAmount: 0 },
        { lineNumber: 2, particularAccountId: refs.get('particularAccount', 'LIA-CUR-ACC-01'), debitAmount: 0, creditAmount: amount },
      ];
    } else if (journalType === 2) {
      // Property WIP transfer: debit property, credit bank
      const amount = randomBDT(rng, 200000, 3000000);
      description = `Property development cost allocation`;
      lines = [
        { lineNumber: 1, particularAccountId: rng.pick(assetAccounts), debitAmount: amount, creditAmount: 0 },
        { lineNumber: 2, particularAccountId: rng.pick(bankAccounts), debitAmount: 0, creditAmount: amount },
      ];
    } else {
      // Adjustment entry
      const amount = randomBDT(rng, 50000, 500000);
      description = `General adjustment entry`;
      lines = [
        { lineNumber: 1, particularAccountId: rng.pick([refs.get('particularAccount', 'LIA-CUR-TAX-01'), refs.get('particularAccount', 'EXP-OPEX-GEN-01')]), debitAmount: amount, creditAmount: 0 },
        { lineNumber: 2, particularAccountId: rng.pick([refs.get('particularAccount', 'AST-BANK-01'), refs.get('particularAccount', 'LIA-CUR-ACC-02')]), debitAmount: 0, creditAmount: amount },
      ];
    }

    await tx.voucher.create({
      data: {
        companyId,
        createdById: accountantUserId,
        voucherType: 'JOURNAL',
        status: isDraft ? 'DRAFT' : 'POSTED',
        voucherDate,
        description,
        reference,
        postedAt: isDraft ? null : voucherDate,
        createdAt: voucherDate,
        voucherLines: { create: lines },
      },
    });
  }

  // ── Contra vouchers (200) ───────────────────────────────────────────
  let ctrSeq = {};
  for (let y = 2022; y <= 2026; y += 1) ctrSeq[y] = 0;

  for (let i = 0; i < VOUCHER_TYPE_COUNTS.CONTRA; i += 1) {
    const year = assignVoucherYear(rng, planner);
    const month = rng.nextInt(1, year === 2026 ? 4 : 12);
    const voucherDate = assignVoucherDate(rng, year, month);
    const isDraft = rng.chance(VOUCHER_STATUS_MIX.DRAFT);

    ctrSeq[year] += 1;
    const reference = `${VOUCHER_REF_PREFIXES.CONTRA}-${year}-${String(ctrSeq[year]).padStart(4, '0')}`;
    const amount = randomBDT(rng, 50000, 500000);

    // Bank-to-cash or inter-account transfer
    const debitAccountId = rng.pick(bankAccounts);
    const creditAccountId = rng.chance(0.5) ? cashAccountId : rng.pick(bankAccounts.filter(a => a !== debitAccountId));

    await tx.voucher.create({
      data: {
        companyId,
        createdById: accountantUserId,
        voucherType: 'CONTRA',
        status: isDraft ? 'DRAFT' : 'POSTED',
        voucherDate,
        description: rng.chance(0.5) ? 'Bank to cash transfer' : 'Inter-account adjustment',
        reference,
        postedAt: isDraft ? null : voucherDate,
        createdAt: voucherDate,
        voucherLines: {
          create: [
            { lineNumber: 1, particularAccountId: debitAccountId, debitAmount: amount, creditAmount: 0 },
            { lineNumber: 2, particularAccountId: creditAccountId, debitAmount: 0, creditAmount: amount },
          ],
        },
      },
    });
  }

  // ── Opening balance voucher (single) ────────────────────────────────
  // Creates initial bank balance of ৳100M (10 crore)
  const openingAmount = BDT_RANGES.openingBankBalance;
  const openingDate = dateOnly(2022, 1, 1);

  await tx.voucher.create({
    data: {
      companyId,
      createdById: adminUserId,
      voucherType: 'JOURNAL',
      status: 'POSTED',
      voucherDate: openingDate,
      description: 'Opening balance entry — initial capital and bank position',
      reference: 'JRN-2022-OPENING',
      postedAt: openingDate,
      createdAt: openingDate,
      voucherLines: {
        create: [
          { lineNumber: 1, particularAccountId: refs.get('particularAccount', 'AST-BANK-01'), debitAmount: openingAmount, creditAmount: 0 },
          { lineNumber: 2, particularAccountId: refs.get('particularAccount', 'EQTY-CAP-01'), debitAmount: 0, creditAmount: openingAmount },
        ],
      },
    },
  });
};

function assignVoucherYear(rng, planner) {
  // Distribute across years proportional to planned volumes
  const yearVolumes = {};
  let total = 0;
  for (const { year, month } of planner.plan ? Object.keys(planner.plan).map(k => {
    const [y, m] = k.split('-').map(Number);
    return { year: y, month: m };
  }) : []) {
    yearVolumes[year] = (yearVolumes[year] || 0) + planner.getMonthlyVolume(year, month);
    total += planner.getMonthlyVolume(year, month);
  }

  // Fallback if planner is empty
  if (total === 0) {
    const r = rng.next();
    if (r < 0.15) return 2022;
    if (r < 0.35) return 2023;
    if (r < 0.55) return 2024;
    if (r < 0.80) return 2025;
    return 2026;
  }

  const r = rng.next() * total;
  let cumulative = 0;
  for (const [year, volume] of Object.entries(yearVolumes)) {
    cumulative += volume;
    if (r <= cumulative) return parseInt(year, 10);
  }
  return 2025;
}
