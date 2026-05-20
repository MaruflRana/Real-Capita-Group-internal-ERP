// ── Payroll generator: payroll runs, payroll run lines, payroll posting ──

import {
  VOLUME_TARGETS, PAYROLL_RUN_SPEC, SALARY_STRUCTURE_SPECS,
  DEPARTMENT_SALARY_MAP,
} from '../config.mjs';
import {
  SeededRandom, RefMap, Sequences, dateOnly, toDecimal,
} from '../shared.mjs';
import { getAllPayrollMonths, payrollMonthKey } from './timeline.mjs';

export const seedPayroll = async (tx, companyId, refs, rng, seqs) => {
  const payrollMonths = getAllPayrollMonths();
  const adminUserId = refs.get('user', 'admin@realcapita.com.bd');
  const accountantUserId = refs.get('user', 'accountant@realcapita.com.bd');

  // Account references for payroll posting voucher
  const payrollGrossExpenseId = refs.get('particularAccount', 'EXP-PAYROLL-GROSS-01');
  const payrollDedExpenseId = refs.get('particularAccount', 'EXP-PAYROLL-DED-01');
  const salaryPayableId = refs.get('particularAccount', 'LIA-PAY-SAL-01');
  const pfDeductionPayableId = refs.get('particularAccount', 'LIA-PAY-SAL-02');
  const bankAccountId = refs.get('particularAccount', 'AST-BANK-01');

  // Cost centers for payroll run rotation
  const costCenterCodes = refs.keys('costCenter');
  const projectCodes = refs.keys('project');

  // Build project -> cost center mapping to satisfy the DB constraint
  // that cost center must belong to the selected project when both are provided
  const COST_CENTER_PROJECT_MAP = {
    'CC-CORP': null,       // Corporate has no project
    'CC-MAYA': 'RC-MAYA',
    'CC-RIVERY': 'RC-RIVERY',
    'CC-PRIYOJAN': 'RC-PRIYOJAN',
    'CC-VALLEY': 'RC-SOUTH-VALLEY',
    'CC-ECO': 'RC-MAYA-ECO',
    'CC-BONDHUJON': 'RC-BONDHUJON',
    'CC-OCEAN': 'RC-OCEAN-BLISS',
    'CC-DAIRA': 'RC-DAIRA-NOOR',
    'CC-SHANTI': 'RC-SHANTI-KUTHIR',
    'CC-DALIM': 'RC-DALIM-TOWER',
  };

  // Cost center groups: corporate (no project) and project-specific
  const corporateCostCenter = 'CC-CORP';
  const projectCostCenters = Object.entries(COST_CENTER_PROJECT_MAP)
    .filter(([cc, proj]) => proj !== null)
    .map(([cc, proj]) => ({ costCenterCode: cc, projectCode: proj }));

  // Determine run status distribution
  const totalRuns = PAYROLL_RUN_SPEC.totalRuns;
  const postedRuns = PAYROLL_RUN_SPEC.postedCount;
  const finalizedRuns = PAYROLL_RUN_SPEC.finalizedCount;
  const draftRuns = PAYROLL_RUN_SPEC.draftCount;

  // Assign statuses: first drafts, then finalized, rest posted
  const runStatuses = [];
  for (let i = 0; i < draftRuns; i += 1) runStatuses.push('DRAFT');
  for (let i = 0; i < finalizedRuns; i += 1) runStatuses.push('FINALIZED');
  for (let i = 0; i < postedRuns; i += 1) runStatuses.push('POSTED');
  // shuffle to distribute across months
  const shuffledStatuses = rng.shuffle(runStatuses);

  // Get employees for payroll lines
  const employeeIds = refs.list('employee');

  // Payroll run sequence
  let payRunSeq = 0;

  for (let ri = 0; ri < payrollMonths.length; ri += 1) {
    const { year, month } = payrollMonths[ri];
    const status = shuffledStatuses[ri] || 'POSTED';

    // Assign project/cost center rotation (matching pairs to satisfy DB constraint)
    const isCorporate = rng.chance(0.15);
    let projectId, costCenterId;

    if (isCorporate) {
      // Corporate run: no project, corporate cost center
      projectId = null;
      costCenterId = refs.get('costCenter', corporateCostCenter);
    } else {
      // Project run: cost center must belong to the selected project
      const pair = rng.pick(projectCostCenters);
      projectId = refs.get('project', pair.projectCode);
      costCenterId = refs.get('costCenter', pair.costCenterCode);
    }

    // Determine active employees for this month (earlier months have fewer)
    const monthIndex = ri;
    const activeCount = Math.min(
      employeeIds.length,
      Math.round(80 + monthIndex * 0.3), // gradual growth
    );
    const activeForMonth = rng.shuffle([...employeeIds]).slice(0, activeCount);

    const description = `Payroll for ${year}-${String(month).padStart(2, '0')}`;
    const finalizedAt = status !== 'DRAFT' ? dateOnly(year, month, 25) : null;
    const postedAt = status === 'POSTED' ? dateOnly(year, month, 28) : null;

    let postedVoucherId = null;

    // For posted runs, create the posting voucher first
    if (status === 'POSTED') {
      // Calculate monthly payroll totals
      const monthlyGross = activeForMonth.reduce((sum, empId) => {
        const salaryCode = getEmployeeSalaryCode(empId, refs);
        const salSpec = SALARY_STRUCTURE_SPECS.find(s => s.code === salaryCode) || SALARY_STRUCTURE_SPECS[5];
        return sum + salSpec.basic + salSpec.allowance;
      }, 0);
      const monthlyDeductions = activeForMonth.reduce((sum, empId) => {
        const salaryCode = getEmployeeSalaryCode(empId, refs);
        const salSpec = SALARY_STRUCTURE_SPECS.find(s => s.code === salaryCode) || SALARY_STRUCTURE_SPECS[5];
        return sum + salSpec.deduction;
      }, 0);
      const monthlyNet = monthlyGross - monthlyDeductions;

      const voucherRef = `PAY-${year}-${String(payRunSeq + 1000).padStart(4, '0')}`;

      const voucher = await tx.voucher.create({
        data: {
          companyId,
          createdById: accountantUserId,
          postedById: adminUserId,
          voucherType: 'PAYMENT',
          status: 'POSTED',
          voucherDate: postedAt,
          description: `Payroll posting — ${year}-${String(month).padStart(2, '0')}`,
          reference: voucherRef,
          postedAt: postedAt,
          createdAt: postedAt,
          voucherLines: {
            create: [
              { lineNumber: 1, particularAccountId: payrollGrossExpenseId, debitAmount: toDecimal(monthlyGross), creditAmount: 0 },
              { lineNumber: 2, particularAccountId: salaryPayableId, debitAmount: 0, creditAmount: toDecimal(monthlyNet) },
              { lineNumber: 3, particularAccountId: pfDeductionPayableId, debitAmount: 0, creditAmount: toDecimal(monthlyDeductions) },
            ],
          },
        },
      });

      postedVoucherId = voucher.id;
    }

    payRunSeq += 1;
    const payrollRun = await tx.payrollRun.create({
      data: {
        companyId,
        projectId,
        costCenterId,
        postedVoucherId,
        payrollYear: year,
        payrollMonth: month,
        description,
        status,
        finalizedAt,
        postedAt,
        createdAt: dateOnly(year, month, 1),
      },
    });

    refs.set('payrollRun', payrollMonthKey(year, month), payrollRun.id);

    // ── Payroll run lines ──────────────────────────────────────────────
    for (const empId of activeForMonth) {
      const salaryCode = getEmployeeSalaryCode(empId, refs);
      const salSpec = SALARY_STRUCTURE_SPECS.find(s => s.code === salaryCode) || SALARY_STRUCTURE_SPECS[5];

      await tx.payrollRunLine.create({
        data: {
          companyId,
          payrollRunId: payrollRun.id,
          employeeId: empId,
          basicAmount: salSpec.basic,
          allowanceAmount: salSpec.allowance,
          deductionAmount: salSpec.deduction,
          netAmount: salSpec.net,
        },
      });
    }
  }

  // ── Note: post_payroll_run database function is NOT called here ──────
  // The payroll generator already creates the posting voucher with lines
  // for each posted payroll run, so calling post_payroll_run would create
  // duplicate vouchers. The postedVoucherId is already set on each run.
};

function getEmployeeSalaryCode(empId, refs) {
  // Try to match employee to department salary structure
  // Default to site operations for unmatched
  const deptMapping = refs.get('employeeDept', empId);
  if (deptMapping) return DEPARTMENT_SALARY_MAP[deptMapping] || 'SAL-SITE';
  return 'SAL-SITE';
}
