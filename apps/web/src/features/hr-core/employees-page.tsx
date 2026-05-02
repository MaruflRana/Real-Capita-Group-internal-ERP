'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Button } from '@real-capita/ui';

import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { AppPage } from '../../components/ui/erp-primitives';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { OutputActionGroup } from '../../components/ui/output-actions';
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
import { listEmployees } from '../../lib/api/hr-core';
import type { EmployeeRecord } from '../../lib/api/types';
import { formatDateTime } from '../../lib/format';
import {
  buildExportFileName,
  exportPaginatedCsv,
  getExportDateStamp,
} from '../../lib/output';
import { EmployeeFormPanel, type EmployeeFormValues } from './forms';
import {
  useEmployee,
  useEmployees,
  useHrDepartments,
  useHrLocations,
  useHrUsers,
  useSaveEmployee,
  useToggleEmployee,
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
  getDepartmentLabel,
  getEmployeeLabel,
  getLocationLabel,
  getStatusQueryValue,
  normalizeNullableId,
  PAGE_SIZE,
  OPTION_PAGE_SIZE,
} from './utils';

export const EmployeesPage = () => {
  const { canAccessHr, user } = useAuth();
  const companyId = user?.currentCompany.id;
  const isEnabled = canAccessHr && Boolean(companyId);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editor, setEditor] = useState<EmployeeRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const listQuery = useMemo(
    () => {
      const isActive = getStatusQueryValue(statusFilter);

      return {
        page,
        pageSize: PAGE_SIZE,
        sortBy: 'employeeCode',
        sortOrder: 'asc' as const,
        ...(deferredSearch ? { search: deferredSearch } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(departmentFilter ? { departmentId: departmentFilter } : {}),
        ...(locationFilter ? { locationId: locationFilter } : {}),
        ...(managerFilter ? { managerEmployeeId: managerFilter } : {}),
      };
    },
    [deferredSearch, departmentFilter, locationFilter, managerFilter, page, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, departmentFilter, locationFilter, managerFilter, statusFilter]);

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
  const managerOptionsQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'fullName',
      sortOrder: 'asc' as const,
      isActive: true,
    }),
    [],
  );
  const userOptionsQuery = useMemo(
    () => ({
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortBy: 'email',
      sortOrder: 'asc' as const,
      isActive: true,
    }),
    [],
  );

  const departmentsQuery = useHrDepartments(companyId, referenceQuery, isEnabled);
  const locationsQuery = useHrLocations(companyId, referenceQuery, isEnabled);
  const managersQuery = useEmployees(companyId, managerOptionsQuery, isEnabled);
  const usersQuery = useHrUsers(companyId, userOptionsQuery, isEnabled && panelOpen);
  const employeesQuery = useEmployees(companyId, listQuery, isEnabled);
  const employeeDetailQuery = useEmployee(
    companyId,
    editor?.id ?? '',
    isEnabled && panelOpen && Boolean(editor?.id),
  );
  const saveEmployeeMutation = useSaveEmployee(companyId);
  const toggleEmployeeMutation = useToggleEmployee(companyId);

  if (!user) {
    return null;
  }

  if (!canAccessHr) {
    return <HrCoreAccessRequiredState />;
  }

  const employeeForForm = employeeDetailQuery.data ?? editor;
  const managerOptions =
    managersQuery.data?.items.filter(
      (employee) => employee.id !== employeeForForm?.id,
    ) ?? [];

  const buildPayload = (values: EmployeeFormValues) => ({
    employeeCode: values.employeeCode.trim(),
    fullName: values.fullName.trim(),
    departmentId: normalizeNullableId(values.departmentId),
    locationId: normalizeNullableId(values.locationId),
    userId: normalizeNullableId(values.userId),
    managerEmployeeId: normalizeNullableId(values.managerEmployeeId),
  });

  const handleExport = async () => {
    if (!companyId) {
      return;
    }

    setExportError(null);
    setIsExporting(true);

    try {
      await exportPaginatedCsv({
        columns: [
          {
            header: 'Employee ID',
            value: (employee) => employee.id,
          },
          {
            header: 'Employee Code',
            value: (employee) => employee.employeeCode,
          },
          {
            header: 'Full Name',
            value: (employee) => employee.fullName,
          },
          {
            header: 'Department',
            value: (employee) => employee.departmentName ?? '',
          },
          {
            header: 'Location',
            value: (employee) => employee.locationName ?? '',
          },
          {
            header: 'User Email',
            value: (employee) => employee.userEmail ?? '',
          },
          {
            header: 'Manager Code',
            value: (employee) => employee.managerEmployeeCode ?? '',
          },
          {
            header: 'Manager Name',
            value: (employee) => employee.managerFullName ?? '',
          },
          {
            header: 'Active',
            value: (employee) => (employee.isActive ? 'Yes' : 'No'),
          },
          {
            header: 'Updated At',
            value: (employee) => employee.updatedAt,
          },
        ],
        companyId,
        fileName: buildExportFileName([
          user.currentCompany.slug,
          'employees',
          'export',
          getExportDateStamp(),
        ]),
        listFn: listEmployees,
        query: listQuery,
      });
    } catch (error) {
      setExportError(
        isApiError(error)
          ? error.apiError.message
          : error instanceof Error
            ? error.message
            : 'Unable to export the employee list.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppPage>
      <HrCorePageHeader
        title="Employees"
        description="Operate the company-scoped employee master used by attendance devices, device mappings, leave requests, and downstream HR workflows."
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        actions={
          <div className="flex flex-wrap gap-2">
            <OutputActionGroup
              isExporting={isExporting}
              onExport={() => void handleExport()}
            />
            <Button
              onClick={() => {
                setActionError(null);
                setEditor(null);
                setPanelOpen(true);
              }}
            >
              New employee
            </Button>
          </div>
        }
      />

      {actionError ? <HrCoreQueryErrorBanner message={actionError} /> : null}
      {exportError ? <HrCoreQueryErrorBanner message={exportError} /> : null}

      <HrAnalyticsPanel
        companyId={companyId}
        companySlug={user.currentCompany.slug}
        enabled={isEnabled}
      />

      <HrCoreSection
        title="Employee master list"
        description="Search by employee code, employee name, department, location, user email, or manager. Keep hierarchy and company linkage clean here before attendance and leave operations depend on it."
      >
        <HrCoreFilterCard>
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="employee-search">Search</Label>
            <Input
              id="employee-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employees by code, name, department, location, user, or manager"
              value={search}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-status-filter">Status</Label>
            <Select
              id="employee-status-filter"
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
            <Label htmlFor="employee-department-filter">Department</Label>
            <Select
              id="employee-department-filter"
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
            <Label htmlFor="employee-location-filter">Location</Label>
            <Select
              id="employee-location-filter"
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
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="employee-manager-filter">Manager</Label>
            <Select
              id="employee-manager-filter"
              onChange={(event) => setManagerFilter(event.target.value)}
              value={managerFilter}
            >
              <option value="">All managers</option>
              {managersQuery.data?.items.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {getEmployeeLabel(manager)}
                </option>
              ))}
            </Select>
          </div>
        </HrCoreFilterCard>

        {employeesQuery.isError && isApiError(employeesQuery.error) ? (
          <HrCoreQueryErrorBanner message={employeesQuery.error.apiError.message} />
        ) : null}

        {employeesQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground">
            Loading employees.
          </div>
        ) : employeesQuery.data && employeesQuery.data.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department / Location</TableHead>
                  <TableHead>User / Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesQuery.data.items.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {employee.employeeCode}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {employee.fullName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{employee.departmentName || 'No department'}</p>
                        <p className="text-muted-foreground">
                          {employee.locationName || 'No location'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{employee.userEmail || 'No linked user'}</p>
                        <p className="text-muted-foreground">
                          {employee.managerFullName
                            ? `${employee.managerFullName}${
                                employee.managerEmployeeCode
                                  ? ` (${employee.managerEmployeeCode})`
                                  : ''
                              }`
                            : 'No manager'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <HrEntityStatusBadge isActive={employee.isActive} />
                    </TableCell>
                    <TableCell>{formatDateTime(employee.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setActionError(null);
                            setEditor(employee);
                            setPanelOpen(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          disabled={toggleEmployeeMutation.isPending}
                          onClick={() =>
                            void toggleEmployeeMutation
                              .mutateAsync({
                                employeeId: employee.id,
                                isActive: employee.isActive,
                              })
                              .then(() => setActionError(null))
                              .catch((error) =>
                                setActionError(
                                  isApiError(error)
                                    ? error.apiError.message
                                    : 'Unable to update the employee status.',
                                ),
                              )
                          }
                          size="sm"
                          variant="ghost"
                        >
                          {employee.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls meta={employeesQuery.data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No employees found"
            description="Create the first employee record or adjust the current filters to review existing staff records."
          />
        )}
      </HrCoreSection>

      <SidePanel
        description={
          editor
            ? 'Update employee company linkage, hierarchy, and active state used throughout HR operations.'
            : 'Create an employee record that can be linked to attendance devices, logs, and leave management.'
        }
        onClose={() => {
          setPanelOpen(false);
          setEditor(null);
        }}
        open={panelOpen}
        title={editor ? 'Edit employee' : 'Create employee'}
      >
        <EmployeeFormPanel
          departments={departmentsQuery.data?.items ?? []}
          employee={employeeForForm}
          isPending={saveEmployeeMutation.isPending}
          locations={locationsQuery.data?.items ?? []}
          managers={managerOptions}
          onClose={() => {
            setPanelOpen(false);
            setEditor(null);
          }}
          onSubmit={(values) =>
            saveEmployeeMutation
              .mutateAsync(
                editor
                  ? { employeeId: editor.id, payload: buildPayload(values) }
                  : { payload: buildPayload(values) },
              )
              .then(() => {
                setActionError(null);
                setPanelOpen(false);
                setEditor(null);
              })
          }
          users={usersQuery.data?.items ?? []}
        />
        {usersQuery.isError && isApiError(usersQuery.error) ? (
          <div className="mt-5">
            <HrCoreQueryErrorBanner message={usersQuery.error.apiError.message} />
          </div>
        ) : null}
      </SidePanel>
    </AppPage>
  );
};
