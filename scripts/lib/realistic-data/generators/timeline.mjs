// ── Timeline and temporal distribution helpers ────────────────────────
// Provides monthly activity planning, date generators, and year-aware
// temporal distribution for realistic multi-year data spread.

import { SeededRandom, dateOnly, addMonths, MONTHS, PAYROLL_MONTHS } from '../shared.mjs';
import { MONTHLY_VOUCHER_TARGETS, CUSTOMER_YEAR_DISTRIBUTION } from '../config.mjs';

// ── Year-month activity planner ───────────────────────────────────────

export class MonthlyActivityPlanner {
  constructor(rng) {
    this.rng = rng;
    this.plan = {};
  }

  planVoucherVolumes() {
    for (const { year, month } of MONTHS) {
      const target = MONTHLY_VOUCHER_TARGETS[year];
      if (!target) continue;

      const base = target.avg;
      const variation = this.rng.nextInt(-target.range / 2, target.range / 2);
      const volume = Math.max(5, Math.round(base + variation));

      // Seasonal dips
      let adjusted = volume;
      if (month === 4 && year === 2023) adjusted = Math.round(volume * 0.85); // Ramadan
      if (month === 7 && year === 2024) adjusted = Math.round(volume * 0.90); // Seasonal slowdown
      if (month === 8 && year === 2024) adjusted = Math.round(volume * 0.88);
      if (month === 12 && year === 2025) adjusted = Math.round(volume * 1.15); // Year-end push
      if (month === 1 && year === 2026) adjusted = Math.round(volume * 0.92); // Recovery dip

      const key = `${year}-${String(month).padStart(2, '0')}`;
      this.plan[key] = Math.max(5, adjusted);
    }

    return this.plan;
  }

  getMonthlyVolume(year, month) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    return this.plan[key] || 0;
  }

  getTotalVolume() {
    return Object.values(this.plan).reduce((s, v) => s + v, 0);
  }
}

// ── Date generation for specific year/month ───────────────────────────

export const randomDateInMonth = (rng, year, month) => {
  const maxDay = new Date(year, month, 0).getDate();
  const day = rng.nextInt(1, maxDay);
  return dateOnly(year, month, day);
};

export const randomWorkingDate = (rng, year, month) => {
  let day = rng.nextInt(1, 28);
  const d = new Date(year, month - 1, day);
  // Skip weekends (0=Sun, 6=Sat)
  if (d.getDay() === 0) day += 1;
  if (d.getDay() === 6) day += 2;
  if (day > 28) day = 28;
  return dateOnly(year, month, day);
};

export const randomTimeInRange = (rng, startHour, startMin, endHour, endMin) => {
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const minutes = rng.nextInt(startMinutes, endMinutes);
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

// ── Customer temporal distribution ────────────────────────────────────

export const assignYearToCustomer = (rng) => {
  const r = rng.next();
  let cumulative = 0;
  for (const [year, fraction] of Object.entries(CUSTOMER_YEAR_DISTRIBUTION)) {
    cumulative += fraction;
    if (r <= cumulative) return parseInt(year, 10);
  }
  return 2025;
};

export const assignMonthInYear = (rng, year) => {
  const maxMonth = year === 2026 ? 4 : 12;
  return rng.nextInt(1, maxMonth);
};

// ── Payroll month coverage ────────────────────────────────────────────

export const getAllPayrollMonths = () => PAYROLL_MONTHS;

export const payrollMonthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

// ── Voucher date assignment ───────────────────────────────────────────

export const assignVoucherDate = (rng, year, month) => {
  return randomWorkingDate(rng, year, month);
};

// ── Booking/contract lag ──────────────────────────────────────────────

export const contractLagFromBooking = (rng) => {
  // ~30% within 1 month, ~50% within 3 months, ~20% after 3+ months
  const r = rng.next();
  if (r < 0.30) return rng.nextInt(14, 30);
  if (r < 0.80) return rng.nextInt(30, 90);
  return rng.nextInt(90, 180);
};

// ── Collection temporal assignment ────────────────────────────────────

export const assignCollectionMonth = (rng, installmentDueDate) => {
  // Collections typically happen around due date, sometimes early, sometimes late
  const lag = rng.nextInt(-15, 30); // days around due date
  const collectionDate = addMonths(installmentDueDate, 0);
  collectionDate.setUTCDate(collectionDate.getUTCDate() + lag);
  return collectionDate;
};
