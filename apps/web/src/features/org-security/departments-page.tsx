'use client';

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import {
  Button,
  Card,
  CardContent,
  buttonVariants,
} from '@real-capita/ui';
import { useAuth } from '../../components/providers/auth-provider';
import { EmptyState } from '../../components/ui/empty-state';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { SidePanel } from '../../components/ui/side-panel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import type {
  CreateDepartmentPayload,
  DepartmentRecord,
  UpdateDepartmentPayload,
} from '../../lib/api/types';
import {
  activateDepartment,
  createDepartment,
  deactivateDepartment,
  listDepartments,
  updateDepartment,
} from '../../lib/api/org-security';
import { isApiError } from '../../lib/api/client';
import { formatDateTime } from '../../lib/format';
import { applyApiFormErrors } from '../../lib/forms';

import {
  ListToolbar,
  OrgPageHeader,
  QueryErrorBanner,
  StatusBadge,
} from './shared';

const PAGE_SIZE = 10;

const departmentSchema = z.object({
  code: z.string().min(1, 'Code is required.').max(50),
  name: z.string().min(1, 'Department name is required.').max(120),
  description: z.string().max(500).optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

const getStatusFilterValue = (
  value: 'all' | 'active' | 'inactive',
): boolean | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'active';
};

const DepartmentFormPanel = ({
  department,
  isPending,
  onClose,
  onSubmit,
}: {
  department: DepartmentRecord | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: DepartmentFormValues) => Promise<unknown>;
}) => {
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      code: department?.code ?? '',
      name: department?.name ?? '',
      description: department?.description ?? '',
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    form.reset({
      code: department?.code ?? '',
      name: department?.name ?? '',
      description: department?.description ?? '',
    });
    setSubmitError(null);
  }, [department, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      if (applyApiFormErrors(form.setError, error)) {
        return;
      }

      if (isApiError(error)) {
        setSubmitError(error.apiError.message);
        return;
      }

      setSubmitError('Unable to save the department.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <QueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="department-code">Code</Label>
        <Input id="department-code" {...form.register('code')} />
        {form.formState.errors.code ? (
          <p className="text-sm text-rose-700">
            {form.formState.errors.code.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="department-name">Name</Label>
        <Input id="department-name" {...form.register('name')} />
        {form.formState.errors.name ? (
          <p className="text-sm text-rose-700">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="department-description">Description</Label>
        <Textarea
          id="department-description"
          {...form.register('description')}
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending
            ? 'Saving...'
            : department
              ? 'Save changes'
              : 'Create department'}
        </Button>
      </div>
    </form>
  );
};

export const DepartmentsPage = () => {
  const { canAccessOrgSecurity, user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentRecord | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const companyId = user?.currentCompany.id;
  const query = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
      ...(deferredSearch ? { search: deferredSearch } : {}),
      ...(statusFilter !== 'all'
        ? { isActive: statusFilter === 'active' }
        : {}),
    }),
    [deferredSearch, page, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  const departmentsQuery = useQuery({
    queryKey: ['departments', companyId, query],
    queryFn: () => listDepartments(companyId!, query),
    enabled: canAccessOrgSecurity && Boolean(companyId),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: DepartmentFormValues) => {
      const payload = {
        code: values.code,
        name: values.name,
        ...(values.description ? { description: values.description } : {}),
      };

      if (selectedDepartment) {
        return updateDepartment(
          companyId!,
          selectedDepartment.id,
          payload satisfies UpdateDepartmentPayload,
        );
      }

      return createDepartment(
        companyId!,
        payload satisfies CreateDepartmentPayload,
      );
    },
    onSuccess: async () => {
      setPanelOpen(false);
      setSelectedDepartment(null);
      await queryClient.invalidateQueries({
        queryKey: ['departments', companyId],
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (department: DepartmentRecord) =>
      department.isActive
        ? deactivateDepartment(companyId!, department.id)
        : activateDepartment(companyId!, department.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['departments', companyId],
      });
    },
  });

  if (!canAccessOrgSecurity || !user) {
    return (
      <EmptyState
        description="The active session does not currently include company_admin access."
        title="Org & Security access required"
      />
    );
  }

  return (
    <div className="space-y-6">
      <OrgPageHeader
        actions={
          <button
            className={buttonVariants()}
            onClick={() => {
              setSelectedDepartment(null);
              setPanelOpen(true);
            }}
            type="button"
          >
            New department
          </button>
        }
        description="Manage company departments used by HR, user organization, and future reporting scopes."
        eyebrow="Org & Security"
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="Departments"
      />

      <ListToolbar
        isActiveFilter={statusFilter}
        onIsActiveFilterChange={setStatusFilter}
        onSearchChange={setSearch}
        searchPlaceholder="Search departments by code or name"
        searchValue={search}
      />

      {departmentsQuery.isError && isApiError(departmentsQuery.error) ? (
        <QueryErrorBanner message={departmentsQuery.error.apiError.message} />
      ) : null}

      <Card>
        <CardContent className="px-0 pb-0">
          {departmentsQuery.isPending ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              Loading departments.
            </div>
          ) : departmentsQuery.data && departmentsQuery.data.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[220px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentsQuery.data.items.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">
                            {department.name}
                          </p>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            {department.code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md text-muted-foreground">
                        {department.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge isActive={department.isActive} />
                      </TableCell>
                      <TableCell>{formatDateTime(department.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => {
                              setSelectedDepartment(department);
                              setPanelOpen(true);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                          <Button
                            disabled={toggleMutation.isPending}
                            onClick={() => void toggleMutation.mutateAsync(department)}
                            size="sm"
                            variant="ghost"
                          >
                            {department.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                meta={departmentsQuery.data.meta}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="px-6 py-8">
              <EmptyState
                description="No departments match the current filters."
                title="No departments found"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <SidePanel
        description={
          selectedDepartment
            ? 'Update the company department metadata.'
            : 'Create a new company department.'
        }
        onClose={() => {
          setPanelOpen(false);
          setSelectedDepartment(null);
        }}
        open={panelOpen}
        title={selectedDepartment ? 'Edit department' : 'Create department'}
      >
        <DepartmentFormPanel
          department={selectedDepartment}
          isPending={saveMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setSelectedDepartment(null);
          }}
          onSubmit={(values) => saveMutation.mutateAsync(values)}
        />
      </SidePanel>
    </div>
  );
};
