import { CollectionReceiptPage } from '../../../../../../features/crm-property-desk/collection-receipt-page';

export default async function Page({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = await params;

  return <CollectionReceiptPage collectionId={collectionId} />;
}
