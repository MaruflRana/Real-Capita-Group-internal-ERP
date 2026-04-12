import { apiRequest } from './client';
import { buildQueryString } from './query-string';

import type {
  BookingListQueryParams,
  BookingRecord,
  CollectionListQueryParams,
  CollectionRecord,
  CreateBookingPayload,
  CreateCollectionPayload,
  CreateCustomerPayload,
  CreateInstallmentSchedulesPayload,
  CreateLeadPayload,
  CreateSaleContractPayload,
  CustomerListQueryParams,
  CustomerRecord,
  InstallmentScheduleListQueryParams,
  InstallmentScheduleRecord,
  LeadListQueryParams,
  LeadRecord,
  PaginatedResponse,
  ProjectListQueryParams,
  ProjectRecord,
  SaleContractListQueryParams,
  SaleContractRecord,
  UnitListQueryParams,
  UnitRecord,
  UpdateBookingPayload,
  UpdateCustomerPayload,
  UpdateInstallmentSchedulePayload,
  UpdateLeadPayload,
  UpdateSaleContractPayload,
  VoucherListQueryParams,
  VoucherRecord,
} from './types';

export const listCrmProjects = (
  companyId: string,
  query: ProjectListQueryParams,
) =>
  apiRequest<PaginatedResponse<ProjectRecord>>(
    `companies/${companyId}/crm-property-desk/references/projects${buildQueryString(query)}`,
  );

export const listCrmUnits = (companyId: string, query: UnitListQueryParams) =>
  apiRequest<PaginatedResponse<UnitRecord>>(
    `companies/${companyId}/crm-property-desk/references/units${buildQueryString(query)}`,
  );

export const listCrmPostedVouchers = (
  companyId: string,
  query: VoucherListQueryParams,
) =>
  apiRequest<PaginatedResponse<VoucherRecord>>(
    `companies/${companyId}/crm-property-desk/references/vouchers${buildQueryString(query)}`,
  );

export const listCustomers = (
  companyId: string,
  query: CustomerListQueryParams,
) =>
  apiRequest<PaginatedResponse<CustomerRecord>>(
    `companies/${companyId}/customers${buildQueryString(query)}`,
  );

export const getCustomer = (companyId: string, customerId: string) =>
  apiRequest<CustomerRecord>(`companies/${companyId}/customers/${customerId}`);

export const createCustomer = (
  companyId: string,
  payload: CreateCustomerPayload,
) =>
  apiRequest<CustomerRecord>(`companies/${companyId}/customers`, {
    method: 'POST',
    body: payload,
  });

export const updateCustomer = (
  companyId: string,
  customerId: string,
  payload: UpdateCustomerPayload,
) =>
  apiRequest<CustomerRecord>(`companies/${companyId}/customers/${customerId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateCustomer = (companyId: string, customerId: string) =>
  apiRequest<CustomerRecord>(
    `companies/${companyId}/customers/${customerId}/activate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const deactivateCustomer = (companyId: string, customerId: string) =>
  apiRequest<CustomerRecord>(
    `companies/${companyId}/customers/${customerId}/deactivate`,
    {
      method: 'POST',
      body: {},
    },
  );

export const listLeads = (companyId: string, query: LeadListQueryParams) =>
  apiRequest<PaginatedResponse<LeadRecord>>(
    `companies/${companyId}/leads${buildQueryString(query)}`,
  );

export const getLead = (companyId: string, leadId: string) =>
  apiRequest<LeadRecord>(`companies/${companyId}/leads/${leadId}`);

export const createLead = (companyId: string, payload: CreateLeadPayload) =>
  apiRequest<LeadRecord>(`companies/${companyId}/leads`, {
    method: 'POST',
    body: payload,
  });

export const updateLead = (
  companyId: string,
  leadId: string,
  payload: UpdateLeadPayload,
) =>
  apiRequest<LeadRecord>(`companies/${companyId}/leads/${leadId}`, {
    method: 'PATCH',
    body: payload,
  });

export const activateLead = (companyId: string, leadId: string) =>
  apiRequest<LeadRecord>(`companies/${companyId}/leads/${leadId}/activate`, {
    method: 'POST',
    body: {},
  });

export const deactivateLead = (companyId: string, leadId: string) =>
  apiRequest<LeadRecord>(`companies/${companyId}/leads/${leadId}/deactivate`, {
    method: 'POST',
    body: {},
  });

export const listBookings = (
  companyId: string,
  query: BookingListQueryParams,
) =>
  apiRequest<PaginatedResponse<BookingRecord>>(
    `companies/${companyId}/bookings${buildQueryString(query)}`,
  );

export const getBooking = (companyId: string, bookingId: string) =>
  apiRequest<BookingRecord>(`companies/${companyId}/bookings/${bookingId}`);

export const createBooking = (
  companyId: string,
  payload: CreateBookingPayload,
) =>
  apiRequest<BookingRecord>(`companies/${companyId}/bookings`, {
    method: 'POST',
    body: payload,
  });

export const updateBooking = (
  companyId: string,
  bookingId: string,
  payload: UpdateBookingPayload,
) =>
  apiRequest<BookingRecord>(`companies/${companyId}/bookings/${bookingId}`, {
    method: 'PATCH',
    body: payload,
  });

export const listSaleContracts = (
  companyId: string,
  query: SaleContractListQueryParams,
) =>
  apiRequest<PaginatedResponse<SaleContractRecord>>(
    `companies/${companyId}/sale-contracts${buildQueryString(query)}`,
  );

export const getSaleContract = (companyId: string, saleContractId: string) =>
  apiRequest<SaleContractRecord>(
    `companies/${companyId}/sale-contracts/${saleContractId}`,
  );

export const createSaleContract = (
  companyId: string,
  payload: CreateSaleContractPayload,
) =>
  apiRequest<SaleContractRecord>(`companies/${companyId}/sale-contracts`, {
    method: 'POST',
    body: payload,
  });

export const updateSaleContract = (
  companyId: string,
  saleContractId: string,
  payload: UpdateSaleContractPayload,
) =>
  apiRequest<SaleContractRecord>(
    `companies/${companyId}/sale-contracts/${saleContractId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const listInstallmentSchedules = (
  companyId: string,
  query: InstallmentScheduleListQueryParams,
) =>
  apiRequest<PaginatedResponse<InstallmentScheduleRecord>>(
    `companies/${companyId}/installment-schedules${buildQueryString(query)}`,
  );

export const getInstallmentSchedule = (
  companyId: string,
  installmentScheduleId: string,
) =>
  apiRequest<InstallmentScheduleRecord>(
    `companies/${companyId}/installment-schedules/${installmentScheduleId}`,
  );

export const createInstallmentSchedules = (
  companyId: string,
  payload: CreateInstallmentSchedulesPayload,
) =>
  apiRequest<PaginatedResponse<InstallmentScheduleRecord>>(
    `companies/${companyId}/installment-schedules`,
    {
      method: 'POST',
      body: payload,
    },
  );

export const updateInstallmentSchedule = (
  companyId: string,
  installmentScheduleId: string,
  payload: UpdateInstallmentSchedulePayload,
) =>
  apiRequest<InstallmentScheduleRecord>(
    `companies/${companyId}/installment-schedules/${installmentScheduleId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );

export const removeInstallmentSchedule = (
  companyId: string,
  installmentScheduleId: string,
) =>
  apiRequest<InstallmentScheduleRecord>(
    `companies/${companyId}/installment-schedules/${installmentScheduleId}`,
    {
      method: 'DELETE',
    },
  );

export const listCollections = (
  companyId: string,
  query: CollectionListQueryParams,
) =>
  apiRequest<PaginatedResponse<CollectionRecord>>(
    `companies/${companyId}/collections${buildQueryString(query)}`,
  );

export const getCollection = (companyId: string, collectionId: string) =>
  apiRequest<CollectionRecord>(`companies/${companyId}/collections/${collectionId}`);

export const createCollection = (
  companyId: string,
  payload: CreateCollectionPayload,
) =>
  apiRequest<CollectionRecord>(`companies/${companyId}/collections`, {
    method: 'POST',
    body: payload,
  });
