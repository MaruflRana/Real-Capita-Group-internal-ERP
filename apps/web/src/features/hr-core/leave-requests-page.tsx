'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { Select } from '../../components/ui/select';
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
import type {
  LeaveRequestRecord,
  LeaveRequestStatus,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import {
  LeaveRequestActionPanel,
  LeaveRequestDetailPanel,
  LeaveRequestFormPanel,
  type LeaveRequestDecisionFormValues,
  type LeaveRequestFormValues,
} from './forms';
import {
  useEmployees,
  useHrDepartments,
  useHrLocations,
  useLeaveRequest,
  useLeaveRequestAction,
  useLeaveRequests,
  useLeaveTypes,
  useSaveLeaveRequest,
} from './hooks';
import {
  HrCoreAccessRequiredState,
  HrCoreFilterCard,
  HrCorePageHeader,
  HrCoreQueryErrorBanner,
  HrCoreReadOnlyNotice,
  HrCoreSection,
  LeaveRequestStatusBadge,
} from './shared';
import {
  getDepartmentLabel,
  getEmployeeLabel,
  getLeaveTypeLabel,
  getLocationLabel,
  normalizeOptionalTextToNull,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

type PanelMode = 'create' | 'detail' | null;

export const LeaveRequestsPage = () => {
  const { canAccessHr, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessHr && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | LeaveRequestStatus>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedLeaveRequest, setSelectedLeaveRequest] =
    useState<LeaveRequestRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'startDate',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(employeeFilter ? { employeeId: employeeFilter } : {}),
      ...(leaveTypeFilter ? { leaveTypeId: leaveTypeFilter } : {}),
      ...(departmentFilter ? { departmentId: departmentFilter } : {}),
      ...(locationFilter ? { locationId: locationFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [
      dateFrom,
      dateTo,
      deferredSearch,
      departmentFilter,
      employeeFilter,
      leaveTypeFilter,
      locationFilter,
      page,
      statusFilter,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [
    dateFrom,
    dateTo,
    deferredSearch,
    departmentFilter,
    employeeFilter,
    leaveTypeFilter,
    locationFilter,
    statusFilter,
  ]);

  const employeeOptionsQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'fullName',
      sortOrder: 'asc' as const,
    }),
    [],
  );
  const leaveTypeOptionsQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc' as const,
    }),
    [],
  );
  const orgReferenceQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc' as const,
      isActive: true,
    }),
    [],
  );

  const employeesQuery = useEmployees(companyId, employeeOptionsQuery, isEnabled);
  const leaveTypesQuery = useLeaveTypes(companyId, leaveTypeOptionsQuery, isEnabled);
  const departmentsQuery = useHrDepartments(companyId, orgReferenceQuery, isEnabled);
  const locationsQuery = useHrLocations(companyId, orgReferenceQuery, isEnabled);
  const leaveRequestsQuery = useLeaveRequests(companyId, listQuery, isEnabled);
  const leaveRequestDetailQuery = useLeaveRequest(
    companyId,
    selectedLeaveRequest?.id ?? '',
    isEnabled && panelMode === 'detail' && Boolean(selectedLeaveRequest?.id),
  );
  const saveLeaveRequestMutation = useSaveLeaveRequest(companyId);
  const leaveRequestActionMutation = useLeaveRequestAction(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessHr) {
    return <HrCoreAccessRequiredState />;
  }

  const leaveRequestForDetail = leaveRequestDetailQuery.data ?? selectedLeaveRequest;
  const buildPayload = (values: LeaveRequestFormValues) => ({
    employeeId: values.employeeId,
    leaveTypeId: values.leaveTypeId,
    startDate: values.startDate,
    endDate: values.endDate,
    reason: normalizeOptionalTextToNull(values.reason),
  });

  return (
    <div className="space-y-6">
      <HrCorePageHeader
        title="Leave Requests"
        description="Operate the company-scoped leave management baseline with draft, submit, approve, reject, and cancel actions against real backend lifecycle rules."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <Button
            onClick={() => {
              setActionError(null);
              setSelectedLeaveRequest(null);
              setPanelMode('create');
            }}
          >
            New leave request
          </Button>
        }
      />

      {actionError ? <HrCoreQueryErrorBanner message={actionError} /> : null}

      <HrCoreSection
        title="Leave request list"
        description="Filter leave requests by employee, leave type, department, location, lifecycle status, and overlapping date range."
      >
        <HrCoreFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="leave-request-search">Search</Label>
            <Input
              id="leave-request-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leave requests by reason, decision note, employee, or leave type"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-request-employee-filter">Employee</Label>
            <Select
              id="leave-request-employee-filter"
              onChange={(event) => setEmployeeFilter(event.target.value)}
              value={employeeFilter}
            >
              <option value="">All employees</option>
              {employeesQuery.data?.items.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {getEmployeeLabel(employee)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-request-leave-type-filter">Leave type</Label>
            <Select
              id="leave-request-leave-type-filter"
              onChange={(event) => setLeaveTypeFilter(event.target.value)}
              value={leaveTypeFilter}
            >
              <option value="">All leave types</option>
              {leaveTypesQuery.data?.items.map((leaveType) => (
                <option key={leaveType.id} value={leaveType.id}>
                  {getLeaveTypeLabel(leaveType)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-request-department-filter">Department</Label>
            <Select
              id="leave-request-department-filter"
              onChange={(event) => setDepartmentFilter(event.target.value)}
              value={departmentFilter}
            >
              <option value="">All departments</option>
              {departmentsQuery.data?.items.map((department) => (
                <option key={department.id} value={department.id}>
                  {getDepartmentLabel(department)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-request-location-filter">Location</Label>
            <Select
              id="leave-request-location-filter"
              onChange={(event) => setLocationFilter(event.target.value)}
              value={locationFilter}
            >
              <option value="">All locations</option>
              {locationsQuery.data?.items.map((location) => (
                <option key={location.id} value={location.id}>
                  {getLocationLabel(location)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-request-status-filter">Status</Label>
            <Select
              id="leave-request-status-filter"
              onChange={(event) =>
                setStatusFilter(event.target.value as '' | LeaveRequestStatus)
              }
              value={statusFilter}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-request-date-from">Date from</Label>
            <Input
              id="leave-request-date-from"
              onChange={(event) => setDateFrom(event.target.value)}
              type="date"
              value={dateFrom}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leave-request-date-to">Date to</Label>
            <Input
              id="leave-request-date-to"
              onChange={(event) => setDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </div>
        </HrCoreFilterCard>

        {leaveRequestsQuery.isError && isApiError(leaveRequestsQuery.error) ? (
          <HrCoreQueryErrorBanner
            message={leaveRequestsQuery.error.apiError.message}
          />
        ) : null}

        {leaveRequestsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading leave requests.
          </div>
        ) : leaveRequestsQuery.data && leaveRequestsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave type / Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department / Location</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequestsQuery.data.items.map((leaveRequest) => (
                  <TableRow key={leaveRequest.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {leaveRequest.employeeCode}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {leaveRequest.employeeFullName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{leaveRequest.leaveTypeName}</p>
                        <p className="text-muted-foreground">
                          {leaveRequest.startDate === leaveRequest.endDate
                            ? leaveRequest.startDate
                            : `${leaveRequest.startDate} to ${leaveRequest.endDate}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <LeaveRequestStatusBadge status={leaveRequest.status} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{leaveRequest.departmentName || 'No department'}</p>
                        <p className="text-muted-foreground">
                          {leaveRequest.locationName || 'No location'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(leaveRequest.updatedAt)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => {
                          setActionError(null);
                          setSelectedLeaveRequest(leaveRequest);
                          setPanelMode('detail');
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={leaveRequestsQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No leave requests found"
            description="Create the first leave request or adjust the current filters to review existing leave workflow records."
          />
        )}
      </HrCoreSection>

      <SidePanel
        description={
          panelMode === 'create'
            ? 'Create a draft leave request linked to an existing active employee and leave type.'
            : 'Review or operate the selected leave request using the backend lifecycle rules for drafts and submitted requests.'
        }
        onClose={() => {
          setPanelMode(null);
          setSelectedLeaveRequest(null);
        }}
        open={panelMode !== null}
        title={panelMode === 'create' ? 'Create leave request' : 'Leave request detail'}
      >
        {panelMode === 'create' ? (
          <LeaveRequestFormPanel
            employees={employeesQuery.data?.items ?? []}
            isPending={saveLeaveRequestMutation.isPending}
            leaveRequest={null}
            leaveTypes={leaveTypesQuery.data?.items ?? []}
            onClose={() => {
              setPanelMode(null);
              setSelectedLeaveRequest(null);
            }}
            onSubmit={(values) =>
              saveLeaveRequestMutation
                .mutateAsync({ payload: buildPayload(values) })
                .then(() => {
                  setActionError(null);
                  setPanelMode(null);
                })
            }
            submitLabel="Create leave request"
          />
        ) : null}

        {panelMode === 'detail' && leaveRequestForDetail ? (
          <div className="space-y-6">
            {leaveRequestForDetail.status === 'DRAFT' ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <LeaveRequestStatusBadge status={leaveRequestForDetail.status} />
                </div>
                <LeaveRequestFormPanel
                  employees={employeesQuery.data?.items ?? []}
                  isPending={saveLeaveRequestMutation.isPending}
                  leaveRequest={leaveRequestForDetail}
                  leaveTypes={leaveTypesQuery.data?.items ?? []}
                  onClose={() => {
                    setPanelMode(null);
                    setSelectedLeaveRequest(null);
                  }}
                  onSubmit={(values) =>
                    saveLeaveRequestMutation
                      .mutateAsync({
                        leaveRequestId: leaveRequestForDetail.id,
                        payload: buildPayload(values),
                      })
                      .then(() => {
                        setActionError(null);
                      })
                  }
                  submitLabel="Save changes"
                />
                <div className="border-t border-border/70 pt-6">
                  <LeaveRequestActionPanel
                    isPending={leaveRequestActionMutation.isPending}
                    leaveRequest={leaveRequestForDetail}
                    onAction={(
                      action,
                      values: LeaveRequestDecisionFormValues,
                    ) =>
                      leaveRequestActionMutation
                        .mutateAsync({
                          leaveRequestId: leaveRequestForDetail.id,
                          action,
                          payload: {
                            decisionNote:
                              normalizeOptionalTextToNull(values.decisionNote),
                          },
                        })
                        .then(() => {
                          setActionError(null);
                        })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                {leaveRequestForDetail.status !== 'SUBMITTED' ? (
                  <HrCoreReadOnlyNotice
                    title="Protected request"
                    description="Approved, rejected, and cancelled requests stay read-only in this phase."
                  />
                ) : null}
                <LeaveRequestDetailPanel leaveRequest={leaveRequestForDetail} />
                <div className="border-t border-border/70 pt-6">
                  <LeaveRequestActionPanel
                    isPending={leaveRequestActionMutation.isPending}
                    leaveRequest={leaveRequestForDetail}
                    onAction={(
                      action,
                      values: LeaveRequestDecisionFormValues,
                    ) =>
                      leaveRequestActionMutation
                        .mutateAsync({
                          leaveRequestId: leaveRequestForDetail.id,
                          action,
                          payload: {
                            decisionNote:
                              normalizeOptionalTextToNull(values.decisionNote),
                          },
                        })
                        .then(() => {
                          setActionError(null);
                        })
                    }
                  />
                </div>
              </>
            )}
          </div>
        ) : null}
      </SidePanel>
    </div>
  );
};
