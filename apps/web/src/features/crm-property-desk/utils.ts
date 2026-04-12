import { formatAccountingAmount, formatDate } from '../../lib/format';
import type {
  BookingRecord,
  CollectionRecord,
  CustomerRecord,
  InstallmentScheduleRecord,
  LeadRecord,
  ProjectRecord,
  SaleContractRecord,
  UnitRecord,
  VoucherRecord,
} from '../../lib/api/types';

export const PAGE_SIZE = 10;
export const OPTION_PAGE_SIZE = 100;

export const normalizeOptionalText = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

export const normalizeOptionalTextToNull = (value: string | undefined) =>
  normalizeOptionalText(value) ?? null;

export const normalizeNullableId = (value: string | undefined) => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
};

export const getStatusQueryValue = (
  value: 'all' | 'active' | 'inactive',
): boolean | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'active';
};

export const getProjectLabel = (project: Pick<ProjectRecord, 'code' | 'name'>) =>
  `${project.code} - ${project.name}`;

export const getUnitLabel = (unit: Pick<UnitRecord, 'code' | 'name'>) =>
  `${unit.code} - ${unit.name}`;

export const getCustomerLabel = (
  customer: Pick<CustomerRecord, 'fullName' | 'email' | 'phone'>,
) =>
  [
    customer.fullName,
    customer.email || customer.phone || null,
  ]
    .filter(Boolean)
    .join(' | ');

export const getLeadLabel = (lead: Pick<LeadRecord, 'fullName' | 'status'>) =>
  `${lead.fullName} | ${lead.status}`;

export const getBookingLabel = (
  booking: Pick<BookingRecord, 'unitCode' | 'customerName' | 'bookingDate'>,
) => `${booking.unitCode} | ${booking.customerName} | ${booking.bookingDate}`;

export const getSaleContractLabel = (
  saleContract: Pick<SaleContractRecord, 'unitCode' | 'customerName' | 'contractDate'>,
) =>
  `${saleContract.unitCode} | ${saleContract.customerName} | ${saleContract.contractDate}`;

export const getInstallmentScheduleLabel = (
  schedule: Pick<
    InstallmentScheduleRecord,
    'sequenceNumber' | 'dueDate' | 'amount'
  >,
) =>
  `#${schedule.sequenceNumber} | ${schedule.dueDate} | ${formatAccountingAmount(schedule.amount)}`;

export const getVoucherLabel = (
  voucher: Pick<VoucherRecord, 'voucherDate' | 'reference' | 'id' | 'totalDebit'>,
) =>
  `${formatDate(voucher.voucherDate)} | ${voucher.reference || voucher.id} | ${formatAccountingAmount(voucher.totalDebit)}`;

export const formatUnitHierarchy = (
  unit: Pick<UnitRecord, 'projectCode' | 'phaseCode' | 'blockCode' | 'zoneCode'>,
) =>
  [unit.projectCode, unit.phaseCode, unit.blockCode, unit.zoneCode]
    .filter((value): value is string => Boolean(value))
    .join(' / ');

export const formatCollectionLinks = (
  collection: Pick<
    CollectionRecord,
    'bookingId' | 'saleContractId' | 'installmentScheduleId'
  >,
) =>
  [
    collection.bookingId ? 'Booking' : null,
    collection.saleContractId ? 'Contract' : null,
    collection.installmentScheduleId ? 'Installment' : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' / ');
