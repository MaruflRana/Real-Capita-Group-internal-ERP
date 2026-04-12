'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activateCustomer,
  activateLead,
  createBooking,
  createCollection,
  createCustomer,
  createInstallmentSchedules,
  createLead,
  createSaleContract,
  deactivateCustomer,
  deactivateLead,
  getBooking,
  getCollection,
  getCustomer,
  getInstallmentSchedule,
  getLead,
  getSaleContract,
  listBookings,
  listCollections,
  listCrmPostedVouchers,
  listCrmProjects,
  listCrmUnits,
  listCustomers,
  listInstallmentSchedules,
  listLeads,
  listSaleContracts,
  removeInstallmentSchedule,
  updateBooking,
  updateCustomer,
  updateInstallmentSchedule,
  updateLead,
  updateSaleContract,
} from '../../lib/api/crm-property-desk';
import type {
  BookingListQueryParams,
  CreateBookingPayload,
  CreateCollectionPayload,
  CreateCustomerPayload,
  CreateInstallmentSchedulesPayload,
  CreateLeadPayload,
  CreateSaleContractPayload,
  CustomerListQueryParams,
  InstallmentScheduleListQueryParams,
  LeadListQueryParams,
  ProjectListQueryParams,
  SaleContractListQueryParams,
  UnitListQueryParams,
  UpdateBookingPayload,
  UpdateCustomerPayload,
  UpdateInstallmentSchedulePayload,
  UpdateLeadPayload,
  UpdateSaleContractPayload,
  VoucherListQueryParams,
  CollectionListQueryParams,
} from '../../lib/api/types';

const assertCompanyId = (companyId: string | undefined): string => {
  if (!companyId) {
    throw new Error('A company context is required for CRM/property desk operations.');
  }

  return companyId;
};

export const crmPropertyDeskKeys = {
  all: (companyId: string) => ['crm-property-desk', companyId] as const,
  projects: (companyId: string, query: ProjectListQueryParams) =>
    ['crm-property-desk', companyId, 'projects', query] as const,
  units: (companyId: string, query: UnitListQueryParams) =>
    ['crm-property-desk', companyId, 'units', query] as const,
  vouchers: (companyId: string, query: VoucherListQueryParams) =>
    ['crm-property-desk', companyId, 'vouchers', query] as const,
  customers: (companyId: string, query: CustomerListQueryParams) =>
    ['crm-property-desk', companyId, 'customers', query] as const,
  customer: (companyId: string, customerId: string) =>
    ['crm-property-desk', companyId, 'customer', customerId] as const,
  leads: (companyId: string, query: LeadListQueryParams) =>
    ['crm-property-desk', companyId, 'leads', query] as const,
  lead: (companyId: string, leadId: string) =>
    ['crm-property-desk', companyId, 'lead', leadId] as const,
  bookings: (companyId: string, query: BookingListQueryParams) =>
    ['crm-property-desk', companyId, 'bookings', query] as const,
  booking: (companyId: string, bookingId: string) =>
    ['crm-property-desk', companyId, 'booking', bookingId] as const,
  saleContracts: (companyId: string, query: SaleContractListQueryParams) =>
    ['crm-property-desk', companyId, 'sale-contracts', query] as const,
  saleContract: (companyId: string, saleContractId: string) =>
    ['crm-property-desk', companyId, 'sale-contract', saleContractId] as const,
  installmentSchedules: (
    companyId: string,
    query: InstallmentScheduleListQueryParams,
  ) => ['crm-property-desk', companyId, 'installment-schedules', query] as const,
  installmentSchedule: (companyId: string, installmentScheduleId: string) =>
    [
      'crm-property-desk',
      companyId,
      'installment-schedule',
      installmentScheduleId,
    ] as const,
  collections: (companyId: string, query: CollectionListQueryParams) =>
    ['crm-property-desk', companyId, 'collections', query] as const,
  collection: (companyId: string, collectionId: string) =>
    ['crm-property-desk', companyId, 'collection', collectionId] as const,
};

const invalidateCrmPropertyDesk = async (
  queryClient: ReturnType<typeof useQueryClient>,
  companyId: string | undefined,
) => {
  if (!companyId) {
    return;
  }

  await queryClient.invalidateQueries({
    queryKey: crmPropertyDeskKeys.all(companyId),
  });
};

export const useCrmProjects = (
  companyId: string | undefined,
  query: ProjectListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.projects(companyId ?? 'no-company', query),
    queryFn: () => listCrmProjects(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useCrmUnits = (
  companyId: string | undefined,
  query: UnitListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.units(companyId ?? 'no-company', query),
    queryFn: () => listCrmUnits(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useCrmPostedVouchers = (
  companyId: string | undefined,
  query: VoucherListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.vouchers(companyId ?? 'no-company', query),
    queryFn: () => listCrmPostedVouchers(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useCustomers = (
  companyId: string | undefined,
  query: CustomerListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.customers(companyId ?? 'no-company', query),
    queryFn: () => listCustomers(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useCustomer = (
  companyId: string | undefined,
  customerId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.customer(companyId ?? 'no-company', customerId),
    queryFn: () => getCustomer(assertCompanyId(companyId), customerId),
    enabled: enabled && Boolean(companyId) && customerId.length > 0,
  });

export const useSaveCustomer = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      payload,
    }: {
      customerId?: string;
      payload: CreateCustomerPayload | UpdateCustomerPayload;
    }) =>
      customerId
        ? updateCustomer(
            assertCompanyId(companyId),
            customerId,
            payload as UpdateCustomerPayload,
          )
        : createCustomer(
            assertCompanyId(companyId),
            payload as CreateCustomerPayload,
          ),
    onSuccess: async (customer) => {
      if (companyId) {
        queryClient.setQueryData(
          crmPropertyDeskKeys.customer(companyId, customer.id),
          customer,
        );
      }

      await invalidateCrmPropertyDesk(queryClient, companyId);
    },
  });
};

export const useToggleCustomer = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      isActive,
    }: {
      customerId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateCustomer(assertCompanyId(companyId), customerId)
        : activateCustomer(assertCompanyId(companyId), customerId),
    onSuccess: async (customer) => {
      if (companyId) {
        queryClient.setQueryData(
          crmPropertyDeskKeys.customer(companyId, customer.id),
          customer,
        );
      }

      await invalidateCrmPropertyDesk(queryClient, companyId);
    },
  });
};

export const useLeads = (
  companyId: string | undefined,
  query: LeadListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.leads(companyId ?? 'no-company', query),
    queryFn: () => listLeads(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useLead = (
  companyId: string | undefined,
  leadId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.lead(companyId ?? 'no-company', leadId),
    queryFn: () => getLead(assertCompanyId(companyId), leadId),
    enabled: enabled && Boolean(companyId) && leadId.length > 0,
  });

export const useSaveLead = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      payload,
    }: {
      leadId?: string;
      payload: CreateLeadPayload | UpdateLeadPayload;
    }) =>
      leadId
        ? updateLead(assertCompanyId(companyId), leadId, payload as UpdateLeadPayload)
        : createLead(assertCompanyId(companyId), payload as CreateLeadPayload),
    onSuccess: async (lead) => {
      if (companyId) {
        queryClient.setQueryData(crmPropertyDeskKeys.lead(companyId, lead.id), lead);
      }

      await invalidateCrmPropertyDesk(queryClient, companyId);
    },
  });
};

export const useToggleLead = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      isActive,
    }: {
      leadId: string;
      isActive: boolean;
    }) =>
      isActive
        ? deactivateLead(assertCompanyId(companyId), leadId)
        : activateLead(assertCompanyId(companyId), leadId),
    onSuccess: async (lead) => {
      if (companyId) {
        queryClient.setQueryData(crmPropertyDeskKeys.lead(companyId, lead.id), lead);
      }

      await invalidateCrmPropertyDesk(queryClient, companyId);
    },
  });
};

export const useBookings = (
  companyId: string | undefined,
  query: BookingListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.bookings(companyId ?? 'no-company', query),
    queryFn: () => listBookings(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useBooking = (
  companyId: string | undefined,
  bookingId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.booking(companyId ?? 'no-company', bookingId),
    queryFn: () => getBooking(assertCompanyId(companyId), bookingId),
    enabled: enabled && Boolean(companyId) && bookingId.length > 0,
  });

export const useSaveBooking = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId?: string;
      payload: CreateBookingPayload | UpdateBookingPayload;
    }) =>
      bookingId
        ? updateBooking(
            assertCompanyId(companyId),
            bookingId,
            payload as UpdateBookingPayload,
          )
        : createBooking(
            assertCompanyId(companyId),
            payload as CreateBookingPayload,
          ),
    onSuccess: async (booking) => {
      if (companyId) {
        queryClient.setQueryData(
          crmPropertyDeskKeys.booking(companyId, booking.id),
          booking,
        );
      }

      await invalidateCrmPropertyDesk(queryClient, companyId);
    },
  });
};

export const useSaleContracts = (
  companyId: string | undefined,
  query: SaleContractListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.saleContracts(companyId ?? 'no-company', query),
    queryFn: () => listSaleContracts(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useSaleContract = (
  companyId: string | undefined,
  saleContractId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.saleContract(
      companyId ?? 'no-company',
      saleContractId,
    ),
    queryFn: () => getSaleContract(assertCompanyId(companyId), saleContractId),
    enabled: enabled && Boolean(companyId) && saleContractId.length > 0,
  });

export const useSaveSaleContract = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      saleContractId,
      payload,
    }: {
      saleContractId?: string;
      payload: CreateSaleContractPayload | UpdateSaleContractPayload;
    }) =>
      saleContractId
        ? updateSaleContract(
            assertCompanyId(companyId),
            saleContractId,
            payload as UpdateSaleContractPayload,
          )
        : createSaleContract(
            assertCompanyId(companyId),
            payload as CreateSaleContractPayload,
          ),
    onSuccess: async (saleContract) => {
      if (companyId) {
        queryClient.setQueryData(
          crmPropertyDeskKeys.saleContract(companyId, saleContract.id),
          saleContract,
        );
      }

      await invalidateCrmPropertyDesk(queryClient, companyId);
    },
  });
};

export const useInstallmentSchedules = (
  companyId: string | undefined,
  query: InstallmentScheduleListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.installmentSchedules(
      companyId ?? 'no-company',
      query,
    ),
    queryFn: () => listInstallmentSchedules(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useInstallmentSchedule = (
  companyId: string | undefined,
  installmentScheduleId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.installmentSchedule(
      companyId ?? 'no-company',
      installmentScheduleId,
    ),
    queryFn: () =>
      getInstallmentSchedule(assertCompanyId(companyId), installmentScheduleId),
    enabled: enabled && Boolean(companyId) && installmentScheduleId.length > 0,
  });

export const useCreateInstallmentSchedules = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInstallmentSchedulesPayload) =>
      createInstallmentSchedules(assertCompanyId(companyId), payload),
    onSuccess: async () => {
      await invalidateCrmPropertyDesk(queryClient, companyId);
    },
  });
};

export const useUpdateInstallmentSchedule = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      installmentScheduleId,
      payload,
    }: {
      installmentScheduleId: string;
      payload: UpdateInstallmentSchedulePayload;
    }) =>
      updateInstallmentSchedule(
        assertCompanyId(companyId),
        installmentScheduleId,
        payload,
      ),
    onSuccess: async (installmentSchedule) => {
      if (companyId) {
        queryClient.setQueryData(
          crmPropertyDeskKeys.installmentSchedule(companyId, installmentSchedule.id),
          installmentSchedule,
        );
      }

      await invalidateCrmPropertyDesk(queryClient, companyId);
    },
  });
};

export const useRemoveInstallmentSchedule = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (installmentScheduleId: string) =>
      removeInstallmentSchedule(assertCompanyId(companyId), installmentScheduleId),
    onSuccess: async () => {
      await invalidateCrmPropertyDesk(queryClient, companyId);
    },
  });
};

export const useCollections = (
  companyId: string | undefined,
  query: CollectionListQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.collections(companyId ?? 'no-company', query),
    queryFn: () => listCollections(assertCompanyId(companyId), query),
    enabled: enabled && Boolean(companyId),
  });

export const useCollection = (
  companyId: string | undefined,
  collectionId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: crmPropertyDeskKeys.collection(companyId ?? 'no-company', collectionId),
    queryFn: () => getCollection(assertCompanyId(companyId), collectionId),
    enabled: enabled && Boolean(companyId) && collectionId.length > 0,
  });

export const useSaveCollection = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCollectionPayload) =>
      createCollection(assertCompanyId(companyId), payload),
    onSuccess: async (collection) => {
      if (companyId) {
        queryClient.setQueryData(
          crmPropertyDeskKeys.collection(companyId, collection.id),
          collection,
        );
      }

      await invalidateCrmPropertyDesk(queryClient, companyId);
    },
  });
};
