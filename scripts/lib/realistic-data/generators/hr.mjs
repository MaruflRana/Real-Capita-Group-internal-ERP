// ── HR generator: employees, attendance devices, device users, ──────────
// attendance logs, leave types, leave requests

import {
  VOLUME_TARGETS, DEPARTMENT_EMPLOYEE_COUNTS, DEPARTMENT_SPECS,
  LEAVE_TYPE_SPECS, LEAVE_REQUEST_STATUS_DISTRIBUTION,
  LEAVE_TYPE_USAGE_DISTRIBUTION, ATTENDANCE_DEVICE_SPECS,
  DEPARTMENT_SALARY_MAP, SALARY_STRUCTURE_SPECS,
} from '../config.mjs';
import {
  SeededRandom, RefMap, Sequences, dateOnly, toDecimal,
} from '../shared.mjs';
import {
  generatePersonName, generateEmployeeEmail,
} from '../names.mjs';
import { assignYearToCustomer, assignMonthInYear, randomWorkingDate, randomTimeInRange } from './timeline.mjs';

export const seedHR = async (tx, companyId, refs, rng, seqs) => {
  const phonePool = refs.get('phonePool', 'hr') || { usedPhones: new Set() };

  // ── Salary structures ──────────────────────────────────────────────
  for (const salSpec of SALARY_STRUCTURE_SPECS) {
    const salaryStructure = await tx.salaryStructure.create({
      data: {
        companyId,
        code: salSpec.code,
        name: salSpec.name,
        description: null,
        basicAmount: salSpec.basic,
        allowanceAmount: salSpec.allowance,
        deductionAmount: salSpec.deduction,
        netAmount: salSpec.net,
        isActive: true,
      },
    });
    refs.set('salaryStructure', salSpec.code, salaryStructure.id);
  }

  // ── Employees ──────────────────────────────────────────────────────
  const employees = [];
  let empSeq = 0;

  // Walkthrough users first
  const walkthroughMapping = [
    { email: 'admin@realcapita.com.bd', deptCode: 'MGMT', salaryCode: 'SAL-EXEC' },
    { email: 'accountant@realcapita.com.bd', deptCode: 'FIN', salaryCode: 'SAL-FIN' },
    { email: 'hr@realcapita.com.bd', deptCode: 'HR', salaryCode: 'SAL-MGMT' },
    { email: 'payroll@realcapita.com.bd', deptCode: 'PAY', salaryCode: 'SAL-FIN' },
    { email: 'sales@realcapita.com.bd', deptCode: 'SALES', salaryCode: 'SAL-SALES' },
    { email: 'member@realcapita.com.bd', deptCode: 'MGMT', salaryCode: 'SAL-SUPPORT' },
  ];

  for (const mapping of walkthroughMapping) {
    empSeq += 1;
    const userId = refs.get('user', mapping.email);
    const departmentId = refs.get('department', mapping.deptCode);
    const locationId = refs.get('location', 'RCG-CORP-DHK');

    const employee = await tx.employee.create({
      data: {
        companyId,
        departmentId,
        locationId,
        userId,
        employeeCode: `EMP-${String(empSeq).padStart(4, '0')}`,
        fullName: `${mapping.email.split('@')[0].replace('.', ' ')} Employee`,
        isActive: true,
        createdAt: dateOnly(2022, 7, rng.nextInt(1, 28)),
      },
    });

    employees.push({ employee, salaryCode: mapping.salaryCode, deptCode: mapping.deptCode });
    refs.set('employee', employee.id, employee.id);
    refs.set('employeeByCode', employee.employeeCode, employee.id);
  }

  // Remaining employees
  const deptEntries = Object.entries(DEPARTMENT_EMPLOYEE_COUNTS);
  for (const [deptCode, count] of deptEntries) {
    const departmentId = refs.get('department', deptCode);
    const salaryCode = DEPARTMENT_SALARY_MAP[deptCode];

    // Skip walkthrough users that are already counted
    const walkthroughInDept = walkthroughMapping.filter(m => m.deptCode === deptCode).length;
    const remainingCount = count - walkthroughInDept;

    for (let i = 0; i < remainingCount; i += 1) {
      empSeq += 1;
      const isMale = rng.chance(deptCode === 'OPS' || deptCode === 'ENG' ? 0.85 : 0.55);
      const gender = isMale ? 'male' : 'female';
      const nameResult = generatePersonName(rng, gender);
      const phone = generateUniquePhone(rng);
      const email = generateEmployeeEmail(nameResult.first, nameResult.last);

      const year = assignYearToCustomer(rng);
      const month = assignMonthInYear(rng, year);
      const isActive = rng.chance(0.89); // ~10% inactive

      // Assign location based on department
      let locationCode = 'RCG-CORP-DHK';
      if (['OPS', 'ENG'].includes(deptCode)) locationCode = rng.pick(['RCG-SITE-MAYA', 'RCG-SITE-RIVERY', 'RCG-SITE-VALLEY']);
      if (deptCode === 'SALES') locationCode = rng.pick(['RCG-SALES-DHK', 'RCG-CORP-DHK']);
      if (deptCode === 'MKTG') locationCode = rng.pick(['RCG-SALES-DHK', 'RCG-CORP-DHK']);

      const locationId = refs.get('location', locationCode);
      const managerEmployeeId = rng.chance(0.3) ? employees[0]?.employee?.id : null;

      const employee = await tx.employee.create({
        data: {
          companyId,
          departmentId,
          locationId,
          userId: null,
          managerEmployeeId,
          employeeCode: `EMP-${String(empSeq).padStart(4, '0')}`,
          fullName: nameResult.fullName,
          isActive,
          createdAt: dateOnly(year, month, rng.nextInt(1, 28)),
        },
      });

      employees.push({ employee, salaryCode, deptCode });
      refs.set('employee', employee.id, employee.id);
      refs.set('employeeByCode', employee.employeeCode, employee.id);
    }
  }

  // ── Leave types ────────────────────────────────────────────────────
  for (const leaveSpec of LEAVE_TYPE_SPECS) {
    const leaveType = await tx.leaveType.create({
      data: {
        companyId,
        code: leaveSpec.code,
        name: leaveSpec.name,
        description: leaveSpec.description || null,
        isActive: true,
      },
    });
    refs.set('leaveType', leaveSpec.code, leaveType.id);
  }

  // ── Leave requests (500) ──────────────────────────────────────────
  const leaveStatuses = Object.keys(LEAVE_REQUEST_STATUS_DISTRIBUTION);
  const leaveStatusWeights = Object.values(LEAVE_REQUEST_STATUS_DISTRIBUTION);
  const leaveTypeCodes = Object.keys(LEAVE_TYPE_USAGE_DISTRIBUTION);
  const leaveTypeWeights = Object.values(LEAVE_TYPE_USAGE_DISTRIBUTION);

  const activeEmployees = employees.filter(e => e.employee.isActive);

  // Track date ranges per employee to avoid overlap (exclusion constraint)
  const employeeLeaveRanges = {}; // employeeId -> array of {start, end} for active-status leaves
  const ACTIVE_LEAVE_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED'];

  const isOverlap = (empId, startDate, endDate) => {
    const ranges = employeeLeaveRanges[empId] || [];
    for (const range of ranges) {
      // Check if [startDate, endDate] overlaps with [range.start, range.end]
      if (startDate <= range.end && endDate >= range.start) {
        return true;
      }
    }
    return false;
  };

  let leavesCreated = 0;
  const maxAttempts = VOLUME_TARGETS.leaveRequests * 3;

  for (let attempt = 0; attempt < maxAttempts && leavesCreated < VOLUME_TARGETS.leaveRequests; attempt += 1) {
    const empEntry = rng.pick(activeEmployees);
    const leaveTypeIdx = weightedPick(rng, leaveTypeWeights);
    const leaveTypeCode = leaveTypeCodes[leaveTypeIdx];
    const leaveTypeId = refs.get('leaveType', leaveTypeCode);

    const statusIdx = weightedPick(rng, leaveStatusWeights);
    const status = leaveStatuses[statusIdx];

    const year = rng.nextInt(2022, 2026);
    const month = rng.nextInt(1, year === 2026 ? 4 : 12);
    const startDate = randomWorkingDate(rng, year, month);
    const duration = rng.nextInt(1, leaveTypeCode === 'MATERNITY' ? 120 : leaveTypeCode === 'ANNUAL' ? 15 : 5);
    const endDate = addDays(startDate, duration);

    // Skip if overlapping with existing active leave for this employee
    if (ACTIVE_LEAVE_STATUSES.includes(status) && isOverlap(empEntry.employee.id, startDate, endDate)) {
      continue;
    }

    const reason = getLeaveReason(leaveTypeCode, rng);

    await tx.leaveRequest.create({
      data: {
        companyId,
        employeeId: empEntry.employee.id,
        leaveTypeId,
        startDate,
        endDate,
        reason,
        decisionNote: status === 'APPROVED' ? 'Approved by HR' : status === 'REJECTED' ? 'Not eligible at this time' : null,
        status,
        createdAt: new Date(startDate.getTime() - rng.nextInt(1, 14) * 86400000),
      },
    });

    // Track active leave date ranges for this employee
    if (ACTIVE_LEAVE_STATUSES.includes(status)) {
      if (!employeeLeaveRanges[empEntry.employee.id]) {
        employeeLeaveRanges[empEntry.employee.id] = [];
      }
      employeeLeaveRanges[empEntry.employee.id].push({ start: startDate, end: endDate });
    }

    leavesCreated += 1;
  }

  // ── Attendance devices ─────────────────────────────────────────────
  for (const deviceSpec of ATTENDANCE_DEVICE_SPECS) {
    const locationId = refs.get('location', deviceSpec.locationCode);
    const device = await tx.attendanceDevice.create({
      data: {
        companyId,
        locationId,
        code: deviceSpec.code,
        name: deviceSpec.name,
        description: null,
        isActive: true,
      },
    });
    refs.set('attendanceDevice', deviceSpec.code, device.id);
  }

  // ── Device users (link employees to devices) ───────────────────────
  const deviceCodes = ATTENDANCE_DEVICE_SPECS.map(d => d.code);
  const deviceUserMap = {};

  for (const empEntry of activeEmployees) {
    // Assign employee to a device based on location
    const locationId = empEntry.employee.locationId;
    let deviceCode = 'DEV-CORP'; // Default

    // Map location to nearest device
    if (locationId === refs.get('location', 'RCG-SITE-MAYA')) deviceCode = 'DEV-MAYA';
    else if (locationId === refs.get('location', 'RCG-SITE-RIVERY')) deviceCode = 'DEV-RIVERY';
    else if (locationId === refs.get('location', 'RCG-SITE-KHULNA')) deviceCode = 'DEV-KHULNA';
    else if (locationId === refs.get('location', 'RCG-SALES-DHK')) deviceCode = 'DEV-SALES';

    const deviceId = refs.get('attendanceDevice', deviceCode);

    const deviceUser = await tx.deviceUser.create({
      data: {
        companyId,
        employeeId: empEntry.employee.id,
        attendanceDeviceId: deviceId,
        deviceEmployeeCode: empEntry.employee.employeeCode,
        isActive: true,
      },
    });

    deviceUserMap[empEntry.employee.id] = deviceUser.id;
    refs.set('deviceUser', empEntry.employee.id, deviceUser.id);
  }

  // ── Attendance logs (24,000) ───────────────────────────────────────
  // ~50 working days per year × 3+ years × ~80 employees × 2 directions
  const logTarget = VOLUME_TARGETS.attendanceLogs;
  let logsCreated = 0;
  const logDateDeviceEmployeeSet = new Set(); // uniqueness guard

  for (let year = 2022; year <= 2026; year += 1) {
    const endMonth = year === 2026 ? 4 : 12;
    const startMonth = year === 2022 ? 7 : 1;

    for (let month = startMonth; month <= endMonth; month += 1) {
      // ~22 working days per month
      for (let day = 1; day <= 28; day += 1) {
        const d = new Date(year, month - 1, day);
        if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends
        if (logsCreated >= logTarget) break;

        // Each active employee gets an IN and OUT log
        for (const empEntry of activeEmployees) {
          if (logsCreated >= logTarget) break;
          if (!empEntry.employee.isActive) continue;

          const deviceUserId = deviceUserMap[empEntry.employee.id];
          if (!deviceUserId) continue;

          const loggedAtDate = dateOnly(year, month, day);

          // IN log
          const inTime = randomTimeInRange(rng, 8, 30, 9, 30);
          const inExternalId = `ATT-${empEntry.employee.employeeCode}-${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}-IN`;
          const inKey = `${deviceUserId}|${loggedAtDate.toISOString()}|IN`;

          if (!logDateDeviceEmployeeSet.has(inKey)) {
            logDateDeviceEmployeeSet.add(inKey);

            await tx.attendanceLog.create({
              data: {
                companyId,
                deviceUserId,
                loggedAt: new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${inTime}:00.000Z`),
                direction: 'IN',
                externalLogId: inExternalId,
              },
            });
            logsCreated += 1;
          }

          if (logsCreated >= logTarget) break;

          // OUT log
          const outTime = randomTimeInRange(rng, 17, 0, 18, 30);
          const outExternalId = `ATT-${empEntry.employee.employeeCode}-${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}-OUT`;
          const outKey = `${deviceUserId}|${loggedAtDate.toISOString()}|OUT`;

          if (!logDateDeviceEmployeeSet.has(outKey)) {
            logDateDeviceEmployeeSet.add(outKey);

            await tx.attendanceLog.create({
              data: {
                companyId,
                deviceUserId,
                loggedAt: new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${outTime}:00.000Z`),
                direction: 'OUT',
                externalLogId: outExternalId,
              },
            });
            logsCreated += 1;
          }
        }
      }
    }
  }

  return { employees };
};

function generateUniquePhone(rng) {
  const prefix = rng.pick(['017', '018', '019', '016', '015']);
  const suffix = String(rng.nextInt(10000000, 99999999)).padStart(8, '0');
  return `${prefix}${suffix}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getLeaveReason(leaveTypeCode, rng) {
  const reasons = {
    ANNUAL: ['Family vacation', 'Personal travel', 'Annual rest period', 'Holiday trip'],
    SICK: ['Medical appointment', 'Illness recovery', 'Health checkup', 'Dental treatment'],
    CASUAL: ['Personal matter', 'Family event', 'Short personal absence', 'Errand'],
    UNPAID: ['Extended personal leave', 'Career development break'],
    FIELD: ['Site inspection assignment', 'Project field visit', 'Client site duty'],
    MATERNITY: ['Maternity leave as per policy'],
  };
  return rng.pick(reasons[leaveTypeCode] || ['Personal leave']);
}

function weightedPick(rng, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng.next() * total;
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
