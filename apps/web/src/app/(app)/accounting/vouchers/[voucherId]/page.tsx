import { VoucherDetailPage } from '../../../../../features/accounting/voucher-detail-page';

export default async function Page({
  params,
}: {
  params: Promise<{ voucherId: string }>;
}) {
  const { voucherId } = await params;

  return <VoucherDetailPage voucherId={voucherId} />;
}
