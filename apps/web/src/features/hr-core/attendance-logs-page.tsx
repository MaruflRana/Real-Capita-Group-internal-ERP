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
  AttendanceLogDirection,
  AttendanceLogRecord,
} from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import {
  AttendanceLogBulkPanel,
  AttendanceLogCreatePanel,
  AttendanceLogDetailPanel,
  type AttendanceLogBulkFormValues,
  type AttendanceLogCreateFormValues,
} from './forms';
import {
  useAttendanceDevices,
  useAttendanceLog,
  useAttendanceLogs,
  useBulkCreateAttendanceLogs,
  useCreateAttendanceLog,
  useDeviceUsers,
  useEmployees,
} from './hooks';
import {
  AttendanceDirectionBadge,
  HrCoreAccessRequiredState,
  HrCoreFilterCard,
  HrCorePageHeader,
  HrCoreQueryErrorBanner,
  HrCoreSection,
} from './shared';
import {
  getAttendanceDeviceLabel,
  getEmployeeLabel,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

type PanelMode = 'create' | 'bulk' | 'detail' | null;

const toIsoDateTime = (value: string) => new Date(value).toISOString();

export const AttendanceLogsPage = () => {
  const { canAccessHr, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessHr && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [attendanceDeviceFilter, setAttendanceDeviceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState<
    '' | AttendanceLogDirection
  >('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedLog, setSelectedLog] = useState<AttendanceLogRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'loggedAt',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(employeeFilter ? { employeeId: employeeFilter } : {}),
      ...(attendanceDeviceFilter
        ? { attendanceDeviceId: attendanceDeviceFilter }
        : {}),
      ...(locationFilter ? { locationId: locationFilter } : {}),
      ...(directionFilter ? { direction: directionFilter } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [
      attendanceDeviceFilter,
      dateFrom,
      dateTo,
      deferredSearch,
      directionFilter,
      employeeFilter,
      locationFilter,
      page,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [
    attendanceDeviceFilter,
    dateFrom,
    dateTo,
    deferredSearch,
    directionFilter,
    employeeFilter,
    locationFilter,
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
  const attendanceDeviceOptionsQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc' as const,
    }),
    [],
  );
  const deviceUserOptionsQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'deviceEmployeeCode',
      sortOrder: 'asc' as const,
      isActive: true,
    }),
    [],
  );

  const employeesQuery = useEmployees(companyId, employeeOptionsQuery, isEnabled);
  const attendanceDevicesQuery = useAttendanceDevices(
    companyId,
    attendanceDeviceOptionsQuery,
    isEnabled,
  );
  const deviceUsersQuery = useDeviceUsers(
    companyId,
    deviceUserOptionsQuery,
    isEnabled && panelMode !== 'detail',
  );
  const attendanceLogsQuery = useAttendanceLogs(companyId, listQuery, isEnabled);
  const attendanceLogDetailQuery = useAttendanceLog(
    companyId,
    selectedLog?.id ?? '',
    isEnabled && panelMode === 'detail' && Boolean(selectedLog?.id),
  );
  const createAttendanceLogMutation = useCreateAttendanceLog(companyId);
  const bulkCreateAttendanceLogsMutation = useBulkCreateAttendanceLogs(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessHr) {
    return <HrCoreAccessRequiredState />;
  }

  const attendanceLogForDetail = attendanceLogDetailQuery.data ?? selectedLog;

  return (
    <div className="space-y-6">
      <HrCorePageHeader
        title="Attendance Logs"
        description="Operate the HR attendance ingestion baseline with company-scoped filtering, manual entry, and bulk ingest against existing device mappings."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setActionError(null);
                setActionMessage(null);
                setPanelMode('create');
              }}
              variant="outline"
            >
              Manual entry
            </Button>
            <Button
              onClick={() => {
                setActionError(null);
                setActionMessage(null);
                setPanelMode('bulk');
              }}
            >
              Bulk ingest
            </Button>
          </div>
        }
      />

      {actionError ? <HrCoreQueryErrorBanner message={actionError} /> : null}
      {actionMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {actionMessage}
        </div>
      ) : null}

      <HrCoreSection
        title="Attendance log list"
        description="Filter attendance logs by employee, device, location, direction, and date range. Keep this slice focused on ingestion and auditability, not shift or payroll calculations."
      >
        <HrCoreFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="attendance-log-search">Search</Label>
            <Input
              id="attendance-log-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search logs by employee, device, device employee code, or external log ID"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendance-log-employee-filter">Employee</Label>
            <Select
              id="attendance-log-employee-filter"
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
            <Label htmlFor="attendance-log-device-filter">Attendance device</Label>
            <Select
              id="attendance-log-device-filter"
              onChange={(event) => setAttendanceDeviceFilter(event.target.value)}
              value={attendanceDeviceFilter}
            >
              <option value="">All devices</option>
              {attendanceDevicesQuery.data?.items.map((attendanceDevice) => (
                <option key={attendanceDevice.id} value={attendanceDevice.id}>
                  {getAttendanceDeviceLabel(attendanceDevice)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendance-log-location-filter">Location</Label>
            <Select
              id="attendance-log-location-filter"
              onChange={(event) => setLocationFilter(event.target.value)}
              value={locationFilter}
            >
              <option value="">All locations</option>
              {attendanceDevicesQuery.data?.items
                .filter(
                  (attendanceDevice, index, items) =>
                    attendanceDevice.locationId &&
                    items.findIndex(
                      (item) => item.locationId === attendanceDevice.locationId,
                    ) === index,
                )
                .map((attendanceDevice) => (
                  <option
                    key={attendanceDevice.locationId}
                    value={attendanceDevice.locationId ?? ''}
                  >
                    {attendanceDevice.locationName}
                  </option>
                ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendance-log-direction-filter">Direction</Label>
            <Select
              id="attendance-log-direction-filter"
              onChange={(event) =>
                setDirectionFilter(event.target.value as '' | AttendanceLogDirection)
              }
              value={directionFilter}
            >
              <option value="">All directions</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendance-log-date-from">Date from</Label>
            <Input
              id="attendance-log-date-from"
              onChange={(event) => setDateFrom(event.target.value)}
              type="date"
              value={dateFrom}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendance-log-date-to">Date to</Label>
            <Input
              id="attendance-log-date-to"
              onChange={(event) => setDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </div>
        </HrCoreFilterCard>

        {attendanceLogsQuery.isError && isApiError(attendanceLogsQuery.error) ? (
          <HrCoreQueryErrorBanner
            message={attendanceLogsQuery.error.apiError.message}
          />
        ) : null}

        {attendanceLogsQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading attendance logs.
          </div>
        ) : attendanceLogsQuery.data && attendanceLogsQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logged at</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Attendance device</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>External log ID</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceLogsQuery.data.items.map((attendanceLog) => (
                  <TableRow key={attendanceLog.id}>
                    <TableCell>{formatDateTime(attendanceLog.loggedAt)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {attendanceLog.employeeCode}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {attendanceLog.employeeFullName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {attendanceLog.attendanceDeviceCode}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {attendanceLog.attendanceDeviceName}
                          {attendanceLog.locationName
                            ? ` | ${attendanceLog.locationName}`
                            : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AttendanceDirectionBadge direction={attendanceLog.direction} />
                    </TableCell>
                    <TableCell>
                      {attendanceLog.externalLogId || 'No external log ID'}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => {
                          setActionError(null);
                          setSelectedLog(attendanceLog);
                          setPanelMode('detail');
                        }}
                        size="sm"
                        variant="outline"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={attendanceLogsQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No attendance logs found"
            description="Create a manual attendance log, bulk ingest entries, or adjust the current filters to review existing logs."
          />
        )}
      </HrCoreSection>

      <SidePanel
        description={
          panelMode === 'create'
            ? 'Create a single attendance log entry linked to an existing active device mapping.'
            : panelMode === 'bulk'
              ? 'Bulk ingest attendance log entries linked to existing active device mappings.'
              : 'Review linked employee, device, and mapping context for a specific attendance log entry.'
        }
        onClose={() => {
          setPanelMode(null);
          setSelectedLog(null);
        }}
        open={panelMode !== null}
        size={panelMode === 'bulk' ? 'lg' : 'md'}
        title={
          panelMode === 'create'
            ? 'Create attendance log'
            : panelMode === 'bulk'
              ? 'Bulk ingest attendance logs'
              : 'Attendance log detail'
        }
      >
        {panelMode === 'create' ? (
          <AttendanceLogCreatePanel
            deviceUsers={deviceUsersQuery.data?.items ?? []}
            isPending={createAttendanceLogMutation.isPending}
            onClose={() => {
              setPanelMode(null);
              setSelectedLog(null);
            }}
            onSubmit={(values: AttendanceLogCreateFormValues) =>
              createAttendanceLogMutation
                .mutateAsync({
                  deviceUserId: values.deviceUserId,
                  loggedAt: toIsoDateTime(values.loggedAt),
                  direction: values.direction,
                  externalLogId: values.externalLogId?.trim() || null,
                })
                .then(() => {
                  setActionError(null);
                  setActionMessage(null);
                  setPanelMode(null);
                })
            }
          />
        ) : null}
        {panelMode === 'bulk' ? (
          <AttendanceLogBulkPanel
            deviceUsers={deviceUsersQuery.data?.items ?? []}
            isPending={bulkCreateAttendanceLogsMutation.isPending}
            onClose={() => {
              setPanelMode(null);
              setSelectedLog(null);
            }}
            onSubmit={(values: AttendanceLogBulkFormValues) =>
              bulkCreateAttendanceLogsMutation
                .mutateAsync({
                  entries: values.entries.map((entry) => ({
                    deviceUserId: entry.deviceUserId,
                    loggedAt: toIsoDateTime(entry.loggedAt),
                    direction: entry.direction,
                    externalLogId: entry.externalLogId?.trim() || null,
                  })),
                })
                .then((result) => {
                  setActionError(null);
                  setActionMessage(
                    `Bulk ingest created ${result.createdCount} log(s) and skipped ${result.skippedCount}.`,
                  );
                  setPanelMode(null);
                })
            }
          />
        ) : null}
        {panelMode === 'detail' && attendanceLogForDetail ? (
          <AttendanceLogDetailPanel attendanceLog={attendanceLogForDetail} />
        ) : null}
      </SidePanel>
    </div>
  );
};
