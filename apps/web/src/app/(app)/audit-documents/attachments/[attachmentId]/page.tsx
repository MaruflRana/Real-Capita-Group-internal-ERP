import { AttachmentDetailPage } from '../../../../../features/audit-documents/attachment-detail-page';

export default async function Page({
  params,
}: {
  params: Promise<{ attachmentId: string }>;
}) {
  const { attachmentId } = await params;

  return <AttachmentDetailPage attachmentId={attachmentId} />;
}
