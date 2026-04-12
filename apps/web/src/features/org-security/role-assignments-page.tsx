'use client';

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@real-capita/ui';
import { useAuth } from '../../components/providers/auth-provider';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { Label } from '../../components/ui/label';
import { PaginationControls } from '../../components/ui/pagination-controls';
import { Select } from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  assignRole,
  listRoleAssignments,
  listRoles,
  listUsers,
  removeRole,
} from '../../lib/api/org-security';
import { isApiError } from '../../lib/api/client';
import { formatDateTime, formatName } from '../../lib/format';

import {
  ListToolbar,
  OrgPageHeader,
  QueryErrorBanner,
  StatusBadge,
} from './shared';

const PAGE_SIZE = 8;
const ASSIGNMENT_PAGE_SIZE = 20;

const getStatusFilterValue = (
  value: 'all' | 'active' | 'inactive',
): boolean | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'active';
};

export const RoleAssignmentsPage = ({
  initialUserId,
}: {
  initialUserId: string | null;
}) => {
  const { canAccessOrgSecurity, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialUserId,
  );
  const [selectedRoleCode, setSelectedRoleCode] = useState('');
  const deferredSearch = useDeferredValue(search);

  const companyId = user?.currentCompany.id;
  const userQueryInput = useMemo(
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

  useEffect(() => {
    setSelectedUserId(initialUserId);
  }, [initialUserId]);

  const usersQuery = useQuery({
    queryKey: ['users-for-role-assignments', companyId, userQueryInput],
    queryFn: () => listUsers(companyId!, userQueryInput),
    enabled: canAccessOrgSecurity && Boolean(companyId),
  });

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

  useEffect(() => {
    if (!usersQuery.data?.items.length) {
      setSelectedUserId(null);
      return;
    }

    const preferredUserId = initialUserId ?? selectedUserId;
    const matchingUser = usersQuery.data.items.find(
      (record) => record.id === preferredUserId,
    );

    if (matchingUser) {
      setSelectedUserId(matchingUser.id);
      return;
    }

    const [firstUser] = usersQuery.data.items;

    if (firstUser) {
      setSelectedUserId(firstUser.id);
    }
  }, [initialUserId, selectedUserId, usersQuery.data]);

  const assignmentsQuery = useQuery({
    queryKey: ['role-assignments', companyId, selectedUserId],
    queryFn: () =>
      listRoleAssignments(companyId!, selectedUserId!, {
        page: 1,
        pageSize: ASSIGNMENT_PAGE_SIZE,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      }),
    enabled:
      canAccessOrgSecurity &&
      Boolean(companyId) &&
      Boolean(selectedUserId),
  });

  const selectedUser = useMemo(
    () =>
      usersQuery.data?.items.find((record) => record.id === selectedUserId) ?? null,
    [selectedUserId, usersQuery.data],
  );

  const assignableRoles = useMemo(() => {
    const activeRoleCodes = new Set(
      assignmentsQuery.data?.items
        .filter((assignment) => assignment.isActive)
        .map((assignment) => assignment.roleCode) ?? [],
    );

    return (
      rolesQuery.data?.items.filter((role) => !activeRoleCodes.has(role.code)) ?? []
    );
  }, [assignmentsQuery.data?.items, rolesQuery.data?.items]);

  useEffect(() => {
    if (!assignableRoles.length) {
      setSelectedRoleCode('');
      return;
    }

    if (!assignableRoles.some((role) => role.code === selectedRoleCode)) {
      const [firstRole] = assignableRoles;

      if (firstRole) {
        setSelectedRoleCode(firstRole.code);
      }
    }
  }, [assignableRoles, selectedRoleCode]);

  const assignMutation = useMutation({
    mutationFn: () =>
      assignRole(companyId!, selectedUserId!, {
        roleCode: selectedRoleCode,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['role-assignments', companyId, selectedUserId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['users', companyId],
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (roleCode: string) =>
      removeRole(companyId!, selectedUserId!, roleCode),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['role-assignments', companyId, selectedUserId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['users', companyId],
      });
    },
  });

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);

    startTransition(() => {
      router.replace(`?userId=${userId}`);
    });
  };

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
        description="Assign, reactivate, and remove company-scoped roles for users in the active company context."
        eyebrow="Org & Security"
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="Roles / Assignments"
      />

      <ListToolbar
        isActiveFilter={statusFilter}
        onIsActiveFilterChange={setStatusFilter}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by email or name"
        searchValue={search}
      />

      {usersQuery.isError && isApiError(usersQuery.error) ? (
        <QueryErrorBanner message={usersQuery.error.apiError.message} />
      ) : null}
      {assignmentsQuery.isError && isApiError(assignmentsQuery.error) ? (
        <QueryErrorBanner message={assignmentsQuery.error.apiError.message} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Select a user to manage company-scoped role assignments.
            </CardDescription>
          </CardHeader>
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
                      <TableHead>Access</TableHead>
                      <TableHead className="w-[110px]">Select</TableHead>
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
                          <StatusBadge
                            activeLabel="Active"
                            inactiveLabel="Inactive"
                            isActive={record.companyAccessIsActive}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleSelectUser(record.id)}
                            size="sm"
                            variant={
                              record.id === selectedUserId ? 'default' : 'outline'
                            }
                          >
                            {record.id === selectedUserId ? 'Selected' : 'Manage'}
                          </Button>
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

        <Card>
          <CardHeader>
            <CardTitle>Role assignments</CardTitle>
            <CardDescription>
              {selectedUser
                ? `Managing roles for ${selectedUser.email}.`
                : 'Select a user to review role assignments.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedUser ? (
              <>
                <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {formatName(
                          selectedUser.firstName,
                          selectedUser.lastName,
                          selectedUser.email,
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedUser.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        activeLabel="Company access active"
                        inactiveLabel="Company access inactive"
                        isActive={selectedUser.companyAccessIsActive}
                      />
                      <StatusBadge
                        activeLabel="Identity active"
                        inactiveLabel="Identity inactive"
                        isActive={selectedUser.identityIsActive}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-3xl border border-border/70 bg-muted/30 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Add or reactivate role
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Only roles not currently active for this user are listed.
                    </p>
                  </div>
                  {assignableRoles.length > 0 ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="roleCode">Role</Label>
                        <Select
                          id="roleCode"
                          onChange={(event) => setSelectedRoleCode(event.target.value)}
                          value={selectedRoleCode}
                        >
                          {assignableRoles.map((role) => (
                            <option key={role.id} value={role.code}>
                              {role.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <Button
                        disabled={assignMutation.isPending || !selectedRoleCode}
                        onClick={() => void assignMutation.mutateAsync()}
                      >
                        {assignMutation.isPending ? 'Saving...' : 'Assign role'}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-muted-foreground">
                      All active roles are already attached to this user.
                    </div>
                  )}
                </div>

                {assignmentsQuery.data && assignmentsQuery.data.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="w-[110px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignmentsQuery.data.items.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-foreground">
                                {assignment.roleName}
                              </p>
                              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                {assignment.roleCode}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge isActive={assignment.isActive} />
                          </TableCell>
                          <TableCell>{formatDateTime(assignment.updatedAt)}</TableCell>
                          <TableCell>
                            {assignment.isActive ? (
                              <Button
                                disabled={removeMutation.isPending}
                                onClick={() =>
                                  void removeMutation.mutateAsync(assignment.roleCode)
                                }
                                size="sm"
                                variant="ghost"
                              >
                                Remove
                              </Button>
                            ) : (
                              <Badge variant="warning">Inactive</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    description="No role assignments exist yet for the selected user."
                    title="No assignments found"
                  />
                )}
              </>
            ) : (
              <EmptyState
                description="Select a user from the list to review and manage role assignments."
                title="No user selected"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
