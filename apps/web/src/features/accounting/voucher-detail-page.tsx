'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  Button,
  buttonVariants,
  cn,
} from '@real-capita/ui';
import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { OutputActionGroup } from '../../components/ui/output-actions';
import { SidePanel } from '../../components/ui/side-panel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import {
  buildExportFileName,
  downloadApiCsv,
  printCurrentPage,
} from '../../lib/output';
import {
  formatAccountingAmount,
  formatDate,
  formatDateTime,
} from '../../lib/format';
import {
  APP_ROUTES,
} from '../../lib/routes';
import {
  useAddVoucherLine,
  usePostVoucher,
  useRemoveVoucherLine,
  useUpdateVoucherDraft,
  useUpdateVoucherLine,
  useVoucher,
} from './hooks';
import {
  AccountingAccessRequiredState,
  AccountingPageHeader,
  AccountingPrintContext,
  AccountingQueryErrorBanner,
  AccountingReadOnlyNotice,
  AccountingSection,
  BalanceBadge,
  VoucherStatusBadge,
} from './shared';
import {
  calculateVoucherTotals,
  formatVoucherTypeLabel,
} from './utils';
import {
  VoucherHeaderForm,
  VoucherLineFormPanel,
  type VoucherHeaderFormValues,
  type VoucherLineFormValues,
} from './voucher-forms';

export const VoucherDetailPage = ({
  voucherId,
}: {
  voucherId: string;
}) => {
  const { canAccessAccounting, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const accountingEnabled = canAccessAccounting && Boolean(companyId);
  const voucherQuery = useVoucher(companyId, voucherId, accountingEnabled);
  const updateVoucherDraftMutation = useUpdateVoucherDraft(companyId);
  const addVoucherLineMutation = useAddVoucherLine(companyId);
  const updateVoucherLineMutation = useUpdateVoucherLine(companyId);
  const removeVoucherLineMutation = useRemoveVoucherLine(companyId);
  const postVoucherMutation = usePostVoucher(companyId);

  const [linePanelOpen, setLinePanelOpen] = useState(false);
  const [lineEditorId, setLineEditorId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const voucher = voucherQuery.data;
  const lineEditor =
    voucher?.lines.find((line) => line.id === lineEditorId) ?? null;
  const totals = useMemo(
    () => calculateVoucherTotals(voucher?.lines ?? []),
    [voucher?.lines],
  );
  const isDraft = voucher?.status === 'DRAFT';

  if (!user) {
    return null;
  }

  if (!canAccessAccounting) {
    return <AccountingAccessRequiredState />;
  }

  const handleActionError = (error: unknown, fallbackMessage: string) => {
    if (isApiError(error)) {
      setActionError(error.apiError.message);
      return;
    }

    if (error instanceof Error) {
      setActionError(error.message);
      return;
    }

    setActionError(fallbackMessage);
  };

  const buildHeaderPayload = (values: VoucherHeaderFormValues) => ({
    voucherType: values.voucherType,
    voucherDate: values.voucherDate,
    ...(values.reference?.trim()
      ? { reference: values.reference.trim() }
      : {}),
    ...(values.description?.trim()
      ? { description: values.description.trim() }
      : {}),
  });

  const buildLinePayload = (values: VoucherLineFormValues) => ({
    particularAccountId: values.particularAccountId,
    debitAmount: values.debitAmount,
    creditAmount: values.creditAmount,
    ...(values.description?.trim()
      ? { description: values.description.trim() }
      : {}),
  });

  const handleLineSubmit = async (values: VoucherLineFormValues) => {
    if (!voucher) {
      return;
    }

    if (lineEditor) {
      await updateVoucherLineMutation.mutateAsync({
        voucherId: voucher.id,
        voucherLineId: lineEditor.id,
        payload: buildLinePayload(values),
      });
    } else {
      await addVoucherLineMutation.mutateAsync({
        voucherId: voucher.id,
        payload: buildLinePayload(values),
      });
    }

    setActionError(null);
    setLinePanelOpen(false);
    setLineEditorId(null);
  };

  const handleExport = async () => {
    if (!companyId || !voucher) {
      return;
    }

    setExportError(null);
    setIsExporting(true);

    try {
      await downloadApiCsv(
        `companies/${companyId}/accounting/vouchers/${voucher.id}/export`,
        buildExportFileName([
          user.currentCompany.slug,
          'voucher',
          voucher.reference ?? voucher.id,
          voucher.voucherDate,
        ]),
      );
    } catch (error) {
      setExportError(
        isApiError(error)
          ? error.apiError.message
          : error instanceof Error
            ? error.message
            : 'Unable to export the voucher detail.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="Voucher detail"
        description="Review voucher header information, maintain draft lines using posting-level accounts only, and post the voucher explicitly once totals are balanced."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <div className="flex flex-wrap gap-2">
            {voucher ? (
              <OutputActionGroup
                isExporting={isExporting}
                onExport={() => void handleExport()}
                onPrint={printCurrentPage}
              />
            ) : null}
            <Link
              className={cn(buttonVariants({ variant: 'outline' }), 'screen-only')}
              href={APP_ROUTES.accountingVouchers}
            >
              Back to vouchers
            </Link>
          </div>
        }
      />

      <div className="screen-only space-y-3">
        {actionError ? <AccountingQueryErrorBanner message={actionError} /> : null}
        {exportError ? <AccountingQueryErrorBanner message={exportError} /> : null}
      </div>

      {voucherQuery.isPending ? (
        <div className="rounded-3xl border border-border/70 bg-card/80 px-6 py-8 text-sm text-muted-foreground">
          Loading voucher detail.
        </div>
      ) : voucherQuery.isError && isApiError(voucherQuery.error) ? (
        <AccountingQueryErrorBanner
          message={voucherQuery.error.apiError.message}
        />
      ) : voucher ? (
        <>
          <AccountingPrintContext
            items={[
              {
                label: 'Company',
                value: user.currentCompany.name,
              },
              {
                label: 'Voucher type',
                value: formatVoucherTypeLabel(voucher.voucherType),
              },
              {
                label: 'Voucher date',
                value: formatDate(voucher.voucherDate),
              },
              {
                label: 'Status',
                value: voucher.status,
              },
              {
                label: 'Reference',
                value: voucher.reference ?? 'No reference',
              },
              {
                label: 'Posted at',
                value: formatDateTime(voucher.postedAt, 'Not posted'),
              },
            ]}
            title="Voucher print context"
          />

          <AccountingSection
            title={`${formatVoucherTypeLabel(voucher.voucherType)} voucher`}
            description="The draft stays editable until an explicit post succeeds. Posted vouchers are rendered as read-only."
            actions={
              isDraft ? (
                <div className="screen-only">
                  <Button
                    disabled={postVoucherMutation.isPending}
                    onClick={() => {
                      if (!window.confirm('Post this voucher now?')) {
                        return;
                      }

                      void postVoucherMutation
                        .mutateAsync(voucher.id)
                        .then(() => setActionError(null))
                        .catch((error) =>
                          handleActionError(
                            error,
                            'Unable to post the voucher.',
                          ),
                        );
                    }}
                  >
                    {postVoucherMutation.isPending ? 'Posting...' : 'Post voucher'}
                  </Button>
                </div>
              ) : null
            }
          >
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Status
                </p>
                <div className="mt-2">
                  <VoucherStatusBadge status={voucher.status} />
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Balance
                </p>
                <div className="mt-2">
                  <BalanceBadge isBalanced={totals.isBalanced} />
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Total debit
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatAccountingAmount(voucher.totalDebit)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Total credit
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatAccountingAmount(voucher.totalCredit)}
                </p>
              </div>
            </div>

            {!isDraft ? (
              <AccountingReadOnlyNotice
                title="Voucher posted"
                description="This voucher is posted and strongly protected in the UI. Header fields and line mutations are disabled."
              />
            ) : voucher.lines.length === 0 || !totals.isBalanced ? (
              <AccountingReadOnlyNotice
                title="Posting checks still pending"
                description="Posting remains explicit. The backend will reject posting until the voucher has at least one line and debit equals credit."
              />
            ) : null}

            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Voucher date
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDate(voucher.voucherDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Line count
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {voucher.lineCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Posted at
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDateTime(voucher.postedAt, 'Not posted')}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Last updated
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDateTime(voucher.updatedAt)}
                </p>
              </div>
            </div>
          </AccountingSection>

          <div className="screen-only">
            <AccountingSection
              title="Voucher header"
              description="Draft header fields can be updated without touching the line items."
            >
              <VoucherHeaderForm
                defaultValues={{
                  voucherType: voucher.voucherType,
                  voucherDate: voucher.voucherDate,
                  reference: voucher.reference ?? '',
                  description: voucher.description ?? '',
                }}
                disabled={!isDraft}
                isPending={updateVoucherDraftMutation.isPending}
                onSubmit={(values) =>
                  updateVoucherDraftMutation
                    .mutateAsync({
                      voucherId: voucher.id,
                      payload: buildHeaderPayload(values),
                    })
                    .then(() => setActionError(null))
                }
                submitErrorFallback="Unable to save the voucher header."
                submitLabel="Save header"
              />
            </AccountingSection>
          </div>

          <AccountingSection
            title="Voucher lines"
            description="Voucher lines use active posting-level accounts only. Draft vouchers remain editable on screen, while print and export stay read-only."
            actions={
              isDraft ? (
                <div className="screen-only">
                  <Button
                    onClick={() => {
                      setActionError(null);
                      setLineEditorId(null);
                      setLinePanelOpen(true);
                    }}
                  >
                    Add line
                  </Button>
                </div>
              ) : null
            }
          >
            {voucher.lines.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line</TableHead>
                    <TableHead>Posting account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead className="screen-only w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voucher.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.lineNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">
                            {line.particularAccountName}
                          </p>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            {line.particularAccountCode} - {line.ledgerAccountCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{line.description || 'No description'}</TableCell>
                      <TableCell>{formatAccountingAmount(line.debitAmount)}</TableCell>
                      <TableCell>{formatAccountingAmount(line.creditAmount)}</TableCell>
                      <TableCell className="screen-only">
                        {isDraft ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => {
                                setActionError(null);
                                setLineEditorId(line.id);
                                setLinePanelOpen(true);
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Edit
                            </Button>
                            <Button
                              disabled={removeVoucherLineMutation.isPending}
                              onClick={() => {
                                if (!window.confirm('Remove this voucher line?')) {
                                  return;
                                }

                                void removeVoucherLineMutation
                                  .mutateAsync({
                                    voucherId: voucher.id,
                                    voucherLineId: line.id,
                                  })
                                  .then(() => setActionError(null))
                                  .catch((error) =>
                                    handleActionError(
                                      error,
                                      'Unable to remove the voucher line.',
                                    ),
                                  );
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Read-only
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No voucher lines yet"
                description="Add posting lines to complete the draft and bring the voucher into balance before posting."
              />
            )}
          </AccountingSection>
        </>
      ) : null}

      <SidePanel
        description="Select an active posting account and enter either a debit amount or a credit amount."
        onClose={() => {
          setLinePanelOpen(false);
          setLineEditorId(null);
        }}
        open={linePanelOpen}
        size="lg"
        title={lineEditor ? 'Edit voucher line' : 'Add voucher line'}
      >
        <VoucherLineFormPanel
          companyId={companyId}
          isPending={
            addVoucherLineMutation.isPending || updateVoucherLineMutation.isPending
          }
          onClose={() => {
            setLinePanelOpen(false);
            setLineEditorId(null);
          }}
          onSubmit={handleLineSubmit}
          voucherLine={lineEditor}
          voucherLines={voucher?.lines ?? []}
        />
      </SidePanel>
    </div>
  );
};
