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
import type { AttendanceDeviceRecord } from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import {
  AttendanceDeviceFormPanel,
  type AttendanceDeviceFormValues,
} from './forms';
import {
  useAttendanceDevice,
  useAttendanceDevices,
  useHrLocations,
  useSaveAttendanceDevice,
  useToggleAttendanceDevice,
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
  getLocationLabel,
  getStatusQueryValue,
  normalizeNullableId,
  normalizeOptionalTextToNull,
  OPTION_PAGE_SIZE,
  PAGE_SIZE,
} from './utils';

export const AttendanceDevicesPage = () => {
  const { canAccessHr, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessHr && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [locationFilter, setLocationFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<AttendanceDeviceRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(
    () => {
      const isActive = getStatusQueryValue(statusFilter);

      return {
        page,
        pageSize: PAGE_SIZE,
        sortBy: 'code',
        sortOrder: 'asc' as const,
        ...(deferredSearch ? { search: deferredSearch } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(locationFilter ? { locationId: locationFilter } : {}),
      };
    },
    [deferredSearch, locationFilter, page, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, locationFilter, statusFilter]);

  const referenceQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc' as const,
      isActive: true,
    }),
    [],
  );

  const locationsQuery = useHrLocations(companyId, referenceQuery, isEnabled);
  const attendanceDevicesQuery = useAttendanceDevices(companyId, listQuery, isEnabled);
  const attendanceDeviceDetailQuery = useAttendanceDevice(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveAttendanceDeviceMutation = useSaveAttendanceDevice(companyId);
  const toggleAttendanceDeviceMutation = useToggleAttendanceDevice(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessHr) {
    return <HrCoreAccessRequiredState />;
  }

  const attendanceDeviceForForm = attendanceDeviceDetailQuery.data ?? editor;
  const buildPayload = (values: AttendanceDeviceFormValues) => ({
    code: values.code.trim(),
    name: values.name.trim(),
    description: normalizeOptionalTextToNull(values.description),
    locationId: normalizeNullableId(values.locationId),
  });

  return (
    <div className="space-y-6">
      <HrCorePageHeader
        title="Attendance Devices"
        description="Operate the company-scoped attendance device catalog used for ingestion and device-user mappings."
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
            New device
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
        title="Attendance device list"
        description="Search by device code, device name, description, or location. Keep code uniqueness and location linkage explicit for downstream log operations."
      >
        <HrCoreFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="attendance-device-search">Search</Label>
            <Input
              id="attendance-device-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search devices by code, name, description, or location"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendance-device-status-filter">Status</Label>
            <Select
              id="attendance-device-status-filter"
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
            <Label htmlFor="attendance-device-location-filter">Location</Label>
            <Select
              id="attendance-device-location-filter"
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
        </HrCoreFilterCard>

        {attendanceDevicesQuery.isError && isApiError(attendanceDevicesQuery.error) ? (
          <HrCoreQueryErrorBanner
            message={attendanceDevicesQuery.error.apiError.message}
          />
        ) : null}

        {attendanceDevicesQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading attendance devices.
          </div>
        ) : attendanceDevicesQuery.data &&
          attendanceDevicesQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceDevicesQuery.data.items.map((attendanceDevice) => (
                  <TableRow key={attendanceDevice.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {attendanceDevice.code}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {attendanceDevice.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {attendanceDevice.locationName || 'No location'}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="text-sm text-muted-foreground">
                        {attendanceDevice.description || 'No description'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <HrEntityStatusBadge isActive={attendanceDevice.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(attendanceDevice.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(attendanceDevice);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleAttendanceDeviceMutation.isPending}
                          onClick={() =>
                            void toggleAttendanceDeviceMutation
                              .mutateAsync({
                                attendanceDeviceId: attendanceDevice.id,
                                isActive: attendanceDevice.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the attendance device status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {attendanceDevice.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              meta={attendanceDevicesQuery.data.meta}
              onPageChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            title="No attendance devices found"
            description="Create the first attendance device or adjust the current filters to review existing hardware registrations."
          />
        )}
      </HrCoreSection>

      <SidePanel
        description={
          editor
            ? 'Update attendance device metadata and location context used by device mappings and log ingestion.'
            : 'Create an attendance device that can be linked to employee mappings and attendance log ingestion.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit attendance device' : 'Create attendance device'}
      >
        <AttendanceDeviceFormPanel
          attendanceDevice={attendanceDeviceForForm}
          isPending={saveAttendanceDeviceMutation.isPending}
          locations={locationsQuery.data?.items ?? []}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveAttendanceDeviceMutation
              .mutateAsync(
                editor
                  ? {
                      attendanceDeviceId: editor.id,
                      payload: buildPayload(values),
                    }
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
