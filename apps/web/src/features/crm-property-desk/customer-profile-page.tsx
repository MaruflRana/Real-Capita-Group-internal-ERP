'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { buttonVariants, cn } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import {
  AppPage,
  DataSourceNote,
  EmptyStateBlock,
  MetricCard,
  PageSection,
  ReportGrid,
} from '../../components/ui/erp-primitives';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import type {
  CustomerProfileBookingRecord,
  CustomerProfileInstallmentScheduleRecord,
  CustomerProfileRecord,
  CustomerProfileSaleContractRecord,
  CustomerProfileTimelineEventRecord,
  CustomerProfileTransactionRecord,
} from '../../lib/api/types';
import {
  formatAccountingAmount,
  formatDate,
  formatDateTime,
} from '../../lib/format';
import { APP_ROUTES, getCollectionReceiptRoute } from '../../lib/routes';
import {
  formatVoucherStatusLabel,
  formatVoucherTypeLabel,
} from '../accounting/utils';
import { useCustomerProfile } from './hooks';
import {
  CrmPropertyDeskAccessRequiredState,
  CrmPropertyDeskPageHeader,
  CrmPropertyDeskQueryErrorBanner,
  EntityStatusBadge,
} from './shared';

const optionalText = (
  value: string | null | undefined,
  fallback = 'Not recorded',
) => (value && value.trim().length > 0 ? value : fallback);

const formatCount = (value: number) =>
  new Intl.NumberFormat('en-US').format(value);

const getContractLabel = (
  saleContractId: string | null,
  reference: string | null,
) => reference || saleContractId || 'No linked contract';

const getUnitLabel = ({
  unitCode,
  unitName,
}: {
  unitCode: string | null;
  unitName: string | null;
}) =>
  [unitCode, unitName]
    .filter((value): value is string => Boolean(value))
    .join(' - ') || 'No unit context';

const SectionLoadingState = ({ label }: { label: string }) => (
  <div className="rounded-lg border border-brand-sky/40 bg-brand-skySoft/85 px-4 py-8 text-sm text-muted-foreground">
    Loading {label}.
  </div>
);

const ProfileFact = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="min-w-0 rounded-lg border border-brand-sky/40 bg-card/90 px-4 py-3">
    <p className="erp-label">{label}</p>
    <div className="mt-2 break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
      {value}
    </div>
  </div>
);

const CustomerIdentitySection = ({
  profile,
}: {
  profile: CustomerProfileRecord;
}) => (
  <PageSection
    description="Identity and contact information used across bookings, contracts, installment schedules, collections, and receipts."
    title="Customer Overview"
  >
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
      <div className="min-w-0 rounded-lg border border-brand-sky/35 bg-gradient-to-br from-brand-headerGradientStart via-card to-brand-headerGradientEnd/70 px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-semibold leading-8 text-foreground [overflow-wrap:anywhere]">
              {profile.customer.fullName}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <EntityStatusBadge isActive={profile.customer.isActive} />
              <span className="inline-flex rounded-full border border-brand-sky/35 bg-brand-skySoft px-2.5 py-1 text-xs font-semibold text-brand-navy">
                Created {formatDate(profile.customer.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ProfileFact
            label="Phone"
            value={optionalText(profile.customer.phone)}
          />
          <ProfileFact
            label="Email"
            value={optionalText(profile.customer.email)}
          />
          <ProfileFact
            label="Address"
            value={optionalText(profile.customer.address)}
          />
          <ProfileFact
            label="Updated"
            value={formatDateTime(profile.customer.updatedAt)}
          />
        </div>
      </div>
      <div className="min-w-0 rounded-lg border border-brand-green/20 bg-brand-greenSoft/90 px-5 py-5">
        <p className="erp-label">Internal notes</p>
        <p className="mt-3 break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
          {optionalText(profile.customer.notes, 'No customer notes recorded.')}
        </p>
      </div>
    </div>
  </PageSection>
);

const SummarySection = ({ profile }: { profile: CustomerProfileRecord }) => (
  <PageSection
    description="Safe customer-level metrics only. Outstanding, remaining, and overdue claims are intentionally not presented here."
    title="Customer records summary"
  >
    <ReportGrid>
      <MetricCard
        helper={`${formatCount(profile.summary.activeBookingCount)} active booking records`}
        label="Bookings"
        tone="info"
        value={formatCount(profile.summary.totalBookings)}
      />
      <MetricCard
        helper={`${formatAccountingAmount(profile.summary.totalContractAmount)} total contract amount`}
        label="Sale contracts"
        tone="info"
        value={formatCount(profile.summary.saleContractCount)}
      />
      <MetricCard
        helper={`${formatCount(profile.summary.installmentScheduleCount)} scheduled rows`}
        label="Scheduled installment amount"
        tone="default"
        value={formatAccountingAmount(
          profile.summary.totalScheduledInstallmentAmount,
        )}
      />
      <MetricCard
        helper={`${formatCount(profile.summary.totalCollectionsCount)} collection records`}
        label="Total collected amount"
        tone="success"
        value={formatAccountingAmount(profile.summary.totalCollectedAmount)}
      />
      <MetricCard
        label="Latest collection date"
        tone="info"
        value={formatDate(
          profile.summary.latestCollectionDate,
          'No collections',
        )}
      />
      <MetricCard
        helper="Voucher-confirmed portion of total collections."
        label="Posted-voucher confirmed"
        tone="success"
        value={formatAccountingAmount(
          profile.summary.postedVoucherBackedCollectionAmount,
        )}
      />
    </ReportGrid>
    {profile.assumptions.length > 0 ? (
      <DataSourceNote>
        {profile.assumptions.map((assumption) => (
          <span className="mr-3" key={assumption}>
            {assumption}
          </span>
        ))}
      </DataSourceNote>
    ) : null}
  </PageSection>
);

const BookingsSection = ({
  bookings,
}: {
  bookings: CustomerProfileBookingRecord[];
}) => (
  <PageSection
    description="Booking records tied to this customer, with project/unit context and linked sale contract where available."
    title="Booking Records"
  >
    {bookings.length === 0 ? (
      <EmptyStateBlock
        description="This customer does not have any booking records yet."
        title="No bookings"
      />
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking date</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Related contract</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>{formatDate(booking.bookingDate)}</TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">
                    {booking.projectName}
                  </p>
                  <p className="text-muted-foreground">{booking.projectCode}</p>
                </div>
              </TableCell>
              <TableCell>{getUnitLabel(booking)}</TableCell>
              <TableCell>
                {formatAccountingAmount(booking.bookingAmount)}
              </TableCell>
              <TableCell>{booking.status}</TableCell>
              <TableCell>
                {getContractLabel(
                  booking.saleContractId,
                  booking.saleContractReference,
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </PageSection>
);

const SaleContractsSection = ({
  saleContracts,
}: {
  saleContracts: CustomerProfileSaleContractRecord[];
}) => (
  <PageSection
    description="Sale contracts recorded from this customer's bookings."
    title="Sale Contracts"
  >
    {saleContracts.length === 0 ? (
      <EmptyStateBlock
        description="This customer does not have any sale contracts yet."
        title="No sale contracts"
      />
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Contract date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Booking</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Unit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {saleContracts.map((saleContract) => (
            <TableRow key={saleContract.id}>
              <TableCell>{saleContract.reference || saleContract.id}</TableCell>
              <TableCell>{formatDate(saleContract.contractDate)}</TableCell>
              <TableCell>
                {formatAccountingAmount(saleContract.contractAmount)}
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">
                    {saleContract.bookingDate
                      ? `Booked ${formatDate(saleContract.bookingDate)}`
                      : saleContract.bookingId
                        ? 'Linked booking'
                        : 'No linked booking'}
                  </p>
                  {saleContract.bookingId ? (
                    <p className="text-muted-foreground">
                      Booking record linked
                    </p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{saleContract.projectName}</TableCell>
              <TableCell>{getUnitLabel(saleContract)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </PageSection>
);

const InstallmentScheduleSection = ({
  installmentSchedules,
}: {
  installmentSchedules: CustomerProfileInstallmentScheduleRecord[];
}) => (
  <PageSection
    description="Installment schedules tied to this customer's sale contracts. Collected and balance values appear only when computed from collections directly linked to that exact installment schedule."
    title="Installment Schedule"
  >
    {installmentSchedules.length === 0 ? (
      <EmptyStateBlock
        description="This customer does not have installment schedules yet."
        title="No installment schedules"
      />
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Installment</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Directly linked collected</TableHead>
            <TableHead>Directly linked balance</TableHead>
            <TableHead>Sale contract</TableHead>
            <TableHead>Unit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installmentSchedules.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>#{schedule.sequenceNumber}</TableCell>
              <TableCell>{formatDate(schedule.dueDate)}</TableCell>
              <TableCell>{formatAccountingAmount(schedule.amount)}</TableCell>
              <TableCell>
                {schedule.collectedAmount
                  ? formatAccountingAmount(schedule.collectedAmount)
                  : 'No direct collection link'}
              </TableCell>
              <TableCell>
                {schedule.balanceAmount
                  ? formatAccountingAmount(schedule.balanceAmount)
                  : 'No direct collection link'}
              </TableCell>
              <TableCell>
                {getContractLabel(
                  schedule.saleContractId,
                  schedule.saleContractReference,
                )}
              </TableCell>
              <TableCell>{getUnitLabel(schedule)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </PageSection>
);

const getTransactionContext = (
  transaction: CustomerProfileTransactionRecord,
) => {
  const unitContext =
    transaction.bookingUnitCode || transaction.bookingUnitName
      ? getUnitLabel({
          unitCode: transaction.bookingUnitCode,
          unitName: transaction.bookingUnitName,
        })
      : null;
  const parts = [
    transaction.bookingProjectName,
    unitContext,
    transaction.saleContractReference
      ? `Contract ${transaction.saleContractReference}`
      : transaction.saleContractId
        ? `Contract ${transaction.saleContractId}`
        : null,
    transaction.installmentSequenceNumber
      ? `Installment #${transaction.installmentSequenceNumber}`
      : null,
    transaction.installmentDueDate
      ? `Due ${formatDate(transaction.installmentDueDate)}`
      : null,
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0 ? parts.join(' / ') : 'No linked booking context';
};

const TransactionHistorySection = ({
  transactions,
}: {
  transactions: CustomerProfileTransactionRecord[];
}) => (
  <PageSection
    description="Newest-first collection history for this customer, with posted voucher context and printable receipt access."
    title="Transaction History"
  >
    {transactions.length === 0 ? (
      <EmptyStateBlock
        description="This customer does not have collection history yet."
        title="No collections"
      />
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Collection</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Voucher</TableHead>
            <TableHead>Linked context</TableHead>
            <TableHead className="w-[170px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{formatDate(transaction.collectionDate)}</TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">
                    {transaction.reference || transaction.id}
                  </p>
                  {transaction.notes ? (
                    <p className="text-muted-foreground">{transaction.notes}</p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                {formatAccountingAmount(transaction.amount)}
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <p>{transaction.voucherReference || transaction.voucherId}</p>
                  <p className="text-muted-foreground">
                    {formatVoucherTypeLabel(transaction.voucherType)} /{' '}
                    {formatVoucherStatusLabel(transaction.voucherStatus)} /{' '}
                    {formatDate(transaction.voucherDate)}
                  </p>
                </div>
              </TableCell>
              <TableCell>{getTransactionContext(transaction)}</TableCell>
              <TableCell>
                <Link
                  className={cn(
                    buttonVariants({ size: 'sm', variant: 'outline' }),
                  )}
                  href={getCollectionReceiptRoute(transaction.id)}
                >
                  Printable Receipt
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </PageSection>
);

const TimelineSection = ({
  timeline,
}: {
  timeline: CustomerProfileTimelineEventRecord[];
}) => (
  <PageSection
    description="A concise business chronology assembled from existing CRM records only."
    title="Customer Activity Timeline"
  >
    {timeline.length === 0 ? (
      <EmptyStateBlock
        description="No customer activity timeline is available yet."
        title="No timeline events"
      />
    ) : (
      <ol className="relative space-y-4 border-l border-brand-sky/40 pl-5">
        {timeline.map((event) => (
          <li className="relative min-w-0" key={event.id}>
            <span
              aria-hidden="true"
              className="absolute -left-[1.84rem] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary"
            />
            <div className="rounded-lg border border-brand-sky/40 bg-gradient-to-br from-card to-brand-skySoft/80 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{event.title}</p>
                  <p className="mt-1 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                    {event.description}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-muted-foreground">
                  {formatDate(event.eventDate)}
                </span>
              </div>
              {event.recordReference ? (
                <p className="mt-2 text-xs font-semibold uppercase text-muted-foreground">
                  {event.recordReference}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    )}
  </PageSection>
);

export const CustomerProfilePage = ({ customerId }: { customerId: string }) => {
  const { canAccessCrmPropertyDesk, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessCrmPropertyDesk && Boolean(companyId);
  const profileQuery = useCustomerProfile(companyId, customerId, isEnabled);
  const profile = profileQuery.data ?? null;

  if (!user) {
    return null;
  }

  if (!canAccessCrmPropertyDesk) {
    return <CrmPropertyDeskAccessRequiredState />;
  }

  return (
    <AppPage>
      <CrmPropertyDeskPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            href={APP_ROUTES.crmPropertyDeskCustomers}
          >
            Back to Customers
          </Link>
        }
        description="Open one customer and review the linked booking, sale contract, installment schedule, collection, posted voucher, and printable receipt story."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="Customer Profile"
      />

      {profileQuery.isPending ? (
        <SectionLoadingState label="customer profile" />
      ) : profileQuery.isError && isApiError(profileQuery.error) ? (
        <CrmPropertyDeskQueryErrorBanner
          message={profileQuery.error.apiError.message}
        />
      ) : profile ? (
        <>
          <CustomerIdentitySection profile={profile} />
          <SummarySection profile={profile} />
          <BookingsSection bookings={profile.bookings} />
          <SaleContractsSection saleContracts={profile.saleContracts} />
          <InstallmentScheduleSection
            installmentSchedules={profile.installmentSchedules}
          />
          <TransactionHistorySection
            transactions={profile.transactionHistory}
          />
          <TimelineSection timeline={profile.timeline} />
        </>
      ) : (
        <EmptyStateBlock
          description="Open a valid customer from the customer register to review a full customer profile."
          title="Customer profile unavailable"
        />
      )}
    </AppPage>
  );
};
