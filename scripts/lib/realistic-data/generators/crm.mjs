// ── CRM generator: customers, leads, bookings, sale contracts, ──────────
// installment schedules, collections

import {
  VOLUME_TARGETS, LEAD_SOURCE_DISTRIBUTION, LEAD_STATUS_DISTRIBUTION,
  BOOKING_STATUS_DISTRIBUTION,
  VOUCHER_REF_PREFIXES, COLLECTION_REF_PREFIX,
  BDT_RANGES, VOUCHER_TYPE_COUNTS,
} from '../config.mjs';
import { getUnitPrice, getBookingDeposit, splitIntoInstallments, randomBDT } from './bdt.mjs';
import {
  SeededRandom, RefMap, Sequences, dateOnly, addMonths, toDecimal,
} from '../shared.mjs';
import {
  generatePersonName, generateBusinessName, generateAddress,
  generateCustomerEmail, UniquePhonePool,
} from '../names.mjs';
import { assignYearToCustomer, assignMonthInYear, contractLagFromBooking } from './timeline.mjs';

export const seedCRM = async (tx, companyId, refs, rng, seqs) => {
  const phonePool = new UniquePhonePool(rng, VOLUME_TARGETS.customers + VOLUME_TARGETS.employees + 50);
  const usedEmails = new Set();

  // ── Customers ──────────────────────────────────────────────────────
  const customers = [];
  const customerFullChainCandidates = [];
  const customer360Candidates = [];

  for (let i = 0; i < VOLUME_TARGETS.customers; i += 1) {
    const isBusiness = rng.chance(0.10);
    const isMale = rng.chance(0.65);

    let fullName, firstName, lastName;
    if (isBusiness) {
      fullName = generateBusinessName(rng);
      firstName = fullName.split(' ')[0];
      lastName = fullName.split(' ').slice(1).join(' ');
    } else {
      const nameResult = generatePersonName(rng, isMale ? 'male' : 'female');
      fullName = nameResult.fullName;
      firstName = nameResult.first;
      lastName = nameResult.last;
    }

    // Generate unique email or null (30% null)
    let email = null;
    if (!rng.chance(0.30)) {
      const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '').replace(/^md$/i, 'md');
      const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
      const domainPool = ['gmail.com', 'yahoo.com', 'hotmail.com', 'mailbox.com.bd'];
      const domainWeights = [0.40, 0.15, 0.10, 0.05];
      const domainIdx = weightedPick(rng, domainWeights);
      const domain = domainPool[domainIdx];
      let baseEmail = `${cleanFirst}.${cleanLast}@${domain}`;
      let suffix = 1;
      while (usedEmails.has(baseEmail)) {
        baseEmail = `${cleanFirst}.${cleanLast}${suffix}@${domain}`;
        suffix += 1;
      }
      usedEmails.add(baseEmail);
      email = baseEmail;
    }

    const phone = phonePool.next();
    const address = generateAddress(rng, isBusiness ? 'commercial' : 'residential');
    const year = assignYearToCustomer(rng);
    const month = assignMonthInYear(rng, year);
    const day = rng.nextInt(1, 28);
    const isActive = rng.chance(0.85);

    const customer = await tx.customer.create({
      data: {
        companyId,
        fullName,
        email,
        phone,
        address,
        notes: null,
        isActive,
        createdAt: dateOnly(year, month, day),
      },
    });

    customers.push(customer);
    refs.set('customer', customer.id, customer.id);

    // Track special candidates
    if (i < 10) customerFullChainCandidates.push(customer);
    if (i >= 10 && i < 35) customer360Candidates.push(customer);
  }

  // ── Leads ──────────────────────────────────────────────────────────
  const projectCodes = refs.keys('project');

  for (let i = 0; i < VOLUME_TARGETS.leads; i += 1) {
    const isMale = rng.chance(0.65);
    const nameResult = generatePersonName(rng, isMale ? 'male' : 'female');

    // Source distribution
    const sources = Object.keys(LEAD_SOURCE_DISTRIBUTION);
    const sourceWeights = Object.values(LEAD_SOURCE_DISTRIBUTION);
    const sourceIndex = weightedPick(rng, sourceWeights);
    const source = sources[sourceIndex];

    // Status distribution
    const statuses = Object.keys(LEAD_STATUS_DISTRIBUTION);
    const statusWeights = Object.values(LEAD_STATUS_DISTRIBUTION);
    const statusIndex = weightedPick(rng, statusWeights);
    const status = statuses[statusIndex];

    const projectCode = rng.chance(0.70) ? rng.pick(projectCodes) : null;
    const projectId = projectCode ? refs.get('project', projectCode) : null;

    const year = assignYearToCustomer(rng);
    const month = assignMonthInYear(rng, year);

    await tx.lead.create({
      data: {
        companyId,
        projectId,
        fullName: nameResult.fullName,
        email: rng.chance(0.60) ? generateCustomerEmail(rng, nameResult.first, nameResult.last, i) : null,
        phone: rng.chance(0.70) ? phonePool.next() : null,
        source,
        status,
        notes: null,
        isActive: true,
        createdAt: dateOnly(year, month, rng.nextInt(1, 28)),
      },
    });
  }

  // ── Bookings ──────────────────────────────────────────────────────
  const availableUnits = refs.get('unitPool', 'available') || [];
  // Only active customers can have bookings (database trigger enforces this)
  const activeCustomers = customers.filter(c => c.isActive);
  const shuffledCustomers = rng.shuffle([...activeCustomers]);
  const bookings = [];
  const usedUnitIds = new Set();

  // Pick units sequentially from the available pool for determinism
  let unitIndex = 0;

  for (let i = 0; i < VOLUME_TARGETS.bookings; i += 1) {
    if (unitIndex >= availableUnits.length) break; // All units used up

    const customer = shuffledCustomers[i % shuffledCustomers.length];
    const unit = availableUnits[unitIndex];
    unitIndex += 1;
    usedUnitIds.add(unit.id);

    // First saleContracts bookings become CONTRACTED; rest ACTIVE
    const statusCode = i < VOLUME_TARGETS.saleContracts ? 'CONTRACTED' : 'ACTIVE';

    // Get unit type for pricing
    const unitRef = refs.get('unit', unit.code);
    const unitTypeCode = unitRef?.unitTypeCode || 'PLOT';

    const bookingAmount = getBookingDeposit(rng, unitTypeCode);
    const year = assignYearToCustomer(rng);
    const month = assignMonthInYear(rng, year);

    const booking = await tx.booking.create({
      data: {
        companyId,
        projectId: unit.projectId,
        customerId: customer.id,
        unitId: unit.id,
        bookingDate: dateOnly(year, month, rng.nextInt(1, 28)),
        bookingAmount,
        status: statusCode,
        notes: null,
        createdAt: dateOnly(year, month, rng.nextInt(1, 28)),
      },
    });

    bookings.push({ booking, unit, customer, unitTypeCode });
    refs.set('booking', booking.id, booking.id);
  }

  // ── Sale Contracts + Installment Schedules ─────────────────────────
  const saleContracts = [];
  const installmentSchedules = [];
  const contractedBookings = bookings.filter(b => b.booking.status === 'CONTRACTED');
  const contractCount = Math.min(VOLUME_TARGETS.saleContracts, contractedBookings.length);

  for (let i = 0; i < contractCount; i += 1) {
    const { booking, unit, customer, unitTypeCode } = contractedBookings[i];
    const unitRef = refs.get('unit', unit.code);
    const contractAmount = getUnitPrice(rng, unitTypeCode || 'PLOT');

    const lagDays = contractLagFromBooking(rng);
    const contractDate = addMonths(booking.bookingDate, 0);
    contractDate.setUTCDate(contractDate.getUTCDate() + lagDays);

    const numInstallments = rng.nextInt(9, 12);
    const reference = seqs.nextYearSeq('SC', contractDate.getUTCFullYear());

    const contract = await tx.saleContract.create({
      data: {
        companyId,
        bookingId: booking.id,
        contractDate,
        contractAmount,
        reference,
        notes: null,
        createdAt: contractDate,
      },
    });

    saleContracts.push(contract);
    refs.set('saleContract', contract.id, contract.id);

    // ── Installment schedule ──────────────────────────────────────────
    const amounts = splitIntoInstallments(contractAmount, numInstallments);

    for (let si = 0; si < numInstallments; si += 1) {
      const dueDate = addMonths(contractDate, si + 1);
      const schedule = await tx.installmentSchedule.create({
        data: {
          companyId,
          saleContractId: contract.id,
          sequenceNumber: si + 1,
          dueDate,
          amount: amounts[si],
          description: si === 0 ? 'Down payment' : `Installment ${si + 1}`,
          createdAt: contractDate,
        },
      });

      installmentSchedules.push(schedule);
      refs.set('installmentSchedule', schedule.id, schedule.id);
    }
  }

  // ── Collections + Receipt Vouchers ─────────────────────────────────
  // Each collection creates a paired receipt voucher
  const collections = [];
  let receiptSeq = {};
  let bookingRevJrnSeq = {};

  for (let year = 2022; year <= 2026; year += 1) {
    receiptSeq[year] = 0;
    bookingRevJrnSeq[year] = 0;
  }

  // Build lookup maps for fast cross-reference
  const contractMap = new Map(saleContracts.map(sc => [sc.id, sc]));
  const bookingMap = new Map(contractedBookings.map(b => [b.booking.id, b]));

  // ── Revenue recognition journals for contracted bookings ────────────────
  // When a booking becomes CONTRACTED (sale contract signed), convert the
  // booking deposit advance into earned booking fee revenue.
  const accountantUserId = refs.get('user', 'accountant@realcapita.com.bd');

  for (let i = 0; i < contractCount; i += 1) {
    const { booking, unit, customer, unitTypeCode } = contractedBookings[i];
    const year = booking.bookingDate.getUTCFullYear();
    bookingRevJrnSeq[year] += 1;
    const bookingRevRef = `JRN-REV-${year}-${String(bookingRevJrnSeq[year]).padStart(4, '0')}`;

    await tx.voucher.create({
      data: {
        companyId,
        createdById: accountantUserId,
        voucherType: 'JOURNAL',
        status: 'POSTED',
        voucherDate: booking.bookingDate,
        description: `Booking fee revenue recognition — ${customer.fullName} booking for ${unit.code}`,
        reference: bookingRevRef,
        postedAt: booking.bookingDate,
        createdAt: booking.bookingDate,
        voucherLines: {
          create: [
            { lineNumber: 1, particularAccountId: refs.get('particularAccount', 'LIA-ADV-CUST-01'), debitAmount: booking.bookingAmount, creditAmount: 0 },
            { lineNumber: 2, particularAccountId: refs.get('particularAccount', 'REV-BOOKING-FEE-01'), debitAmount: 0, creditAmount: booking.bookingAmount },
          ],
        },
      },
    });
  }

  // Collections against installment schedules (iterate all, ~85% probability)
  for (let i = 0; i < installmentSchedules.length; i += 1) {
    const schedule = installmentSchedules[i];
    const contract = contractMap.get(schedule.saleContractId);
    if (!contract) continue;

    const bookingEntry = bookingMap.get(contract.bookingId);
    if (!bookingEntry) continue;

    const year = schedule.dueDate.getUTCFullYear();
    const month = schedule.dueDate.getUTCMonth() + 1;

    // ~85% of installments have at least partial collection
    if (!rng.chance(0.85)) continue;

    // Skip collections for installment schedules due after the current operating period (Apr 2026).
    const dueDateYear = schedule.dueDate.getUTCFullYear();
    const dueDateMonth = schedule.dueDate.getUTCMonth() + 1;
    if (dueDateYear > 2026 || (dueDateYear === 2026 && dueDateMonth > 4)) continue;

    const collectionAmount = rng.chance(0.80) ? schedule.amount : toDecimal(schedule.amount * rng.nextDecimal(0.3, 0.9));

    // Create receipt voucher first
    receiptSeq[year] += 1;
    const voucherRef = `${VOUCHER_REF_PREFIXES.RECEIPT}-${year}-${String(receiptSeq[year]).padStart(4, '0')}`;
    const adminUserId = refs.get('user', 'admin@realcapita.com.bd');

    // 80% of installment receipts credit revenue accounts directly;
    // 20% credit customer advances (deferred until further recognition).
    const bankAccountId = rng.chance(0.70) ?
      refs.get('particularAccount', 'AST-BANK-01') :
      refs.get('particularAccount', 'AST-BANK-CASH-01');
    const creditAccountId = rng.chance(0.80) ?
      refs.get('particularAccount', 'REV-SALES-PL-01') :
      refs.get('particularAccount', 'LIA-ADV-CUST-01');

    const voucherDate = new Date(schedule.dueDate);
    voucherDate.setUTCDate(voucherDate.getUTCDate() + rng.nextInt(-5, 15));

    // Constrain voucher date to not exceed current operating period (2026-04-30)
    const maxVoucherDate = dateOnly(2026, 4, 30);
    if (voucherDate > maxVoucherDate) voucherDate.setTime(maxVoucherDate.getTime());

    const voucher = await tx.voucher.create({
      data: {
        companyId,
        createdById: adminUserId,
        voucherType: 'RECEIPT',
        status: 'POSTED',
        voucherDate,
        description: `Receipt for installment ${schedule.sequenceNumber} — ${contract.reference || 'contract'}`,
        reference: voucherRef,
        postedAt: voucherDate,
        createdAt: voucherDate,
        voucherLines: {
          create: [
            { lineNumber: 1, particularAccountId: bankAccountId, debitAmount: collectionAmount, creditAmount: 0 },
            { lineNumber: 2, particularAccountId: creditAccountId, debitAmount: 0, creditAmount: collectionAmount },
          ],
        },
      },
    });

    const collectionRef = `${COLLECTION_REF_PREFIX}-${year}-${String(i + 1).padStart(4, '0')}`;
    const collection = await tx.collection.create({
      data: {
        companyId,
        customerId: bookingEntry.customer.id,
        voucherId: voucher.id,
        bookingId: bookingEntry.booking.id,
        saleContractId: contract.id,
        installmentScheduleId: schedule.id,
        collectionDate: voucherDate,
        amount: collectionAmount,
        reference: collectionRef,
        notes: null,
        createdAt: voucherDate,
      },
    });

    collections.push(collection);
    refs.set('collection', collection.id, collection.id);
  }

  // Advance/booking deposit collections (all active bookings)
  const activeBookings = bookings.filter(b => b.booking.status === 'ACTIVE');
  for (let i = 0; i < Math.min(500, activeBookings.length); i += 1) {
    const { booking, customer } = activeBookings[i];
    const year = booking.bookingDate.getUTCFullYear();
    receiptSeq[year] += 1;

    const collectionAmount = randomBDT(rng, BDT_RANGES.collectionAmount.min, Math.min(BDT_RANGES.collectionAmount.max, booking.bookingAmount * 2));
    const voucherRef = `${VOUCHER_REF_PREFIXES.RECEIPT}-${year}-${String(receiptSeq[year]).padStart(4, '0')}`;
    const adminUserId = refs.get('user', 'admin@realcapita.com.bd');
    const bankAccountId = refs.get('particularAccount', 'AST-BANK-01');
    const creditAccountId = refs.get('particularAccount', 'LIA-ADV-CUST-01');

    const voucherDate = new Date(booking.bookingDate);
    voucherDate.setUTCDate(voucherDate.getUTCDate() + rng.nextInt(0, 7));

    const voucher = await tx.voucher.create({
      data: {
        companyId,
        createdById: adminUserId,
        voucherType: 'RECEIPT',
        status: 'POSTED',
        voucherDate,
        description: `Booking deposit receipt for ${customer.fullName}`,
        reference: voucherRef,
        postedAt: voucherDate,
        createdAt: voucherDate,
        voucherLines: {
          create: [
            { lineNumber: 1, particularAccountId: bankAccountId, debitAmount: collectionAmount, creditAmount: 0 },
            { lineNumber: 2, particularAccountId: creditAccountId, debitAmount: 0, creditAmount: collectionAmount },
          ],
        },
      },
    });

    const collectionRef = `${COLLECTION_REF_PREFIX}-${year}-${String(collections.length + 1).padStart(4, '0')}`;
    const collection = await tx.collection.create({
      data: {
        companyId,
        customerId: customer.id,
        voucherId: voucher.id,
        bookingId: booking.id,
        collectionDate: voucherDate,
        amount: collectionAmount,
        reference: collectionRef,
        notes: null,
        createdAt: voucherDate,
      },
    });

    collections.push(collection);
  }

  // Ad-hoc/other payment collections (250)
  const allCustomers = customers.filter(c => c.isActive);
  for (let i = 0; i < 250; i += 1) {
    const customer = rng.pick(allCustomers);
    const year = assignYearToCustomer(rng);
    receiptSeq[year] += 1;

    const collectionAmount = randomBDT(rng, 20000, 500000);
    const voucherRef = `${VOUCHER_REF_PREFIXES.RECEIPT}-${year}-${String(receiptSeq[year]).padStart(4, '0')}`;
    const adminUserId = refs.get('user', 'admin@realcapita.com.bd');
    const bankAccountId = refs.get('particularAccount', 'AST-BANK-01');
    const creditAccountId = refs.get('particularAccount', 'REV-OTHER-MISC-01');

    const voucherDate = dateOnly(year, assignMonthInYear(rng, year), rng.nextInt(1, 28));

    const voucher = await tx.voucher.create({
      data: {
        companyId,
        createdById: adminUserId,
        voucherType: 'RECEIPT',
        status: 'POSTED',
        voucherDate,
        description: `Miscellaneous payment received from ${customer.fullName}`,
        reference: voucherRef,
        postedAt: voucherDate,
        createdAt: voucherDate,
        voucherLines: {
          create: [
            { lineNumber: 1, particularAccountId: bankAccountId, debitAmount: collectionAmount, creditAmount: 0 },
            { lineNumber: 2, particularAccountId: creditAccountId, debitAmount: 0, creditAmount: collectionAmount },
          ],
        },
      },
    });

    const collectionRef = `${COLLECTION_REF_PREFIX}-${year}-${String(collections.length + 1).padStart(4, '0')}`;
    const collection = await tx.collection.create({
      data: {
        companyId,
        customerId: customer.id,
        voucherId: voucher.id,
        collectionDate: voucherDate,
        amount: collectionAmount,
        reference: collectionRef,
        notes: null,
        createdAt: voucherDate,
      },
    });

    collections.push(collection);
  }

  // ── Overdue receivable customers (5 customers) ─────────────────────
  for (let i = 0; i < 5; i += 1) {
    const customer = customer360Candidates[i];
    if (!customer) continue;
    // Ensure customer has installment schedules with unpaid amounts
    // (handled naturally by 70% collection probability — some will have gaps)
  }

  return { customers, bookings, saleContracts, installmentSchedules, collections };
};

function weightedPick(rng, weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = rng.next() * total;
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
