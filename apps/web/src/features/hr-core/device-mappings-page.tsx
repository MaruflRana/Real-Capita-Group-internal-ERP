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
import { HrAnalyticsPanel } from '../analytics/module-panels';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { isApiError } from '../../lib/api/client';
import type { DeviceUserRecord } from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import { DeviceUserFormPanel, type DeviceUserFormValues } from './forms';
import {
  useAttendanceDevices,
  useDeviceUser,
  useDeviceUsers,
  useEmployees,
  useSaveDeviceUser,
  useToggleDeviceUser,
} from './hooks';
import {
  HrCoreAccessRequiredState,
  HrCoreFilterCard,
  HrCorePageHeader,
  HrCoreQueryErrorBanner,
  HrCoreSection,
  HrEntityStatusBadge,
} from './shared';
import {
  getAttendanceDeviceLabel,
  getEmployeeLabel,
  getStatusQueryValue,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const DeviceMappingsPage = () => {
  const { canAccessHr, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessHr && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [attendanceDeviceFilter, setAttendanceDeviceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<DeviceUserRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(
    () => {
      const isActive = getStatusQueryValue(statusFilter);

      return {
        page,
        pageSize: PAGE_SIZE,
        sortBy: 'deviceEmployeeCode',
        sortOrder: 'asc' as const,
        ...(deferredSearch ? { search: deferredSearch } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(employeeFilter ? { employeeId: employeeFilter } : {}),
        ...(attendanceDeviceFilter
          ? { attendanceDeviceId: attendanceDeviceFilter }
          : {}),
        ...(locationFilter ? { locationId: locationFilter } : {}),
      };
    },
    [
      attendanceDeviceFilter,
      deferredSearch,
      employeeFilter,
      locationFilter,
      page,
      statusFilter,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [attendanceDeviceFilter, deferredSearch, employeeFilter, locationFilter, statusFilter]);

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

  const employeesQuery = useEmployees(companyId, employeeOptionsQuery, isEnabled);
  const attendanceDevicesQuery = useAttendanceDevices(
    companyId,
    attendanceDeviceOptionsQuery,
    isEnabled,
  );
  const deviceUsersQuery = useDeviceUsers(companyId, listQuery, isEnabled);
  const deviceUserDetailQuery = useDeviceUser(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveDeviceUserMutation = useSaveDeviceUser(companyId);
  const toggleDeviceUserMutation = useToggleDeviceUser(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessHr) {
    return <HrCoreAccessRequiredState />;
  }

  const deviceUserForForm = deviceUserDetailQuery.data ?? editor;
  const buildPayload = (values: DeviceUserFormValues) => ({
    employeeId: values.employeeId,
    attendanceDeviceId: values.attendanceDeviceId,
    deviceEmployeeCode: values.deviceEmployeeCode.trim(),
  });

  return (
    <div className="space-y-6">
      <HrCorePageHeader
        title="Device Mappings"
        description="Operate employee-to-device mappings with clear company, employee, device, and device-user-code context before ingesting attendance logs."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <Button
            onClick={() => {
              setActionError(null);
              setEditor(null);
              setPanelOpen(true);
            }}
          >
            New mapping
          </Button>
        }
      />

      {actionError ? <HrCoreQueryErrorBanner message={actionError} /> : null}

      <HrAnalyticsPanel
        companyId={companyId}
        companySlug={user.currentCompany.slug}
        enabled={isEnabled}
      />

      <HrCoreSection
        title="Device mapping list"
        description="Search by device employee code, employee identity, or device identity. Keep mappings unambiguous before logs are linked to them."
      >
        <HrCoreFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="device-user-search">Search</Label>
            <Input
              id="device-user-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search mappings by device code, employee code, employee name, or device employee code"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="device-user-status-filter">Status</Label>
            <Select
              id="device-user-status-filter"
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')
              }
              value={statusFilter}
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="device-user-employee-filter">Employee</Label>
            <Select
              id="device-user-employee-filter"
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
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="device-user-device-filter">Attendance device</Label>
            <Select
              id="device-user-device-filter"
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
            <Label htmlFor="device-user-location-filter">Location</Label>
            <Select
              id="device-user-location-filter"
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
        </HrCoreFilterCard>

        {deviceUsersQuery.isError && isApiError(deviceUsersQuery.error) ? (
          <HrCoreQueryErrorBanner message={deviceUsersQuery.error.apiError.message} />
        ) : null}

        {deviceUsersQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading device mappings.
          </div>
        ) : deviceUsersQuery.data && deviceUsersQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Attendance device</TableHead>
                  <TableHead>Device code / Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deviceUsersQuery.data.items.map((deviceUser) => (
                  <TableRow key={deviceUser.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {deviceUser.employeeCode}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {deviceUser.employeeFullName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {deviceUser.attendanceDeviceCode}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {deviceUser.attendanceDeviceName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{deviceUser.deviceEmployeeCode}</p>
                        <p className="text-muted-foreground">
                          {deviceUser.locationName || 'No location'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <HrEntityStatusBadge isActive={deviceUser.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(deviceUser.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(deviceUser);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleDeviceUserMutation.isPending}
                          onClick={() =>
                            void toggleDeviceUserMutation
                              .mutateAsync({
                                deviceUserId: deviceUser.id,
                                isActive: deviceUser.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the device mapping status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {deviceUser.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={deviceUsersQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No device mappings found"
            description="Create the first mapping or adjust the current filters to review existing employee-device relationships."
          />
        )}
      </HrCoreSection>

      <SidePanel
        description={
          editor
            ? 'Update employee-device linkage and device employee code while keeping mapping conflicts visible.'
            : 'Create a mapping between an employee and an attendance device for manual or bulk log ingestion.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit device mapping' : 'Create device mapping'}
      >
        <DeviceUserFormPanel
          attendanceDevices={attendanceDevicesQuery.data?.items ?? []}
          deviceUser={deviceUserForForm}
          employees={employeesQuery.data?.items ?? []}
          isPending={saveDeviceUserMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveDeviceUserMutation
              .mutateAsync(
                editor
                  ? { deviceUserId: editor.id, payload: buildPayload(values) }
                  : { payload: buildPayload(values) },
              )
              .then(() => {
                setActionError(null);
                setPanelOpen(false);
                setEditor(null);
              })
          }
        />
      </SidePanel>
    </div>
  );
};
