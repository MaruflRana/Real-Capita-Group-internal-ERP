'use client';

import Link from 'next/link';
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
  cn,
} from '@real-capita/ui';
import { useAuth } from '../../components/providers/auth-provider';
import { Badge } from '../../components/ui/badge';
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
import type {
  CompanyUserRecord,
  CreateCompanyUserPayload,
  RoleRecord,
  UpdateCompanyUserPayload,
} from '../../lib/api/types';
import {
  activateUser,
  createUser,
  deactivateUser,
  listRoles,
  listUsers,
  updateUser,
} from '../../lib/api/org-security';
import { isApiError } from '../../lib/api/client';
import { formatDateTime, formatName } from '../../lib/format';
import { applyApiFormErrors } from '../../lib/forms';
import { APP_ROUTES } from '../../lib/routes';

import {
  ListToolbar,
  OrgPageHeader,
  QueryErrorBanner,
  StatusBadge,
} from './shared';

const PAGE_SIZE = 10;

const createUserSchema = z.object({
  email: z.string().email('Enter a valid email address.').max(320),
  password: z.string().min(12, 'Password must be at least 12 characters.').max(128),
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
  roleCodes: z.array(z.string()).min(1, 'Select at least one role.'),
});

const updateUserSchema = z.object({
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

const getStatusFilterValue = (
  value: 'all' | 'active' | 'inactive',
): boolean | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'active';
};

const RoleChecklist = ({
  roles,
  values,
  onToggle,
}: {
  roles: RoleRecord[];
  values: string[];
  onToggle: (roleCode: string, checked: boolean) => void;
}) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {roles.map((role) => {
      const checked = values.includes(role.code);

      return (
        <label
          className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3"
          key={role.id}
        >
          <input
            checked={checked}
            className="mt-1 h-4 w-4 rounded border-border"
            onChange={(event) => onToggle(role.code, event.target.checked)}
            type="checkbox"
          />
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              {role.name}
            </span>
            <span className="block font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {role.code}
            </span>
          </span>
        </label>
      );
    })}
  </div>
);

const CreateUserFormPanel = ({
  isPending,
  onClose,
  onSubmit,
  roles,
}: {
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: CreateUserFormValues) => Promise<unknown>;
  roles: RoleRecord[];
}) => {
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleCodes: [],
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

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

      setSubmitError('Unable to create the user.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <QueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="create-user-email">Email</Label>
        <Input id="create-user-email" {...form.register('email')} />
        {form.formState.errors.email ? (
          <p className="text-sm text-rose-700">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="create-user-password">Temporary password</Label>
        <Input
          id="create-user-password"
          type="password"
          {...form.register('password')}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-rose-700">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="create-user-first-name">First name</Label>
          <Input id="create-user-first-name" {...form.register('firstName')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-user-last-name">Last name</Label>
          <Input id="create-user-last-name" {...form.register('lastName')} />
        </div>
      </div>
      <div className="space-y-3">
        <Label>Initial roles</Label>
        <RoleChecklist
          onToggle={(roleCode, checked) => {
            const currentValues = form.getValues('roleCodes');

            form.setValue(
              'roleCodes',
              checked
                ? [...currentValues, roleCode]
                : currentValues.filter((value) => value !== roleCode),
              { shouldDirty: true, shouldValidate: true },
            );
          }}
          roles={roles}
          values={form.watch('roleCodes')}
        />
        {form.formState.errors.roleCodes ? (
          <p className="text-sm text-rose-700">
            {form.formState.errors.roleCodes.message}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? 'Creating...' : 'Create user'}
        </Button>
      </div>
    </form>
  );
};

const EditUserFormPanel = ({
  isPending,
  onClose,
  onSubmit,
  user,
}: {
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: UpdateUserFormValues) => Promise<unknown>;
  user: CompanyUserRecord;
}) => {
  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    form.reset({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
    });
    setSubmitError(null);
  }, [form, user]);

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

      setSubmitError('Unable to update the user.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <QueryErrorBanner message={submitError} /> : null}
      <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{user.email}</p>
        <p className="mt-1">
          Role assignments are managed separately in the roles / assignments
          page.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-user-first-name">First name</Label>
          <Input id="edit-user-first-name" {...form.register('firstName')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-user-last-name">Last name</Label>
          <Input id="edit-user-last-name" {...form.register('lastName')} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
};

export const UsersPage = () => {
  const { canAccessOrgSecurity, user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [roleFilter, setRoleFilter] = useState('all');
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUserRecord | null>(
    null,
  );
  const deferredSearch = useDeferredValue(search);

  const companyId = user?.currentCompany.id;
  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () =>
      listRoles({
        page: 1,
        pageSize: 100,
        isActive: true,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    enabled: canAccessOrgSecurity,
  });
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
      ...(roleFilter !== 'all' ? { roleCode: roleFilter } : {}),
    }),
    [deferredSearch, page, roleFilter, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, roleFilter, statusFilter]);

  const usersQuery = useQuery({
    queryKey: ['users', companyId, query],
    queryFn: () => listUsers(companyId!, query),
    enabled: canAccessOrgSecurity && Boolean(companyId),
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateUserFormValues) =>
      createUser(
        companyId!,
        {
          email: values.email,
          password: values.password,
          roleCodes: values.roleCodes,
          ...(values.firstName ? { firstName: values.firstName } : {}),
          ...(values.lastName ? { lastName: values.lastName } : {}),
        } satisfies CreateCompanyUserPayload,
      ),
    onSuccess: async () => {
      setCreatePanelOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ['users', companyId],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateUserFormValues) =>
      updateUser(
        companyId!,
        selectedUser!.id,
        {
          ...(values.firstName ? { firstName: values.firstName } : {}),
          ...(values.lastName ? { lastName: values.lastName } : {}),
        } satisfies UpdateCompanyUserPayload,
      ),
    onSuccess: async () => {
      setSelectedUser(null);
      await queryClient.invalidateQueries({
        queryKey: ['users', companyId],
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (record: CompanyUserRecord) =>
      record.companyAccessIsActive
        ? deactivateUser(companyId!, record.id)
        : activateUser(companyId!, record.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['users', companyId],
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
            onClick={() => setCreatePanelOpen(true)}
            type="button"
          >
            New user
          </button>
        }
        description="Create company-scoped user access, update basic identity metadata, and manage current access state."
        eyebrow="Org & Security"
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="Users"
      />

      <ListToolbar
        extraFilters={
          <>
            <Label htmlFor="roleFilter">Role filter</Label>
            <Select
              id="roleFilter"
              onChange={(event) => setRoleFilter(event.target.value)}
              value={roleFilter}
            >
              <option value="all">All roles</option>
              {rolesQuery.data?.items.map((role) => (
                <option key={role.id} value={role.code}>
                  {role.name}
                </option>
              ))}
            </Select>
          </>
        }
        isActiveFilter={statusFilter}
        onIsActiveFilterChange={setStatusFilter}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by email or name"
        searchValue={search}
      />

      {usersQuery.isError && isApiError(usersQuery.error) ? (
        <QueryErrorBanner message={usersQuery.error.apiError.message} />
      ) : null}

      <Card>
        <CardContent className="px-0 pb-0">
          {usersQuery.isPending ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              Loading users.
            </div>
          ) : usersQuery.data && usersQuery.data.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead className="w-[280px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data.items.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">
                            {formatName(record.firstName, record.lastName, record.email)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {record.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {record.roles.map((role) => (
                            <Badge key={`${record.id}-${role}`} variant="outline">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <StatusBadge
                            activeLabel="Company access active"
                            inactiveLabel="Company access inactive"
                            isActive={record.companyAccessIsActive}
                          />
                          <StatusBadge
                            activeLabel="Identity active"
                            inactiveLabel="Identity inactive"
                            isActive={record.identityIsActive}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(record.lastLoginAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => setSelectedUser(record)}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                          <Button
                            disabled={toggleMutation.isPending}
                            onClick={() => void toggleMutation.mutateAsync(record)}
                            size="sm"
                            variant="ghost"
                          >
                            {record.companyAccessIsActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Link
                            className={cn(
                              buttonVariants({
                                size: 'sm',
                                variant: 'ghost',
                              }),
                            )}
                            href={`${APP_ROUTES.orgSecurityRoleAssignments}?userId=${record.id}`}
                          >
                            Manage roles
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                meta={usersQuery.data.meta}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="px-6 py-8">
              <EmptyState
                description="No users match the current filters."
                title="No users found"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <SidePanel
        description="Create a global identity and attach the initial company-scoped roles."
        onClose={() => setCreatePanelOpen(false)}
        open={createPanelOpen}
        size="lg"
        title="Create user"
      >
        <CreateUserFormPanel
          isPending={createMutation.isPending}
          onClose={() => setCreatePanelOpen(false)}
          onSubmit={(values) => createMutation.mutateAsync(values)}
          roles={rolesQuery.data?.items ?? []}
        />
      </SidePanel>

      <SidePanel
        description="Update the non-sensitive user profile fields for this company-scoped record."
        onClose={() => setSelectedUser(null)}
        open={Boolean(selectedUser)}
        title="Edit user"
      >
        {selectedUser ? (
          <EditUserFormPanel
            isPending={updateMutation.isPending}
            onClose={() => setSelectedUser(null)}
            onSubmit={(values) => updateMutation.mutateAsync(values)}
            user={selectedUser}
          />
        ) : null}
      </SidePanel>
    </div>
  );
};
