import { PayrollRunDetailPage } from '../../../../../features/payroll-core/payroll-run-detail-page';

export default async function Page({
  params,
}: {
  params: Promise<{ payrollRunId: string }>;
}) {
  const { payrollRunId } = await params;

  return <PayrollRunDetailPage payrollRunId={payrollRunId} />;
}
