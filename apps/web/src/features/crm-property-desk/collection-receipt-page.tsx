'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { buttonVariants, cn } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { AppPage } from '../../components/ui/erp-primitives';
import { OutputActionGroup } from '../../components/ui/output-actions';
import { isApiError } from '../../lib/api/client';
import type { CollectionRecord } from '../../lib/api/types';
import {
  formatAccountingAmount,
  formatDate,
  formatDateTime,
} from '../../lib/format';
import { printCurrentPage } from '../../lib/output';
import { APP_ROUTES } from '../../lib/routes';
import {
  PrintableReportFooter,
  PrintableReportHeader,
  PrintableReportLayout,
  PrintableReportNote,
  PrintableReportSection,
  PrintableReportSummaryTable,
  type PrintableReportSummaryRow,
} from '../financial-reporting/printable-report';
import {
  formatVoucherStatusLabel,
  formatVoucherTypeLabel,
} from '../accounting/utils';
import { useCollection } from './hooks';
import {
  CrmPropertyDeskAccessRequiredState,
  CrmPropertyDeskPageHeader,
  CrmPropertyDeskQueryErrorBanner,
  CrmPropertyDeskSection,
  KeyValueList,
} from './shared';

const ACKNOWLEDGEMENT_NOTE =
  'This acknowledgement records an ERP collection linked to a posted accounting voucher.';

const formatReceiptAmount = (value: string) => formatAccountingAmount(value);

const getReceiptReference = (collection: CollectionRecord) =>
  collection.reference || collection.voucherReference || collection.id;

const getContactLabel = (collection: CollectionRecord) => {
  const contactParts = [
    collection.customerPhone,
    collection.customerEmail,
  ].filter((value): value is string => Boolean(value));

  return contactParts.length > 0 ? contactParts.join(' / ') : null;
};

const getVoucherReference = (collection: CollectionRecord) =>
  collection.voucherReference || collection.voucherId;

const getUnitLabel = (collection: CollectionRecord) =>
  [collection.bookingUnitCode, collection.bookingUnitName]
    .filter((value): value is string => Boolean(value))
    .join(' - ') || null;

const getBookingLabel = (collection: CollectionRecord) => {
  const bookingParts = [
    collection.bookingUnitCode,
    collection.customerName,
    collection.bookingDate ? formatDate(collection.bookingDate) : null,
  ].filter((value): value is string => Boolean(value));

  if (bookingParts.length > 0) {
    return bookingParts.join(' / ');
  }

  return collection.bookingId;
};

const getSaleContractLabel = (collection: CollectionRecord) =>
  collection.saleContractReference || collection.saleContractId;

const getInstallmentLabel = (collection: CollectionRecord) =>
  collection.installmentSequenceNumber == null
    ? null
    : `Installment #${collection.installmentSequenceNumber}`;

const filterSummaryRows = (rows: PrintableReportSummaryRow[]) =>
  rows.filter((row) => row.value !== null && row.value !== undefined);

const PrintableTextValue = ({ children }: { children: ReactNode }) => (
  <span className="printable-report-summary-text">{children}</span>
);

const ScreenMetric = ({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}) => (
  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
      {label}
    </p>
    <div
      className={cn(
        'mt-2 text-sm font-medium text-foreground',
        emphasis && 'text-xl font-semibold tabular-nums',
      )}
    >
      {value}
    </div>
  </div>
);

const CollectionReceiptPrintableReport = ({
  collection,
  generatedAt,
  generatedBy,
  statusMessage,
  userCompanyName,
}: {
  collection: CollectionRecord | null;
  generatedAt: string;
  generatedBy: string;
  statusMessage: string;
  userCompanyName: string;
}) => {
  const receiptReference = collection ? getReceiptReference(collection) : null;
  const hasCommercialContext = collection
    ? Boolean(
        collection.bookingId ||
        collection.bookingProjectName ||
        collection.bookingUnitCode ||
        collection.bookingUnitName ||
        collection.saleContractId ||
        collection.installmentScheduleId,
      )
    : false;

  return (
    <PrintableReportLayout
      orientation="portrait"
      testId="collection-receipt-printable"
    >
      <PrintableReportHeader
        activeCompany={userCompanyName}
        additionalMetaItems={[
          {
            label: 'Receipt reference',
            value: receiptReference ?? 'Pending collection data',
          },
          {
            label: 'Voucher reference',
            value: collection ? getVoucherReference(collection) : 'Pending',
          },
          {
            label: 'Voucher status',
            value: collection
              ? formatVoucherStatusLabel(collection.voucherStatus)
              : 'Pending',
          },
        ]}
        classificationLabel="Customer receipt"
        companyName={userCompanyName}
        dataSourceNote="Collection data is read from the CRM & Property Desk collection record and its linked posted voucher."
        generatedAt={generatedAt}
        generatedBy={generatedBy}
        outputLabel="Browser print / A4 portrait"
        periodLabel={
          collection
            ? formatDate(collection.collectionDate)
            : 'Collection data pending'
        }
        subtitle="Payment acknowledgement for a recorded customer collection."
        title="Customer Collection Receipt"
      />

      {collection ? (
        <>
          <PrintableReportSection
            subtitle="Customer and payment context for the recorded collection."
            title="Payment Summary"
          >
            <PrintableReportSummaryTable
              rows={filterSummaryRows([
                {
                  label: 'Collection amount',
                  value: (
                    <span className="text-base font-bold">
                      {formatReceiptAmount(collection.amount)}
                    </span>
                  ),
                },
                {
                  label: 'Customer',
                  value: (
                    <PrintableTextValue>
                      {collection.customerName}
                    </PrintableTextValue>
                  ),
                },
                {
                  label: 'Customer contact',
                  value: getContactLabel(collection),
                },
                {
                  label: 'Collection date',
                  value: formatDate(collection.collectionDate),
                },
                {
                  label: 'Collection reference',
                  value: collection.reference ? (
                    <PrintableTextValue>
                      {collection.reference}
                    </PrintableTextValue>
                  ) : null,
                },
                {
                  label: 'Notes',
                  value: collection.notes ? (
                    <PrintableTextValue>{collection.notes}</PrintableTextValue>
                  ) : null,
                },
              ])}
            />
          </PrintableReportSection>

          {hasCommercialContext ? (
            <PrintableReportSection
              subtitle="Commercial records linked to this collection where available."
              title="Property / Commercial Linkage"
            >
              <PrintableReportSummaryTable
                rows={filterSummaryRows([
                  {
                    label: 'Booking',
                    value: getBookingLabel(collection) ? (
                      <PrintableTextValue>
                        {getBookingLabel(collection)}
                      </PrintableTextValue>
                    ) : null,
                  },
                  {
                    label: 'Project',
                    value: collection.bookingProjectName ? (
                      <PrintableTextValue>
                        {collection.bookingProjectName}
                      </PrintableTextValue>
                    ) : null,
                  },
                  {
                    label: 'Unit',
                    value: getUnitLabel(collection),
                  },
                  {
                    label: 'Sale contract',
                    value: getSaleContractLabel(collection),
                  },
                  {
                    label: 'Contract date',
                    value: collection.saleContractDate
                      ? formatDate(collection.saleContractDate)
                      : null,
                  },
                  {
                    label: 'Installment',
                    value: getInstallmentLabel(collection),
                  },
                  {
                    label: 'Installment due date',
                    value: collection.installmentDueDate
                      ? formatDate(collection.installmentDueDate)
                      : null,
                  },
                  {
                    label: 'Installment amount',
                    value: collection.installmentAmount
                      ? formatReceiptAmount(collection.installmentAmount)
                      : null,
                  },
                ])}
              />
            </PrintableReportSection>
          ) : null}

          <PrintableReportSection
            subtitle="Accounting evidence associated with this recorded collection."
            title="Accounting Linkage"
          >
            <PrintableReportSummaryTable
              rows={[
                {
                  label: 'Voucher',
                  value: (
                    <PrintableTextValue>
                      {getVoucherReference(collection)}
                    </PrintableTextValue>
                  ),
                },
                {
                  label: 'Voucher type',
                  value: formatVoucherTypeLabel(collection.voucherType),
                },
                {
                  label: 'Voucher date',
                  value: formatDate(collection.voucherDate),
                },
                {
                  label: 'Voucher status',
                  value: formatVoucherStatusLabel(collection.voucherStatus),
                },
              ]}
            />
            <PrintableReportNote>{ACKNOWLEDGEMENT_NOTE}</PrintableReportNote>
          </PrintableReportSection>

          <PrintableReportSection
            subtitle="Receipt acknowledgement fields for browser print."
            title="Receipt Sign-off"
          >
            <div className="grid grid-cols-2 gap-8 pt-8 text-sm">
              <div>
                <div className="h-10 border-b border-slate-400" />
                <p className="mt-2 font-semibold">Received By</p>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400" />
                <p className="mt-2 font-semibold">Authorized Signature</p>
              </div>
            </div>
          </PrintableReportSection>
        </>
      ) : (
        <PrintableReportSection
          subtitle="Print output is available after the collection record is ready."
          title="Receipt Status"
        >
          <PrintableReportNote>{statusMessage}</PrintableReportNote>
        </PrintableReportSection>
      )}

      <PrintableReportFooter
        generatedAt={generatedAt}
        note="Browser-generated customer collection receipt from ERP records."
        systemName="Real Capita ERP - Customer Collection Receipt"
      />
    </PrintableReportLayout>
  );
};

export const CollectionReceiptPage = ({
  collectionId,
}: {
  collectionId: string;
}) => {
  const { canAccessCrmPropertyDesk, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessCrmPropertyDesk && Boolean(companyId);
  const collectionQuery = useCollection(companyId, collectionId, isEnabled);
  const collection = collectionQuery.data ?? null;
  const generatedAt = formatDateTime(
    new Date(collectionQuery.dataUpdatedAt || Date.now()).toISOString(),
  );
  const statusMessage =
    collectionQuery.isError && isApiError(collectionQuery.error)
      ? collectionQuery.error.apiError.message
      : collectionQuery.isPending
        ? 'The collection receipt is loading. Print after the receipt data has loaded.'
        : 'Open a valid collection receipt before printing.';

  if (!user) {
    return null;
  }

  if (!canAccessCrmPropertyDesk) {
    return <CrmPropertyDeskAccessRequiredState />;
  }

  return (
    <AppPage>
      <div
        className="printable-report-screen-content space-y-6"
        data-testid="printable-report-screen-content"
      >
        <CrmPropertyDeskPageHeader
          actions={
            <div className="flex flex-wrap gap-2">
              <OutputActionGroup
                onPrint={printCurrentPage}
                printDisabled={!collection}
                printLabel="Print Receipt"
              />
              <Link
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'screen-only',
                )}
                href={APP_ROUTES.crmPropertyDeskCollections}
              >
                Back to Collections
              </Link>
            </div>
          }
          description="Review and print a customer-facing acknowledgement for a recorded collection linked to posted accounting evidence."
          scopeName={user.currentCompany.name}
          scopeSlug={user.currentCompany.slug}
          title="Customer Collection Receipt"
        />

        {collectionQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading collection receipt.
          </div>
        ) : collectionQuery.isError && isApiError(collectionQuery.error) ? (
          <CrmPropertyDeskQueryErrorBanner
            message={collectionQuery.error.apiError.message}
          />
        ) : collection ? (
          <>
            <CrmPropertyDeskSection
              description="Receipt preview mirrors the printable acknowledgement without exposing collection mutation controls."
              title="Receipt Preview"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ScreenMetric
                  emphasis
                  label="Collection amount"
                  value={formatReceiptAmount(collection.amount)}
                />
                <ScreenMetric
                  label="Customer"
                  value={
                    <div className="space-y-1">
                      <p>{collection.customerName}</p>
                      {getContactLabel(collection) ? (
                        <p className="text-xs text-muted-foreground">
                          {getContactLabel(collection)}
                        </p>
                      ) : null}
                    </div>
                  }
                />
                <ScreenMetric
                  label="Collection date"
                  value={formatDate(collection.collectionDate)}
                />
                <ScreenMetric
                  label="Receipt reference"
                  value={getReceiptReference(collection)}
                />
              </div>
            </CrmPropertyDeskSection>

            <CrmPropertyDeskSection
              description="Posted accounting voucher context remains visible for supervisor and management review."
              title="Linked Evidence"
            >
              <KeyValueList
                items={[
                  {
                    label: 'Voucher',
                    value: getVoucherReference(collection),
                  },
                  {
                    label: 'Voucher type',
                    value: formatVoucherTypeLabel(collection.voucherType),
                  },
                  {
                    label: 'Voucher date',
                    value: formatDate(collection.voucherDate),
                  },
                  {
                    label: 'Voucher status',
                    value: formatVoucherStatusLabel(collection.voucherStatus),
                  },
                  ...(collection.bookingProjectName
                    ? [
                        {
                          label: 'Project',
                          value: collection.bookingProjectName,
                        },
                      ]
                    : []),
                  ...(getUnitLabel(collection)
                    ? [
                        {
                          label: 'Unit',
                          value: getUnitLabel(collection),
                        },
                      ]
                    : []),
                  ...(getSaleContractLabel(collection)
                    ? [
                        {
                          label: 'Sale contract',
                          value: getSaleContractLabel(collection),
                        },
                      ]
                    : []),
                  ...(getInstallmentLabel(collection)
                    ? [
                        {
                          label: 'Installment',
                          value: getInstallmentLabel(collection),
                        },
                      ]
                    : []),
                ]}
              />
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                {ACKNOWLEDGEMENT_NOTE}
              </div>
            </CrmPropertyDeskSection>
          </>
        ) : (
          <EmptyState
            description="Open this page from a collection row to load a printable acknowledgement."
            title="Collection receipt unavailable"
          />
        )}
      </div>

      <CollectionReceiptPrintableReport
        collection={collection}
        generatedAt={generatedAt}
        generatedBy={user.email}
        statusMessage={statusMessage}
        userCompanyName={user.currentCompany.name}
      />
    </AppPage>
  );
};
