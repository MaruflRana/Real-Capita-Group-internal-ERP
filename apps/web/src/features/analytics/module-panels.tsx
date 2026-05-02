'use client';

import {
  AnalyticsCard,
  AnalyticsEmptyState,
  AnalyticsGrid,
  AnalyticsIssueBanner,
  AnalyticsLoadingState,
  DistributionBarList,
  KpiTrendCard,
  MetricCardGrid,
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
            emptyDescription="Posted revenue and expense activity is required before this trend can render."
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
            description="Voucher state and type mix from the existing accounting voucher endpoint."
            footer={
              <SampleScopeNote
                noun="vouchers"
                sample={analytics.accounting.voucherSample}
              />
            }
            title="Voucher distribution"
          >
            <DistributionBarList
              data={analytics.accounting.voucherStatusDistribution}
              emptyDescription="Voucher status counts will appear when voucher records exist."
              emptyTitle="No vouchers found"
            />
            <DistributionBarList
              data={analytics.accounting.voucherTypeDistribution}
              emptyDescription="Voucher type counts will appear when voucher records exist."
              emptyTitle="No voucher types found"
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
            description="Sales pipeline and collections activity from CRM/property desk list APIs."
            footer={
              <SampleScopeNote
                noun="collections"
                sample={analytics.crm.collectionSample}
              />
            }
            title="Commercial progress"
          >
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
            description="Leave and attendance activity from HR list endpoints."
            footer={
              <SampleScopeNote
                noun="attendance logs"
                sample={analytics.hr.attendanceSample}
              />
            }
            title="People activity"
          >
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
            description="Payroll run state and amount trend from existing payroll run records."
            footer={
              <SampleScopeNote
                noun="payroll runs"
                sample={analytics.payroll.payrollRunSample}
              />
            }
            title="Payroll status"
          >
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
            description="Document state and audit category mix from attachment and audit endpoints."
            footer={
              <SampleScopeNote
                noun="audit events"
                sample={analytics.documents.auditEventSample}
              />
            }
            title="Documents and audit"
          >
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
    <AnalyticsGrid>
      <AnalyticsCard
        description="Chart depth and voucher status counts from the current company scope."
        footer={<DemoScopeNote companySlug={companySlug} />}
        title="Accounting status"
      >
        <MetricCardGrid items={data.accountStructure} />
        <DistributionBarList
          data={data.voucherStatusDistribution}
          emptyDescription="Voucher status counts will appear when voucher records exist."
          emptyTitle="No voucher status data"
        />
      </AnalyticsCard>
      <AnalyticsCard
        description="Voucher type mix and monthly debit/credit movement from existing voucher list data."
        footer={<SampleScopeNote noun="vouchers" sample={data.voucherSample} />}
        title="Voucher movement"
      >
        <DistributionBarList
          data={data.voucherTypeDistribution}
          emptyDescription="Voucher type counts will appear when voucher records exist."
          emptyTitle="No voucher type data"
        />
        <TrendBarChart
          data={data.monthlyVoucherMovement}
          emptyDescription="Monthly movement needs voucher rows in the selected period."
          emptyTitle="No voucher movement"
          format="currency"
          series={[
            { key: 'debit', label: 'Debit' },
            { key: 'credit', label: 'Credit' },
          ]}
        />
      </AnalyticsCard>
    </AnalyticsGrid>
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
    <AnalyticsGrid>
      <AnalyticsCard
        description="Unit availability, booking, and sold states from the active company inventory."
        footer={<DemoScopeNote companySlug={companySlug} />}
        title="Inventory status"
      >
        <MetricCardGrid items={query.data.inventoryStatusCards} />
        <DistributionBarList
          data={query.data.unitStatusDistribution}
          emptyDescription="Unit status distribution needs unit records in the active company."
          emptyTitle="No unit inventory"
        />
      </AnalyticsCard>
      <AnalyticsCard
        description="Project and unit-type grouping from the latest unit list page."
        footer={<SampleScopeNote noun="units" sample={query.data.unitSample} />}
        title="Inventory mix"
      >
        <DistributionBarList
          data={query.data.unitsByProject}
          emptyDescription="Units by project will appear when unit records exist."
          emptyTitle="No project distribution"
        />
        <DistributionBarList
          data={query.data.unitsByUnitType}
          emptyDescription="Units by type will appear when unit records exist."
          emptyTitle="No unit-type distribution"
        />
      </AnalyticsCard>
    </AnalyticsGrid>
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
    <AnalyticsGrid>
      <AnalyticsCard
        description="Lead status, booking status, and conversion progress from existing CRM data."
        footer={<DemoScopeNote companySlug={companySlug} />}
        title="Pipeline status"
      >
        <MetricCardGrid
          items={[{ key: 'customers', label: 'Customers', value: query.data.customerCount }]}
        />
        <DistributionBarList
          data={query.data.leadStatusDistribution}
          emptyDescription="Lead status counts will appear when leads exist."
          emptyTitle="No lead status data"
        />
        <DistributionBarList
          data={query.data.bookingContractFunnel}
          emptyDescription="The funnel needs lead, booking, contract, or collection records."
          emptyTitle="No funnel data"
        />
      </AnalyticsCard>
      <AnalyticsCard
        description="Installment due state and collection amount trend from existing CRM endpoints."
        footer={
          <SampleScopeNote noun="collections" sample={query.data.collectionSample} />
        }
        title="Collections and installments"
      >
        <DistributionBarList
          data={query.data.installmentStateDistribution}
          emptyDescription="Installment due and overdue counts will appear when schedules exist."
          emptyTitle="No installment state data"
        />
        <TrendBarChart
          data={query.data.collectionTrend}
          emptyDescription="Collection trend needs collection records in the selected period."
          emptyTitle="No collection movement"
          format="currency"
          series={[{ key: 'collections', label: 'Collections' }]}
        />
      </AnalyticsCard>
    </AnalyticsGrid>
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
    <AnalyticsGrid>
      <AnalyticsCard
        description="Employee grouping from the employee list, plus leave status counts."
        footer={
          <>
            <SampleScopeNote noun="employees" sample={query.data.employeeSample} />{' '}
            <DemoScopeNote companySlug={companySlug} />
          </>
        }
        title="Employee and leave status"
      >
        <MetricCardGrid
          items={[
            {
              key: 'employees',
              label: 'Employees',
              value: query.data.employeeCount,
            },
          ]}
        />
        <DistributionBarList
          data={query.data.employeesByDepartment}
          emptyDescription="Department distribution needs employee records with department links."
          emptyTitle="No department distribution"
        />
        <DistributionBarList
          data={query.data.leaveStatusDistribution}
          emptyDescription="Leave status counts will appear when leave requests exist."
          emptyTitle="No leave status data"
        />
      </AnalyticsCard>
      <AnalyticsCard
        description="Daily attendance activity from attendance log records in the selected period."
        footer={
          <SampleScopeNote
            noun="attendance logs"
            sample={query.data.attendanceSample}
          />
        }
        title="Attendance trend"
      >
        <TrendBarChart
          data={query.data.attendanceTrend}
          emptyDescription="Attendance trend needs attendance log rows in the selected period."
          emptyTitle="No attendance trend"
          series={[
            { key: 'in', label: 'In' },
            { key: 'out', label: 'Out' },
            { key: 'unknown', label: 'Unknown' },
          ]}
        />
      </AnalyticsCard>
    </AnalyticsGrid>
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
    <AnalyticsGrid>
      <AnalyticsCard
        description="Run status and salary-structure coverage from the existing payroll APIs."
        footer={<DemoScopeNote companySlug={companySlug} />}
        title="Payroll run status"
      >
        <MetricCardGrid
          items={[
            {
              key: 'salary-structures',
              label: 'Salary structures',
              value: query.data.salaryStructureCount,
            },
          ]}
        />
        <DistributionBarList
          data={query.data.payrollRunStatusDistribution}
          emptyDescription="Payroll run status counts will appear when payroll runs exist."
          emptyTitle="No payroll status data"
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
        title="Payroll amount trend"
      />
    </AnalyticsGrid>
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
    <AnalyticsGrid>
      <AnalyticsCard
        description="Attachment state and linked-entity mix from the attachment metadata API."
        footer={
          <>
            <SampleScopeNote
              noun="attachments"
              sample={query.data.attachmentSample}
            />{' '}
            <DemoScopeNote companySlug={companySlug} />
          </>
        }
        title="Attachment status"
      >
        <DistributionBarList
          data={query.data.attachmentStatusDistribution}
          emptyDescription="Attachment statuses will appear when attachment records exist."
          emptyTitle="No attachment status data"
        />
        <DistributionBarList
          data={query.data.attachmentEntityDistribution}
          emptyDescription="Linked entity distribution needs active attachment links."
          emptyTitle="No attachment links"
        />
      </AnalyticsCard>
      <AnalyticsCard
        description="Audit event category mix and recent activity from the audit event endpoint."
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
        <TrendBarChart
          data={query.data.auditActivityTrend}
          emptyDescription="Audit activity trend needs audit events in the selected period."
          emptyTitle="No audit trend"
          series={[{ key: 'events', label: 'Events' }]}
        />
      </AnalyticsCard>
    </AnalyticsGrid>
  );
};
