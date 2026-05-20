// ── Attachments generator: attachment metadata and attachment links ──

import { VOLUME_TARGETS } from '../config.mjs';
import { SeededRandom, Sequences, dateOnly } from '../shared.mjs';
import { assignYearToCustomer, assignMonthInYear } from './timeline.mjs';

const ATTACHMENT_CATEGORIES = [
  { category: 'booking-forms', count: 50, mimeTypes: ['application/pdf', 'application/pdf'], sizeRange: [50000, 500000] },
  { category: 'contract-documents', count: 40, mimeTypes: ['application/pdf'], sizeRange: [100000, 2000000] },
  { category: 'payment-acknowledgements', count: 35, mimeTypes: ['application/pdf', 'image/jpeg'], sizeRange: [30000, 300000] },
  { category: 'payroll-summaries', count: 20, mimeTypes: ['application/pdf', 'application/vnd.ms-excel'], sizeRange: [50000, 500000] },
  { category: 'project-approvals', count: 15, mimeTypes: ['application/pdf'], sizeRange: [200000, 1000000] },
  { category: 'vendor-bills', count: 25, mimeTypes: ['application/pdf', 'image/jpeg'], sizeRange: [50000, 500000] },
  { category: 'handover-checklists', count: 10, mimeTypes: ['application/pdf'], sizeRange: [30000, 200000] },
  { category: 'miscellaneous', count: 5, mimeTypes: ['application/pdf', 'image/jpeg'], sizeRange: [10000, 200000] },
];

const ENTITY_TYPE_DISTRIBUTION = {
  BOOKING: 0.25,
  SALE_CONTRACT: 0.20,
  VOUCHER: 0.25,
  PAYROLL_RUN: 0.15,
  EMPLOYEE: 0.10,
  CUSTOMER: 0.05,
};

const ENTITY_TYPES = ['BOOKING', 'SALE_CONTRACT', 'VOUCHER', 'PAYROLL_RUN', 'EMPLOYEE', 'CUSTOMER'];
const ENTITY_WEIGHTS = Object.values(ENTITY_TYPE_DISTRIBUTION);

export const seedAttachments = async (tx, companyId, refs, rng, seqs) => {
  const adminUserId = refs.get('user', 'admin@realcapita.com.bd');
  const storageBucket = 'rcg-docs';
  const attachments = [];

  for (const catSpec of ATTACHMENT_CATEGORIES) {
    for (let i = 0; i < catSpec.count; i += 1) {
      const year = assignYearToCustomer(rng);
      const month = assignMonthInYear(rng, year);
      const day = rng.nextInt(1, 28);

      const mimeType = rng.pick(catSpec.mimeTypes);
      const sizeBytes = BigInt(rng.nextInt(catSpec.sizeRange[0], catSpec.sizeRange[1]));
      const ext = mimeType === 'application/pdf' ? '.pdf' : mimeType === 'image/jpeg' ? '.jpg' : '.xls';

      // Realistic filename
      const baseName = `${catSpec.category}-${year}${String(month).padStart(2, '0')}`;
      const fileName = `${baseName}-${String(i + 1).padStart(3, '0')}${ext}`;
      const storageKey = `rcg-docs/${catSpec.category}/${year}/${fileName}`;

      // Plausible checksum/etag (synthetic hex pattern, no contamination markers)
      const checksumSha256 = generateChecksum(rng);
      const objectEtag = generateEtag(rng);

      const attachment = await tx.attachment.create({
        data: {
          companyId,
          storageBucket,
          storageKey,
          originalFileName: fileName,
          mimeType,
          sizeBytes,
          checksumSha256,
          objectEtag,
          uploadedById: adminUserId,
          status: 'AVAILABLE',
          uploadCompletedAt: dateOnly(year, month, day),
          createdAt: dateOnly(year, month, day),
        },
      });

      attachments.push({ attachment, category: catSpec.category });
      refs.set('attachment', attachment.id, attachment.id);
    }
  }

  // ── Attachment links (250) ──────────────────────────────────────────
  const entityIds = {
    BOOKING: refs.list('booking'),
    SALE_CONTRACT: refs.list('saleContract'),
    VOUCHER: [], // populated from voucher list
    PAYROLL_RUN: refs.list('payrollRun') || [],
    EMPLOYEE: refs.list('employee'),
    CUSTOMER: refs.list('customer'),
  };

  // Fetch voucher IDs for linking
  const voucherIds = await tx.voucher.findMany({
    where: { companyId },
    select: { id: true },
  });
  entityIds.VOUCHER = voucherIds.map(v => v.id);

  const usedLinks = new Set();

  for (let i = 0; i < VOLUME_TARGETS.attachmentLinks; i += 1) {
    if (attachments.length === 0) break;
    const { attachment } = attachments[i % attachments.length];

    // Try up to 10 random entity combinations to avoid unique constraint violations
    let entityType, entityId, linkKey;
    let attempts = 0;

    while (attempts < 10) {
      const entityTypeIdx = weightedPick(rng, ENTITY_WEIGHTS);
      entityType = ENTITY_TYPES[entityTypeIdx];
      const entityIdPool = entityIds[entityType];
      if (entityIdPool.length === 0) { attempts += 1; continue; }
      entityId = rng.pick(entityIdPool);
      linkKey = `${attachment.id}-${entityType}-${entityId}`;
      if (!usedLinks.has(linkKey)) break;
      attempts += 1;
    }

    if (attempts >= 10 || !entityType || !entityId) continue;
    usedLinks.add(linkKey);

    await tx.attachmentLink.create({
      data: {
        companyId,
        attachmentId: attachment.id,
        entityType,
        entityId,
        createdById: adminUserId,
        isActive: true,
        createdAt: attachment.createdAt,
      },
    });
  }
};

function generateChecksum(rng) {
  const hexChars = '0123456789abcdef';
  let checksum = '';
  for (let i = 0; i < 64; i += 1) {
    checksum += rng.pick([...hexChars]);
  }
  return checksum;
}

function generateEtag(rng) {
  const hexChars = '0123456789abcdef';
  let etag = '"';
  for (let i = 0; i < 32; i += 1) {
    etag += rng.pick([...hexChars]);
  }
  etag += '"';
  return etag;
}

function weightedPick(rng, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng.next() * total;
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
