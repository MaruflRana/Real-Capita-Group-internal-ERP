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
  cn,
} from '@real-capita/ui';
import { useAuth } from '../../components/providers/auth-provider';
import { Badge } from '../../components/ui/badge';
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
import type {
  CompanyRecord,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from '../../lib/api/types';
import {
  activateCompany,
  createCompany,
  deactivateCompany,
  listCompanies,
  updateCompany,
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

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required.').max(120),
  slug: z
    .string()
    .min(1, 'Slug is required.')
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
      'Slug must use lowercase letters, numbers, and hyphens only.',
    ),
});

type CompanyFormValues = z.infer<typeof companySchema>;

const getStatusFilterValue = (
  value: 'all' | 'active' | 'inactive',
): boolean | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'active';
};

const CompanyFormPanel = ({
  company,
  isPending,
  onClose,
  onSubmit,
}: {
  company: CompanyRecord | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: CompanyFormValues) => Promise<unknown>;
}) => {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? '',
      slug: company?.slug ?? '',
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    form.reset({
      name: company?.name ?? '',
      slug: company?.slug ?? '',
    });
    setSubmitError(null);
  }, [company, form]);

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

      setSubmitError('Unable to save the company.');
    }
  });

  return (
    <form className="space-y-5" id="company-form" onSubmit={handleSubmit}>
      {submitError ? <QueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="company-name">Company name</Label>
        <Input id="company-name" {...form.register('name')} />
        {form.formState.errors.name ? (
          <p className="text-sm text-rose-700">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="company-slug">Slug</Label>
        <Input id="company-slug" {...form.register('slug')} />
        {form.formState.errors.slug ? (
          <p className="text-sm text-rose-700">
            {form.formState.errors.slug.message}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? 'Saving...' : company ? 'Save changes' : 'Create company'}
        </Button>
      </div>
    </form>
  );
};

export const CompaniesPage = () => {
  const { canAccessOrgSecurity } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(
    null,
  );
  const deferredSearch = useDeferredValue(search);
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

  const companiesQuery = useQuery({
    queryKey: ['companies', query],
    queryFn: () => listCompanies(query),
    enabled: canAccessOrgSecurity,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      if (selectedCompany) {
        return updateCompany(selectedCompany.id, values satisfies UpdateCompanyPayload);
      }

      return createCompany(values satisfies CreateCompanyPayload);
    },
    onSuccess: async () => {
      setPanelOpen(false);
      setSelectedCompany(null);
      await queryClient.invalidateQueries({
        queryKey: ['companies'],
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (company: CompanyRecord) =>
      company.isActive
        ? deactivateCompany(company.id)
        : activateCompany(company.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['companies'],
      });
    },
  });

  if (!canAccessOrgSecurity) {
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
              setSelectedCompany(null);
              setPanelOpen(true);
            }}
            type="button"
          >
            New company
          </button>
        }
        description="Manage company identities visible to the authenticated admin. Creating a company also attaches the current admin to that company."
        eyebrow="Org & Security"
        title="Companies"
      />

      <ListToolbar
        isActiveFilter={statusFilter}
        onIsActiveFilterChange={setStatusFilter}
        onSearchChange={setSearch}
        searchPlaceholder="Search companies by name or slug"
        searchValue={search}
      />

      {companiesQuery.isError && isApiError(companiesQuery.error) ? (
        <QueryErrorBanner message={companiesQuery.error.apiError.message} />
      ) : null}

      <Card>
        <CardContent className="px-0 pb-0">
          {companiesQuery.isPending ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              Loading companies.
            </div>
          ) : companiesQuery.data && companiesQuery.data.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Session roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[220px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companiesQuery.data.items.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">
                            {company.name}
                          </p>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            {company.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {company.currentUserRoles.map((role) => (
                            <Badge key={`${company.id}-${role}`} variant="outline">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge isActive={company.isActive} />
                      </TableCell>
                      <TableCell>{formatDateTime(company.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => {
                              setSelectedCompany(company);
                              setPanelOpen(true);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                          <Button
                            disabled={toggleMutation.isPending}
                            onClick={() => void toggleMutation.mutateAsync(company)}
                            size="sm"
                            variant="ghost"
                          >
                            {company.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                meta={companiesQuery.data.meta}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="px-6 py-8">
              <EmptyState
                description="No companies match the current filters."
                title="No companies found"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <SidePanel
        description={
          selectedCompany
            ? 'Update the company metadata used for admin visibility and login context.'
            : 'Create a new company and attach the current admin to it.'
        }
        onClose={() => {
          setPanelOpen(false);
          setSelectedCompany(null);
        }}
        open={panelOpen}
        title={selectedCompany ? 'Edit company' : 'Create company'}
      >
        <CompanyFormPanel
          company={selectedCompany}
          isPending={saveMutation.isPending}
          onClose={() => {
            setPanelOpen(false);
            setSelectedCompany(null);
          }}
          onSubmit={(values) => saveMutation.mutateAsync(values)}
        />
      </SidePanel>
    </div>
  );
};
