'use client';

import {
  AnalyticsCard,
  AnalyticsEmptyState,
  AnalyticsGrid,
  AnalyticsIssueBanner,
  AnalyticsLoadingState,
  DistributionBarList,
  DistributionChartCard,
  KpiTrendCard,
  MetricCardGrid,
  MiniReportTableCard,
  SampleScopeNote,
  TrendBarChart,
  TrendChartCard,
} from './components';
import {
  useAccountingAnalytics,
  useAuditDocumentAnalytics,
  useCrmAnalytics,
  useDashboardAnalytics,
  useHrAnalytics,
  usePayrollAnalytics,
  useProjectPropertyAnalytics,
} from './hooks';
import type { DashboardAccess, DashboardPeriod } from '../../lib/api/dashboard';

const isDemoCompany = (companySlug: string | undefined) =>
  companySlug === 'real-capita-demo-uat';

const DemoScopeNote = ({
  companySlug,
}: {
  companySlug?: string | undefined;
}) =>
  isDemoCompany(companySlug) ? (
    <span>Analytics are rendering the seeded Demo/UAT company data.</span>
  ) : null;

const DashboardEmptyAnalytics = () => (
  <AnalyticsEmptyState
    description="No accessible analytics widgets have data for the active company."
    title="No analytics data yet"
  />
);

export const DashboardAnalyticsPanel = ({
  companyId,
  companySlug,
  access,
  period,
}: {
  companyId: string | undefined;
  companySlug?: string | undefined;
  access: DashboardAccess;
  period: DashboardPeriod;
}) => {
  const analyticsQuery = useDashboardAnalytics(companyId, access, period);

  if (analyticsQuery.isPending && !analyticsQuery.data) {
    return <AnalyticsLoadingState label="Loading company analytics." />;
  }

  const analytics = analyticsQuery.data;

  if (!analytics) {
    return <DashboardEmptyAnalytics />;
  }

  const hasWidgets = Boolean(
    analytics.financial ||
      analytics.accounting ||
      analytics.property ||
      analytics.crm ||
      analytics.hr ||
      analytics.payroll ||
      analytics.documents,
  );

  if (!hasWidgets) {
    return (
      <>
        <AnalyticsIssueBanner issues={analytics.issues} />
        <DashboardEmptyAnalytics />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <AnalyticsIssueBanner issues={analytics.issues} />
      <AnalyticsGrid>
        {analytics.financial ? (
          <TrendChartCard
            data={analytics.financial.businessPerformanceTrend}
            description={`Revenue, expenses, and profit/loss movement from posted vouchers for ${period.label.toLowerCase()}.`}
            emptyDescription="Posted revenue and expense activity is required before this trend can render. For a populated supervisor demo, run corepack pnpm seed:demo and then corepack pnpm seed:demo:verify."
            emptyTitle="No posted accounting movement"
            footer={<DemoScopeNote companySlug={companySlug} />}
            format="currency"
            insight="Posted-voucher performance uses revenue, expense, and net result side by side."
            series={[
              { key: 'revenue', label: 'Revenue', tone: 'revenue' },
              { key: 'expenses', label: 'Expenses', tone: 'expense' },
              { key: 'profitLoss', label: 'Net profit/loss', tone: 'balance' },
            ]}
            title="Business performance"
          />
        ) : null}

        {analytics.financial ? (
          <AnalyticsCard
            description="Contracted sales and collected sales from CRM/property records in the selected dashboard period."
            footer={<DemoScopeNote companySlug={companySlug} />}
            title="Sales and collections"
          >
            <TrendBarChart
              data={analytics.financial.salesCollectionsTrend}
              emptyDescription="Sale contracts or collection rows are required before this trend can render."
              emptyTitle="No sales or collection movement"
              format="currency"
              series={[
                { key: 'contractedSales', label: 'Contracted sales' },
                { key: 'collectedSales', label: 'Collected sales' },
              ]}
            />
            <DistributionBarList
              data={analytics.financial.revenueExpense}
              emptyDescription="Posted revenue and expense activity is required before this comparison can render."
              emptyTitle="No P&L movement"
              format="currency"
            />
          </AnalyticsCard>
        ) : null}

        {analytics.accounting ? (
          <AnalyticsCard
            description="Draft, posted, and control workload from the existing accounting voucher endpoint."
            footer={
              <SampleScopeNote
                noun="vouchers"
                sample={analytics.accounting.voucherSample}
              />
            }
            title="Accounting workload"
          >
            <MetricCardGrid items={analytics.accounting.voucherWorkloadCards} />
            <DistributionBarList
              data={analytics.accounting.voucherStatusDistribution}
              emptyDescription="Voucher status counts will appear when voucher records exist."
              emptyTitle="No vouchers found"
            />
          </AnalyticsCard>
        ) : null}

        {analytics.property ? (
          <AnalyticsCard
            description="Current unit inventory status using the existing unit status catalog and unit list APIs."
            footer={<DemoScopeNote companySlug={companySlug} />}
            title="Unit status"
          >
            <MetricCardGrid items={analytics.property.inventoryStatusCards} />
            <DistributionBarList
              data={analytics.property.unitStatusDistribution}
              emptyDescription="Unit status distribution needs unit records in the active company."
              emptyTitle="No unit inventory"
            />
          </AnalyticsCard>
        ) : null}

        {analytics.crm ? (
          <AnalyticsCard
            description="Pipeline volume, contract value, and collections activity from CRM/property desk list APIs."
            footer={
              <SampleScopeNote
                noun="collections"
                sample={analytics.crm.collectionSample}
              />
            }
            title="Commercial progress"
          >
            <MetricCardGrid
              format="currency"
              items={analytics.crm.commercialValueCards}
            />
            <DistributionBarList
              data={analytics.crm.bookingContractFunnel}
              emptyDescription="Lead, booking, contract, or collection records are required for the funnel."
              emptyTitle="No CRM funnel data"
            />
            <TrendBarChart
              data={analytics.crm.collectionTrend}
              emptyDescription="Collection amounts will appear when collection records exist in the selected period."
              emptyTitle="No collection trend"
              format="currency"
              series={[{ key: 'collections', label: 'Collections' }]}
            />
          </AnalyticsCard>
        ) : null}

        {analytics.hr ? (
          <AnalyticsCard
            description="Headcount coverage, leave queue, and attendance activity from HR list endpoints."
            footer={
              <SampleScopeNote
                noun="attendance logs"
                sample={analytics.hr.attendanceSample}
              />
            }
            title="People activity"
          >
            <MetricCardGrid items={analytics.hr.peopleCoverageCards} />
            <DistributionBarList
              data={analytics.hr.leaveStatusDistribution}
              emptyDescription="Leave status counts will appear when leave requests exist."
              emptyTitle="No leave requests"
            />
            <TrendBarChart
              data={analytics.hr.attendanceTrend}
              emptyDescription="Attendance daily activity needs attendance log records."
              emptyTitle="No attendance activity"
              series={[
                { key: 'in', label: 'In' },
                { key: 'out', label: 'Out' },
                { key: 'unknown', label: 'Unknown' },
              ]}
            />
          </AnalyticsCard>
        ) : null}

        {analytics.payroll ? (
          <AnalyticsCard
            description="Payroll run readiness and amount trend from existing payroll run records."
            footer={
              <SampleScopeNote
                noun="payroll runs"
                sample={analytics.payroll.payrollRunSample}
              />
            }
            title="Payroll status"
          >
            <MetricCardGrid items={analytics.payroll.payrollPostingCards} />
            <DistributionBarList
              data={analytics.payroll.payrollRunStatusDistribution}
              emptyDescription="Payroll run statuses will appear when payroll runs exist."
              emptyTitle="No payroll runs"
            />
            <TrendBarChart
              data={analytics.payroll.payrollAmountTrend}
              emptyDescription="Payroll amount trends require payroll runs with totals."
              emptyTitle="No payroll trend"
              format="currency"
              series={[
                { key: 'gross', label: 'Gross' },
                { key: 'deductions', label: 'Deductions' },
                { key: 'net', label: 'Net' },
              ]}
            />
          </AnalyticsCard>
        ) : null}

        {analytics.documents ? (
          <AnalyticsCard
            description="File readiness, active links, and audit category mix from attachment and audit endpoints."
            footer={
              <SampleScopeNote
                noun="audit events"
                sample={analytics.documents.auditEventSample}
              />
            }
            title="Documents and audit"
          >
            <MetricCardGrid items={analytics.documents.documentCoverageCards} />
            <DistributionBarList
              data={analytics.documents.attachmentStatusDistribution}
              emptyDescription="Attachment status counts will appear when attachment records exist."
              emptyTitle="No attachment status data"
            />
            <DistributionBarList
              data={analytics.documents.auditCategoryDistribution}
              emptyDescription="Audit category counts will appear when audit events exist."
              emptyTitle="No audit category data"
            />
          </AnalyticsCard>
        ) : null}
      </AnalyticsGrid>
    </div>
  );
};

export const AccountingAnalyticsPanel = ({
  companyId,
  companySlug,
  enabled,
  period,
}: {
  companyId: string | undefined;
  companySlug?: string | undefined;
  enabled: boolean;
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'> | undefined;
}) => {
  const query = useAccountingAnalytics(companyId, enabled, period);

  if (query.isPending && !query.data) {
    return <AnalyticsLoadingState label="Loading accounting analytics." />;
  }

  if (query.isError) {
    return (
      <AnalyticsEmptyState
        description="Accounting analytics could not be loaded from the existing endpoints."
        showDemoHint={false}
        title="Accounting analytics unavailable"
      />
    );
  }

  const data = query.data;

  if (!data) {
    return null;
  }

  return (
    <div data-testid="accounting-operational-analytics">
      <AnalyticsGrid>
        <KpiTrendCard
          data={data.monthlyVoucherMovement}
          description="Draft and posted voucher workload with debit and credit movement from the voucher list."
          emptyDescription="Monthly movement needs voucher rows in the selected period."
          emptyTitle="No voucher movement"
          footer={<SampleScopeNote noun="vouchers" sample={data.voucherSample} />}
          format="currency"
          insight="Draft visibility and balanced debit/credit movement stay visible before users open individual vouchers."
          metricFormat="number"
          metrics={data.voucherWorkloadCards}
          series={[
            { key: 'debit', label: 'Debit', tone: 'balance' },
            { key: 'credit', label: 'Credit', tone: 'revenue' },
          ]}
          title="Voucher control"
        />
        <AnalyticsCard
          description="Chart depth and voucher type mix from the current company scope."
          footer={<DemoScopeNote companySlug={companySlug} />}
          title="Accounting structure"
        >
          <MetricCardGrid items={data.accountStructure} />
          <DistributionBarList
            data={data.voucherTypeDistribution}
            emptyDescription="Voucher type counts will appear when voucher records exist."
            emptyTitle="No voucher type data"
          />
        </AnalyticsCard>
        <DistributionChartCard
          data={data.voucherStatusDistribution}
          description="Draft versus posted state is the primary operational control before financial reports consume posted records."
          emptyDescription="Voucher status counts will appear when voucher records exist."
          emptyTitle="No voucher status data"
          footer={<DemoScopeNote companySlug={companySlug} />}
          title="Draft versus posted"
        />
        <MiniReportTableCard
          description="Small control table derived from existing voucher totals and status fields."
          emptyDescription="Accounting control rows will appear when voucher records exist."
          emptyTitle="No accounting control rows"
          footer={<SampleScopeNote noun="vouchers" sample={data.voucherSample} />}
          rows={data.accountingAttentionRows}
          title="Needs attention"
        />
        <MiniReportTableCard
          description="Latest posted vouchers with debit totals from the voucher list sample."
          emptyDescription="Recent postings will appear once vouchers are posted."
          emptyTitle="No recent posted vouchers"
          footer={<SampleScopeNote noun="vouchers" sample={data.voucherSample} />}
          format="currency"
          rows={data.recentPostingRows}
          title="Recent posting activity"
        />
      </AnalyticsGrid>
    </div>
  );
};

export const ProjectPropertyAnalyticsPanel = ({
  companyId,
  companySlug,
  enabled,
}: {
  companyId: string | undefined;
  companySlug?: string | undefined;
  enabled: boolean;
}) => {
  const query = useProjectPropertyAnalytics(companyId, enabled);

  if (query.isPending && !query.data) {
    return <AnalyticsLoadingState label="Loading project/property analytics." />;
  }

  if (!query.data) {
    return null;
  }

  return (
    <div data-testid="project-property-operational-analytics">
      <AnalyticsGrid>
        <AnalyticsCard
          description="Inventory readiness across available, booked, sold, and allotted unit states."
          footer={<DemoScopeNote companySlug={companySlug} />}
          title="Inventory command center"
        >
          <MetricCardGrid items={query.data.inventoryStatusCards} />
          <DistributionBarList
            data={query.data.unitStatusDistribution}
            emptyDescription="Unit status distribution needs unit records in the active company."
            emptyTitle="No unit inventory"
          />
        </AnalyticsCard>
        <AnalyticsCard
          description="Master-data coverage for the project hierarchy that drives unit operations."
          footer={<DemoScopeNote companySlug={companySlug} />}
          title="Project hierarchy coverage"
        >
          <MetricCardGrid items={query.data.masterDataCards} />
          <DistributionBarList
            data={query.data.projectStatusDistribution}
            emptyDescription="Project status counts will appear when project records exist."
            emptyTitle="No project status data"
          />
        </AnalyticsCard>
        <DistributionChartCard
          data={query.data.unitsByProject}
          description="Sampled inventory grouped by project, useful for seeing where operational volume sits."
          emptyDescription="Units by project will appear when unit records exist."
          emptyTitle="No project distribution"
          footer={<SampleScopeNote noun="units" sample={query.data.unitSample} />}
          title="Units by project"
        />
        <DistributionChartCard
          data={query.data.unitsByUnitType}
          description="Sampled inventory grouped by type for apartment, commercial, plot, or other configured unit types."
          emptyDescription="Units by type will appear when unit records exist."
          emptyTitle="No unit-type distribution"
          footer={<SampleScopeNote noun="units" sample={query.data.unitSample} />}
          title="Units by type"
        />
        <MiniReportTableCard
          description="Top active inventory concentrations from the latest unit records."
          emptyDescription="Project inventory rows will appear when units exist."
          emptyTitle="No project inventory rows"
          rows={query.data.topProjectInventoryRows}
          title="Top project inventory"
        />
      </AnalyticsGrid>
    </div>
  );
};

export const CrmAnalyticsPanel = ({
  companyId,
  companySlug,
  enabled,
  period,
}: {
  companyId: string | undefined;
  companySlug?: string | undefined;
  enabled: boolean;
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'> | undefined;
}) => {
  const query = useCrmAnalytics(companyId, enabled, period);

  if (query.isPending && !query.data) {
    return <AnalyticsLoadingState label="Loading CRM analytics." />;
  }

  if (!query.data) {
    return null;
  }

  return (
    <div data-testid="crm-operational-analytics">
      <AnalyticsGrid>
        <AnalyticsCard
          description="Customer, lead, booking, contract, and collection volume from CRM/property desk APIs."
          footer={<DemoScopeNote companySlug={companySlug} />}
          title="CRM pipeline"
        >
          <MetricCardGrid items={query.data.commercialActivityCards} />
          <DistributionBarList
            data={query.data.leadStatusDistribution}
            emptyDescription="Lead status counts will appear when leads exist."
            emptyTitle="No lead status data"
          />
        </AnalyticsCard>
        <AnalyticsCard
          description="Booking-to-contract progress and installment follow-up state from existing records."
          footer={
            <SampleScopeNote
              noun="installments"
              sample={query.data.installmentSample}
            />
          }
          title="Booking and installment risk"
        >
          <DistributionBarList
            data={query.data.bookingStatusDistribution}
            emptyDescription="Booking statuses will appear when bookings exist."
            emptyTitle="No booking status data"
          />
          <DistributionBarList
            data={query.data.installmentStateDistribution}
            emptyDescription="Installment due and overdue counts will appear when schedules exist."
            emptyTitle="No installment state data"
          />
        </AnalyticsCard>
        <KpiTrendCard
          data={query.data.collectionTrend}
          description="Contracted value, collected value, and open installment balance from existing CRM records."
          emptyDescription="Collection trend needs collection records in the selected period."
          emptyTitle="No collection movement"
          footer={
            <>
              <SampleScopeNote
                noun="contracts"
                sample={query.data.saleContractSample}
              />{' '}
              <SampleScopeNote
                noun="collections"
                sample={query.data.collectionSample}
              />
            </>
          }
          format="currency"
          insight="Contract value and collection movement stay side by side without adding new calculations on the backend."
          metricFormat="currency"
          metrics={query.data.commercialValueCards}
          series={[{ key: 'collections', label: 'Collections', tone: 'sales' }]}
          title="Sales value and collections"
        />
        <DistributionChartCard
          data={query.data.bookingContractFunnel}
          description="Count-based funnel from leads through bookings, contracts, and collection records."
          emptyDescription="The funnel needs lead, booking, contract, or collection records."
          emptyTitle="No funnel data"
          title="Commercial funnel"
        />
        <MiniReportTableCard
          description="Operational follow-up rows derived from booking, installment, and collection list filters."
          emptyDescription="CRM follow-up rows will appear when CRM records exist."
          emptyTitle="No CRM follow-up rows"
          rows={query.data.crmAttentionRows}
          title="Customer movement and follow-up"
        />
      </AnalyticsGrid>
    </div>
  );
};

export const HrAnalyticsPanel = ({
  companyId,
  companySlug,
  enabled,
  period,
}: {
  companyId: string | undefined;
  companySlug?: string | undefined;
  enabled: boolean;
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'> | undefined;
}) => {
  const query = useHrAnalytics(companyId, enabled, period);

  if (query.isPending && !query.data) {
    return <AnalyticsLoadingState label="Loading HR analytics." />;
  }

  if (!query.data) {
    return null;
  }

  return (
    <div data-testid="hr-operational-analytics">
      <AnalyticsGrid>
        <AnalyticsCard
          description="Headcount, device mapping, attendance-device coverage, and submitted leave workload."
          footer={
            <>
              <SampleScopeNote noun="employees" sample={query.data.employeeSample} />{' '}
              <DemoScopeNote companySlug={companySlug} />
            </>
          }
          title="People coverage"
        >
          <MetricCardGrid items={query.data.peopleCoverageCards} />
          <DistributionBarList
            data={query.data.employeesByDepartment}
            emptyDescription="Department distribution needs employee records with department links."
            emptyTitle="No department distribution"
          />
        </AnalyticsCard>
        <AnalyticsCard
          description="Employee location spread and leave-review state from existing HR list endpoints."
          footer={
            <SampleScopeNote noun="employees" sample={query.data.employeeSample} />
          }
          title="Location and leave queues"
        >
          <DistributionBarList
            data={query.data.employeesByLocation}
            emptyDescription="Location distribution needs employee records with location links."
            emptyTitle="No location distribution"
          />
          <DistributionBarList
            data={query.data.leaveStatusDistribution}
            emptyDescription="Leave status counts will appear when leave requests exist."
            emptyTitle="No leave status data"
          />
        </AnalyticsCard>
        <AnalyticsCard
          description="Attendance direction mix and day-level activity from attendance logs in the selected period."
          footer={
            <SampleScopeNote
              noun="attendance logs"
              sample={query.data.attendanceSample}
            />
          }
          title="Attendance movement"
        >
          <DistributionBarList
            data={query.data.attendanceDirectionDistribution}
            emptyDescription="Attendance directions will appear when attendance logs exist."
            emptyTitle="No attendance direction data"
          />
          <TrendBarChart
            data={query.data.attendanceTrend}
            emptyDescription="Attendance trend needs attendance log rows in the selected period."
            emptyTitle="No attendance trend"
            series={[
              { key: 'in', label: 'In', tone: 'hr' },
              { key: 'out', label: 'Out', tone: 'payroll' },
              { key: 'unknown', label: 'Unknown', tone: 'warning' },
            ]}
          />
        </AnalyticsCard>
        <MiniReportTableCard
          description="Read-only HR attention rows for leave review, mapping coverage, and attendance traffic."
          emptyDescription="HR attention rows will appear when HR records exist."
          emptyTitle="No HR attention rows"
          footer={
            <SampleScopeNote
              noun="device mappings"
              sample={query.data.deviceMappingSample}
            />
          }
          rows={query.data.hrAttentionRows}
          title="HR needs attention"
        />
      </AnalyticsGrid>
    </div>
  );
};

export const PayrollAnalyticsPanel = ({
  companyId,
  companySlug,
  enabled,
}: {
  companyId: string | undefined;
  companySlug?: string | undefined;
  enabled: boolean;
}) => {
  const query = usePayrollAnalytics(companyId, enabled);

  if (query.isPending && !query.data) {
    return <AnalyticsLoadingState label="Loading payroll analytics." />;
  }

  if (!query.data) {
    return null;
  }

  return (
    <div data-testid="payroll-operational-analytics">
      <AnalyticsGrid>
        <AnalyticsCard
          description="Salary structure, employee, and payroll run workload from existing payroll APIs."
          footer={
            <>
              <SampleScopeNote
                noun="salary structures"
                sample={query.data.salaryStructureSample}
              />{' '}
              <DemoScopeNote companySlug={companySlug} />
            </>
          }
          title="Payroll workload"
        >
          <MetricCardGrid items={query.data.payrollWorkloadCards} />
          <DistributionBarList
            data={query.data.payrollRunStatusDistribution}
            emptyDescription="Payroll run status counts will appear when payroll runs exist."
            emptyTitle="No payroll status data"
          />
        </AnalyticsCard>
        <AnalyticsCard
          description="Posting readiness split between draft, finalized, posted, and cancelled run states."
          footer={<DemoScopeNote companySlug={companySlug} />}
          title="Posting readiness"
        >
          <MetricCardGrid items={query.data.payrollPostingCards} />
          <DistributionBarList
            data={query.data.payrollScopeDistribution}
            emptyDescription="Payroll scope distribution appears when runs have project or cost-center context."
            emptyTitle="No payroll scope data"
          />
        </AnalyticsCard>
        <KpiTrendCard
          data={query.data.payrollAmountTrend}
          description="Gross, deduction, and net movement grouped by payroll period from existing run totals."
          emptyDescription="Payroll amount trend needs payroll runs with totals."
          emptyTitle="No payroll amount trend"
          footer={
            <SampleScopeNote
              noun="payroll runs"
              sample={query.data.payrollRunSample}
            />
          }
          format="currency"
          insight="Gross, deductions, and net pay remain visible as text and trend bars."
          metricFormat="currency"
          metrics={query.data.payrollAmountSummary}
          series={[
            { key: 'gross', label: 'Gross', tone: 'payroll' },
            { key: 'deductions', label: 'Deductions', tone: 'expense' },
            { key: 'net', label: 'Net', tone: 'revenue' },
          ]}
          title="Payroll period trend"
        />
        <MiniReportTableCard
          description="Latest payroll periods with net pay and run state for quick operational review."
          emptyDescription="Payroll run rows will appear when runs exist."
          emptyTitle="No payroll run rows"
          footer={
            <SampleScopeNote
              noun="payroll runs"
              sample={query.data.payrollRunSample}
            />
          }
          format="currency"
          rows={query.data.payrollRunRows}
          title="Recent payroll periods"
        />
      </AnalyticsGrid>
    </div>
  );
};

export const AuditDocumentAnalyticsPanel = ({
  companyId,
  companySlug,
  enabled,
  period,
}: {
  companyId: string | undefined;
  companySlug?: string | undefined;
  enabled: boolean;
  period?: Pick<DashboardPeriod, 'dateFrom' | 'dateTo'> | undefined;
}) => {
  const query = useAuditDocumentAnalytics(companyId, enabled, period);

  if (query.isPending && !query.data) {
    return <AnalyticsLoadingState label="Loading document and audit analytics." />;
  }

  if (!query.data) {
    return null;
  }

  return (
    <div data-testid="audit-documents-operational-analytics">
      <AnalyticsGrid>
        <AnalyticsCard
          description="Attachment readiness, active links, and audit event volume from existing document APIs."
          footer={
            <>
              <SampleScopeNote
                noun="attachments"
                sample={query.data.attachmentSample}
              />{' '}
              <DemoScopeNote companySlug={companySlug} />
            </>
          }
          title="Document coverage"
        >
          <MetricCardGrid items={query.data.documentCoverageCards} />
          <DistributionBarList
            data={query.data.attachmentStatusDistribution}
            emptyDescription="Attachment statuses will appear when attachment records exist."
            emptyTitle="No attachment status data"
          />
        </AnalyticsCard>
        <AnalyticsCard
          description="Linked entity coverage and recent upload/finalize activity from attachment metadata."
          footer={
            <SampleScopeNote
              noun="attachments"
              sample={query.data.attachmentSample}
            />
          }
          title="Attachment movement"
        >
          <DistributionBarList
            data={query.data.attachmentEntityDistribution}
            emptyDescription="Linked entity distribution needs active attachment links."
            emptyTitle="No attachment links"
          />
          <TrendBarChart
            data={query.data.attachmentActivityTrend}
            emptyDescription="Upload activity will appear when attachment records exist."
            emptyTitle="No attachment activity"
            series={[
              { key: 'uploads', label: 'Uploads', tone: 'documents' },
              { key: 'available', label: 'Available', tone: 'revenue' },
            ]}
          />
        </AnalyticsCard>
        <AnalyticsCard
          description="Audit event category, event-type mix, and daily activity from the audit endpoint."
          footer={
            <SampleScopeNote noun="audit events" sample={query.data.auditEventSample} />
          }
          title="Audit activity"
        >
          <DistributionBarList
            data={query.data.auditCategoryDistribution}
            emptyDescription="Audit categories will appear when audit events exist."
            emptyTitle="No audit category data"
          />
          <DistributionBarList
            data={query.data.auditEventTypeDistribution}
            emptyDescription="Audit event types will appear when audit events exist."
            emptyTitle="No audit event type data"
          />
          <TrendBarChart
            data={query.data.auditActivityTrend}
            emptyDescription="Audit activity trend needs audit events in the selected period."
            emptyTitle="No audit trend"
            series={[{ key: 'events', label: 'Events', tone: 'audit' }]}
          />
        </AnalyticsCard>
        <MiniReportTableCard
          description="Read-only document and audit follow-up signals from existing metadata."
          emptyDescription="Document follow-up rows will appear when attachment or audit records exist."
          emptyTitle="No document follow-up rows"
          rows={query.data.auditAttentionRows}
          title="Document needs attention"
        />
      </AnalyticsGrid>
    </div>
  );
};
