// ── BDT amount generators and realistic financial range helpers ────────
// All monetary values are in Bangladesh Taka (BDT / ৳)

import { BDT_RANGES } from '../config.mjs';
import { SeededRandom, toDecimal } from '../shared.mjs';

export const randomBDT = (rng, min, max, roundTo = 2) => {
  const factor = Math.pow(10, roundTo);
  const scaledMin = Math.round(min * factor);
  const scaledMax = Math.round(max * factor);
  const value = rng.nextInt(scaledMin, scaledMax);
  return toDecimal(value / factor);
};

export const randomBDTRange = (rng, rangeKey) => {
  const range = BDT_RANGES[rangeKey];
  if (!range) throw new Error(`Unknown BDT range key: ${rangeKey}`);
  if (typeof range === 'number') return range;
  return randomBDT(rng, range.min, range.max);
};

export const bdtRound = (value) => toDecimal(value);

// ── Unit price ranges based on unit type ──────────────────────────────

export const UNIT_PRICE_BY_TYPE = {
  PLOT: { min: 1500000, max: 50000000 },
  APT: { min: 2000000, max: 20000000 },
  COMM: { min: 3000000, max: 30000000 },
  SHARE: { min: 500000, max: 5000000 },
  DUPLEX: { min: 4000000, max: 15000000 },
  TRIPLEX: { min: 6000000, max: 20000000 },
  'STD-DELUXE': { min: 3000000, max: 8000000 },
  'DELUXE-SUITE': { min: 5000000, max: 10000000 },
  'EXEC-SUITE': { min: 8000000, max: 12000000 },
  'PRES-SUITE': { min: 10000000, max: 15000000 },
};

export const BOOKING_DEPOSIT_BY_TYPE = {
  PLOT: { min: 50000, max: 500000 },
  APT: { min: 100000, max: 1000000 },
  COMM: { min: 200000, max: 1000000 },
  SHARE: { min: 30000, max: 200000 },
  DUPLEX: { min: 100000, max: 500000 },
  TRIPLEX: { min: 150000, max: 500000 },
  'STD-DELUXE': { min: 200000, max: 500000 },
  'DELUXE-SUITE': { min: 300000, max: 800000 },
  'EXEC-SUITE': { min: 500000, max: 800000 },
  'PRES-SUITE': { min: 800000, max: 1000000 },
};

export const getUnitPrice = (rng, unitTypeCode) => {
  const range = UNIT_PRICE_BY_TYPE[unitTypeCode] || { min: 500000, max: 10000000 };
  return randomBDT(rng, range.min, range.max);
};

export const getBookingDeposit = (rng, unitTypeCode) => {
  const range = BOOKING_DEPOSIT_BY_TYPE[unitTypeCode] || { min: 50000, max: 500000 };
  return randomBDT(rng, range.min, range.max);
};

// ── Installment schedule amount splitter ──────────────────────────────

export const splitIntoInstallments = (totalAmount, numInstallments) => {
  const base = toDecimal(totalAmount / numInstallments);
  const remainder = toDecimal(totalAmount - base * numInstallments);
  const schedule = [];

  for (let i = 0; i < numInstallments; i += 1) {
    schedule.push(i === 0 ? toDecimal(base + remainder) : base);
  }

  // Verify sum matches total
  const sum = schedule.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - totalAmount) > 0.01) {
    schedule[0] = toDecimal(schedule[0] + (totalAmount - sum));
  }

  return schedule;
};

// ── Voucher amount categories ────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  { name: 'Land acquisition payment', rangeKey: 'landAcquisitionPayment', frequency: 0.015 },
  { name: 'Contractor development payment', rangeKey: 'contractorPayment', frequency: 0.07 },
  { name: 'Construction material purchase', rangeKey: 'constructionMaterial', frequency: 0.05 },
  { name: 'Marketing campaign expense', rangeKey: 'marketingExpense', frequency: 0.04 },
  { name: 'Office rent and utilities', rangeKey: 'officeRentUtilities', frequency: 0.04 },
  { name: 'Registration and legal fees', rangeKey: 'registrationLegal', frequency: 0.02 },
  { name: 'Maintenance and logistics', rangeKey: 'maintenanceLogistics', frequency: 0.03 },
  { name: 'Survey and consultancy fees', rangeKey: 'contractorPayment', frequency: 0.02 },
];

export const pickExpenseCategory = (rng) => {
  const totalWeight = EXPENSE_CATEGORIES.reduce((s, c) => s + c.frequency, 0);
  let r = rng.next() * totalWeight;
  for (const cat of EXPENSE_CATEGORIES) {
    r -= cat.frequency;
    if (r <= 0) return cat;
  }
  return EXPENSE_CATEGORIES[0];
};

// ── Format helpers for seed ───────────────────────────────────────────

export const formatBDTSeed = (value) => `৳${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
