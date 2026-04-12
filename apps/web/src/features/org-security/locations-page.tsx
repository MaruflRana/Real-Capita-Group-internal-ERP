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
  CreateLocationPayload,
  LocationRecord,
  UpdateLocationPayload,
} from '../../lib/api/types';
import {
  activateLocation,
  createLocation,
  deactivateLocation,
  listLocations,
  updateLocation,
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

const locationSchema = z.object({
  code: z.string().min(1, 'Code is required.').max(50),
  name: z.string().min(1, 'Location name is required.').max(120),
  description: z.string().max(500).optional(),
});

type LocationFormValues = z.infer<typeof locationSchema>;

const getStatusFilterValue = (
  value: 'all' | 'active' | 'inactive',
): boolean | undefined => {
  if (value === 'all') {
    return undefined;
  }

  return value === 'active';
};

const LocationFormPanel = ({
  isPending,
  location,
  onClose,
  onSubmit,
}: {
  isPending: boolean;
  location: LocationRecord | null;
  onClose: () => void;
  onSubmit: (values: LocationFormValues) => Promise<unknown>;
}) => {
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      code: location?.code ?? '',
      name: location?.name ?? '',
      description: location?.description ?? '',
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    form.reset({
      code: location?.code ?? '',
      name: location?.name ?? '',
      description: location?.description ?? '',
    });
    setSubmitError(null);
  }, [form, location]);

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

      setSubmitError('Unable to save the location.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <QueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="location-code">Code</Label>
        <Input id="location-code" {...form.register('code')} />
        {form.formState.errors.code ? (
          <p className="text-sm text-rose-700">
            {form.formState.errors.code.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="location-name">Name</Label>
        <Input id="location-name" {...form.register('name')} />
        {form.formState.errors.name ? (
          <p className="text-sm text-rose-700">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="location-description">Description</Label>
        <Textarea id="location-description" {...form.register('description')} />
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? 'Saving...' : location ? 'Save changes' : 'Create location'}
        </Button>
      </div>
    </form>
  );
};

export const LocationsPage = () => {
  const { canAccessOrgSecurity, user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );
  const [selectedLocation, setSelectedLocation] = useState<LocationRecord | null>(
    null,
  );
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

  const locationsQuery = useQuery({
    queryKey: ['locations', companyId, query],
    queryFn: () => listLocations(companyId!, query),
    enabled: canAccessOrgSecurity && Boolean(companyId),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: LocationFormValues) => {
      const payload = {
        code: values.code,
        name: values.name,
        ...(values.description ? { description: values.description } : {}),
      };

      if (selectedLocation) {
        return updateLocation(
          companyId!,
          selectedLocation.id,
          payload satisfies UpdateLocationPayload,
        );
      }

      return createLocation(companyId!, payload satisfies CreateLocationPayload);
    },
    onSuccess: async () => {
      setPanelOpen(false);
      setSelectedLocation(null);
      await queryClient.invalidateQueries({
        queryKey: ['locations', companyId],
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (location: LocationRecord) =>
      location.isActive
        ? deactivateLocation(companyId!, location.id)
        : activateLocation(companyId!, location.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['locations', companyId],
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
              setSelectedLocation(null);
              setPanelOpen(true);
            }}
            type="button"
          >
            New location
          </button>
        }
        description="Maintain company locations used by future ERP modules and the admin baseline."
        eyebrow="Org & Security"
        scopeName={user.currentCompany.name}
        scopeSlug={user.currentCompany.slug}
        title="Locations"
      />

      <ListToolbar
        isActiveFilter={statusFilter}
        onIsActiveFilterChange={setStatusFilter}
        onSearchChange={setSearch}
        searchPlaceholder="Search locations by code or name"
        searchValue={search}
      />

      {locationsQuery.isError && isApiError(locationsQuery.error) ? (
        <QueryErrorBanner message={locationsQuery.error.apiError.message} />
      ) : null}

      <Card>
        <CardContent className="px-0 pb-0">
          {locationsQuery.isPending ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              Loading locations.
            </div>
          ) : locationsQuery.data && locationsQuery.data.items.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[220px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationsQuery.data.items.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">
                            {location.name}
                          </p>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                            {location.code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md text-muted-foreground">
                        {location.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge isActive={location.isActive} />
                      </TableCell>
                      <TableCell>{formatDateTime(location.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => {
                              setSelectedLocation(location);
                              setPanelOpen(true);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                          <Button
                            disabled={toggleMutation.isPending}
                            onClick={() => void toggleMutation.mutateAsync(location)}
                            size="sm"
                            variant="ghost"
                          >
                            {location.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                meta={locationsQuery.data.meta}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="px-6 py-8">
              <EmptyState
                description="No locations match the current filters."
                title="No locations found"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <SidePanel
        description={
          selectedLocation
            ? 'Update the company location metadata.'
            : 'Create a new company location.'
        }
        onClose={() => {
          setPanelOpen(false);
          setSelectedLocation(null);
        }}
        open={panelOpen}
        title={selectedLocation ? 'Edit location' : 'Create location'}
      >
        <LocationFormPanel
          isPending={saveMutation.isPending}
          location={selectedLocation}
          onClose={() => {
            setPanelOpen(false);
            setSelectedLocation(null);
          }}
          onSubmit={(values) => saveMutation.mutateAsync(values)}
        />
      </SidePanel>
    </div>
  );
};
