import { createCsvString } from '../common/utils/csv.util';
import type { VoucherDetailDto } from './dto/vouchers.dto';

const VOUCHER_HEADERS = [
  'Voucher ID',
  'Reference',
  'Voucher Type',
  'Status',
  'Voucher Date',
  'Description',
  'Posted At',
  'Created At',
  'Updated At',
  'Line Number',
  'Posting Account Code',
  'Posting Account Name',
  'Ledger Account Code',
  'Ledger Account Name',
  'Line Description',
  'Debit Amount',
  'Credit Amount',
] as const;

export const buildVoucherDetailCsv = (
  voucher: VoucherDetailDto,
): string =>
  createCsvString(
    [...VOUCHER_HEADERS],
    voucher.lines.map((line) => [
      voucher.id,
      voucher.reference,
      voucher.voucherType,
      voucher.status,
      voucher.voucherDate,
      voucher.description,
      voucher.postedAt,
      voucher.createdAt,
      voucher.updatedAt,
      line.lineNumber,
      line.particularAccountCode,
      line.particularAccountName,
      line.ledgerAccountCode,
      line.ledgerAccountName,
      line.description,
      line.debitAmount,
      line.creditAmount,
    ]),
  );
