import { CustomerProfilePage } from '../../../../../features/crm-property-desk/customer-profile-page';

export default async function Page({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;

  return <CustomerProfilePage customerId={customerId} />;
}
