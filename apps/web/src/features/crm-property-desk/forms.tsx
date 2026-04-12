'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@real-capita/ui';

import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { isApiError } from '../../lib/api/client';
import {
  PROPERTY_DESK_LEAD_STATUSES,
  type BookingRecord,
  type CustomerRecord,
  type InstallmentScheduleRecord,
  type LeadRecord,
  type ProjectRecord,
  type SaleContractRecord,
  type UnitRecord,
  type VoucherRecord,
} from '../../lib/api/types';
import { applyApiFormErrors } from '../../lib/forms';
import { formatAccountingAmount, formatDate } from '../../lib/format';
import {
  CrmPropertyDeskQueryErrorBanner,
  FormErrorText,
  KeyValueList,
  RelationBadgeRow,
} from './shared';
import {
  getBookingLabel,
  getCustomerLabel,
  getInstallmentScheduleLabel,
  getProjectLabel,
  getSaleContractLabel,
  getUnitLabel,
  getVoucherLabel,
} from './utils';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/u;
const amountRegex = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u;
const optionalTextSchema = z
  .string()
  .trim()
  .max(1000, 'Value is too long.')
  .optional()
  .or(z.literal(''));
const optionalShortTextSchema = z
  .string()
  .trim()
  .max(120, 'Value is too long.')
  .optional()
  .or(z.literal(''));
const optionalIdSchema = z.string().optional().or(z.literal(''));
const amountSchema = z
  .string()
  .trim()
  .regex(amountRegex, 'Use a non-negative decimal amount with up to 2 decimals.');
const dateSchema = z.string().trim().regex(dateRegex, 'Use YYYY-MM-DD.');

export const customerFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Customer name is required.').max(120),
  email: z.string().trim().email('Enter a valid email address.').optional().or(z.literal('')),
  phone: z.string().trim().max(32, 'Phone must be 32 characters or fewer.').optional().or(z.literal('')),
  address: z.string().trim().max(500, 'Address must be 500 characters or fewer.').optional().or(z.literal('')),
  notes: optionalTextSchema,
});

export const leadFormSchema = z.object({
  projectId: optionalIdSchema,
  fullName: z.string().trim().min(1, 'Lead name is required.').max(120),
  email: z.string().trim().email('Enter a valid email address.').optional().or(z.literal('')),
  phone: z.string().trim().max(32, 'Phone must be 32 characters or fewer.').optional().or(z.literal('')),
  source: optionalShortTextSchema,
  status: z.enum(PROPERTY_DESK_LEAD_STATUSES),
  notes: optionalTextSchema,
});

export const bookingCreateFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  projectId: z.string().min(1, 'Project is required.'),
  unitId: z.string().min(1, 'Unit is required.'),
  bookingDate: dateSchema,
  bookingAmount: amountSchema,
  notes: optionalTextSchema,
});

export const bookingEditFormSchema = z.object({
  notes: optionalTextSchema,
});

export const saleContractCreateFormSchema = z.object({
  bookingId: z.string().min(1, 'Booking is required.'),
  contractDate: dateSchema,
  contractAmount: amountSchema,
  reference: optionalShortTextSchema,
  notes: optionalTextSchema,
});

export const saleContractEditFormSchema = z.object({
  reference: optionalShortTextSchema,
  notes: optionalTextSchema,
});

export const installmentSchedulesCreateFormSchema = z.object({
  saleContractId: z.string().min(1, 'Sale contract is required.'),
  rows: z
    .array(
      z.object({
        sequenceNumber: z.number().int().min(1, 'Sequence must be 1 or greater.'),
        dueDate: dateSchema,
        amount: amountSchema,
        description: z
          .string()
          .trim()
          .max(500, 'Description must be 500 characters or fewer.')
          .optional()
          .or(z.literal('')),
      }),
    )
    .min(1, 'At least one schedule row is required.'),
});

export const installmentScheduleEditFormSchema = z.object({
  sequenceNumber: z.number().int().min(1, 'Sequence must be 1 or greater.'),
  dueDate: dateSchema,
  amount: amountSchema,
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.')
    .optional()
    .or(z.literal('')),
});

export const collectionCreateFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  voucherId: z.string().min(1, 'Voucher is required.'),
  bookingId: optionalIdSchema,
  saleContractId: optionalIdSchema,
  installmentScheduleId: optionalIdSchema,
  collectionDate: dateSchema,
  amount: amountSchema,
  reference: optionalShortTextSchema,
  notes: optionalTextSchema,
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
export type LeadFormValues = z.infer<typeof leadFormSchema>;
export type BookingCreateFormValues = z.infer<typeof bookingCreateFormSchema>;
export type BookingEditFormValues = z.infer<typeof bookingEditFormSchema>;
export type SaleContractCreateFormValues = z.infer<typeof saleContractCreateFormSchema>;
export type SaleContractEditFormValues = z.infer<typeof saleContractEditFormSchema>;
export type InstallmentSchedulesCreateFormValues = z.infer<
  typeof installmentSchedulesCreateFormSchema
>;
export type InstallmentScheduleEditFormValues = z.infer<
  typeof installmentScheduleEditFormSchema
>;
export type CollectionCreateFormValues = z.infer<typeof collectionCreateFormSchema>;

const ReadOnlyField = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-2 text-sm text-foreground">
      {value}
    </div>
  </div>
);

const FormActions = ({
  isPending,
  onClose,
  submitLabel,
}: {
  isPending: boolean;
  onClose: () => void;
  submitLabel: string;
}) => (
  <div className="flex items-center justify-end gap-3">
    <Button onClick={onClose} type="button" variant="outline">
      Cancel
    </Button>
    <Button disabled={isPending} type="submit">
      {isPending ? 'Saving...' : submitLabel}
    </Button>
  </div>
);

const useSubmitErrorHandler = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const handleError = useCallback(
    <TValues extends Record<string, unknown>>(
      setError: ReturnType<typeof useForm<TValues>>['setError'],
      error: unknown,
      fallbackMessage: string,
    ) => {
      if (applyApiFormErrors(setError, error)) {
        return;
      }

      if (isApiError(error)) {
        setSubmitError(error.apiError.message);
        return;
      }

      setSubmitError(fallbackMessage);
    },
    [],
  );

  return {
    submitError,
    clearSubmitError,
    handleError,
  };
};

const EntityContext = ({
  items,
}: {
  items: Array<{
    label: string;
    value: string;
  }>;
}) => <KeyValueList items={items} />;

export const CustomerFormPanel = ({
  customer,
  isPending,
  onClose,
  onSubmit,
}: {
  customer: CustomerRecord | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<unknown>;
}) => {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      fullName: customer?.fullName ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
      notes: customer?.notes ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      fullName: customer?.fullName ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
      notes: customer?.notes ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, customer, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the customer.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <CrmPropertyDeskQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="customer-full-name">Customer name</Label>
        <Input id="customer-full-name" {...form.register('fullName')} />
        <FormErrorText message={form.formState.errors.fullName?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customer-email">Email</Label>
        <Input id="customer-email" {...form.register('email')} />
        <FormErrorText message={form.formState.errors.email?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customer-phone">Phone</Label>
        <Input id="customer-phone" {...form.register('phone')} />
        <FormErrorText message={form.formState.errors.phone?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customer-address">Address</Label>
        <Textarea id="customer-address" {...form.register('address')} />
        <FormErrorText message={form.formState.errors.address?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customer-notes">Notes</Label>
        <Textarea id="customer-notes" {...form.register('notes')} />
        <FormErrorText message={form.formState.errors.notes?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={customer ? 'Save changes' : 'Create customer'}
      />
    </form>
  );
};

export const LeadFormPanel = ({
  lead,
  projects,
  isPending,
  onClose,
  onSubmit,
}: {
  lead: LeadRecord | null;
  projects: ProjectRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: LeadFormValues) => Promise<unknown>;
}) => {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      projectId: lead?.projectId ?? '',
      fullName: lead?.fullName ?? '',
      email: lead?.email ?? '',
      phone: lead?.phone ?? '',
      source: lead?.source ?? '',
      status: lead?.status ?? 'NEW',
      notes: lead?.notes ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();
  const currentProjectId = form.watch('projectId');

  useEffect(() => {
    form.reset({
      projectId: lead?.projectId ?? '',
      fullName: lead?.fullName ?? '',
      email: lead?.email ?? '',
      phone: lead?.phone ?? '',
      source: lead?.source ?? '',
      status: lead?.status ?? 'NEW',
      notes: lead?.notes ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, lead]);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the lead.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <CrmPropertyDeskQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="lead-project">Project</Label>
        <Select id="lead-project" {...form.register('projectId')}>
          <option value="">General lead</option>
          {projects.map((project) => (
            <option
              disabled={!project.isActive && currentProjectId !== project.id}
              key={project.id}
              value={project.id}
            >
              {getProjectLabel(project)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.projectId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-full-name">Lead name</Label>
        <Input id="lead-full-name" {...form.register('fullName')} />
        <FormErrorText message={form.formState.errors.fullName?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-email">Email</Label>
        <Input id="lead-email" {...form.register('email')} />
        <FormErrorText message={form.formState.errors.email?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-phone">Phone</Label>
        <Input id="lead-phone" {...form.register('phone')} />
        <FormErrorText message={form.formState.errors.phone?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-source">Source</Label>
        <Input id="lead-source" {...form.register('source')} />
        <FormErrorText message={form.formState.errors.source?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-status">Status</Label>
        <Select id="lead-status" {...form.register('status')}>
          {PROPERTY_DESK_LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.status?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-notes">Notes</Label>
        <Textarea id="lead-notes" {...form.register('notes')} />
        <FormErrorText message={form.formState.errors.notes?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={lead ? 'Save changes' : 'Create lead'}
      />
    </form>
  );
};

export const BookingCreatePanel = ({
  customers,
  projects,
  units,
  isPending,
  onClose,
  onSubmit,
}: {
  customers: CustomerRecord[];
  projects: ProjectRecord[];
  units: UnitRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: BookingCreateFormValues) => Promise<unknown>;
}) => {
  const form = useForm<BookingCreateFormValues>({
    resolver: zodResolver(bookingCreateFormSchema),
    defaultValues: {
      customerId: '',
      projectId: '',
      unitId: '',
      bookingDate: '',
      bookingAmount: '',
      notes: '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();
  const projectId = form.watch('projectId');
  const unitId = form.watch('unitId');

  const availableUnits = useMemo(
    () =>
      units.filter(
        (unit) =>
          unit.projectId === projectId &&
          unit.isActive &&
          unit.unitStatusCode === 'AVAILABLE',
      ),
    [projectId, units],
  );

  useEffect(() => {
    if (unitId && !availableUnits.some((unit) => unit.id === unitId)) {
      form.setValue('unitId', '');
    }
  }, [availableUnits, form, unitId]);

  const selectedUnit = availableUnits.find((unit) => unit.id === unitId);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to create the booking.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <CrmPropertyDeskQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="booking-customer">Customer</Label>
        <Select id="booking-customer" {...form.register('customerId')}>
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option
              disabled={!customer.isActive}
              key={customer.id}
              value={customer.id}
            >
              {getCustomerLabel(customer)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.customerId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="booking-project">Project</Label>
        <Select id="booking-project" {...form.register('projectId')}>
          <option value="">Select project</option>
          {projects.map((project) => (
            <option disabled={!project.isActive} key={project.id} value={project.id}>
              {getProjectLabel(project)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.projectId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="booking-unit">Unit</Label>
        <Select
          disabled={!projectId}
          id="booking-unit"
          {...form.register('unitId')}
        >
          <option value="">Select unit</option>
          {availableUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {getUnitLabel(unit)} - {unit.unitStatusName}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.unitId?.message} />
      </div>
      {selectedUnit ? (
        <EntityContext
          items={[
            {
              label: 'Hierarchy',
              value: [
                selectedUnit.projectCode,
                selectedUnit.phaseCode,
                selectedUnit.blockCode,
                selectedUnit.zoneCode,
              ]
                .filter((value): value is string => Boolean(value))
                .join(' / '),
            },
            { label: 'Unit type', value: selectedUnit.unitTypeName },
            { label: 'Current unit status', value: selectedUnit.unitStatusName },
          ]}
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="booking-date">Booking date</Label>
        <Input id="booking-date" type="date" {...form.register('bookingDate')} />
        <FormErrorText message={form.formState.errors.bookingDate?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="booking-amount">Booking amount</Label>
        <Input id="booking-amount" inputMode="decimal" {...form.register('bookingAmount')} />
        <FormErrorText message={form.formState.errors.bookingAmount?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="booking-notes">Notes</Label>
        <Textarea id="booking-notes" {...form.register('notes')} />
        <FormErrorText message={form.formState.errors.notes?.message} />
      </div>
      <FormActions isPending={isPending} onClose={onClose} submitLabel="Create booking" />
    </form>
  );
};

export const BookingEditPanel = ({
  booking,
  isPending,
  onClose,
  onSubmit,
}: {
  booking: BookingRecord;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: BookingEditFormValues) => Promise<unknown>;
}) => {
  const form = useForm<BookingEditFormValues>({
    resolver: zodResolver(bookingEditFormSchema),
    defaultValues: {
      notes: booking.notes ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      notes: booking.notes ?? '',
    });
    clearSubmitError();
  }, [booking, clearSubmitError, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to update the booking.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <CrmPropertyDeskQueryErrorBanner message={submitError} /> : null}
      <EntityContext
        items={[
          { label: 'Customer', value: booking.customerName },
          { label: 'Project', value: `${booking.projectCode} - ${booking.projectName}` },
          { label: 'Unit', value: `${booking.unitCode} - ${booking.unitName}` },
          { label: 'Booking date', value: booking.bookingDate },
          { label: 'Booking amount', value: formatAccountingAmount(booking.bookingAmount) },
          { label: 'Booking status', value: booking.status },
        ]}
      />
      <div className="space-y-2">
        <Label htmlFor="booking-edit-notes">Notes</Label>
        <Textarea id="booking-edit-notes" {...form.register('notes')} />
        <FormErrorText message={form.formState.errors.notes?.message} />
      </div>
      <FormActions isPending={isPending} onClose={onClose} submitLabel="Save changes" />
    </form>
  );
};

export const SaleContractCreatePanel = ({
  bookings,
  isPending,
  onClose,
  onSubmit,
}: {
  bookings: BookingRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: SaleContractCreateFormValues) => Promise<unknown>;
}) => {
  const form = useForm<SaleContractCreateFormValues>({
    resolver: zodResolver(saleContractCreateFormSchema),
    defaultValues: {
      bookingId: '',
      contractDate: '',
      contractAmount: '',
      reference: '',
      notes: '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();
  const bookingId = form.watch('bookingId');
  const selectedBooking = bookings.find((booking) => booking.id === bookingId);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to create the sale contract.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <CrmPropertyDeskQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="sale-contract-booking">Booking</Label>
        <Select id="sale-contract-booking" {...form.register('bookingId')}>
          <option value="">Select booking</option>
          {bookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              {getBookingLabel(booking)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.bookingId?.message} />
      </div>
      {selectedBooking ? (
        <EntityContext
          items={[
            { label: 'Customer', value: selectedBooking.customerName },
            { label: 'Project', value: `${selectedBooking.projectCode} - ${selectedBooking.projectName}` },
            { label: 'Unit', value: `${selectedBooking.unitCode} - ${selectedBooking.unitName}` },
            { label: 'Booking amount', value: formatAccountingAmount(selectedBooking.bookingAmount) },
            { label: 'Booking status', value: selectedBooking.status },
            { label: 'Unit status', value: selectedBooking.unitStatusName },
          ]}
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="sale-contract-date">Contract date</Label>
        <Input id="sale-contract-date" type="date" {...form.register('contractDate')} />
        <FormErrorText message={form.formState.errors.contractDate?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sale-contract-amount">Contract amount</Label>
        <Input id="sale-contract-amount" inputMode="decimal" {...form.register('contractAmount')} />
        <FormErrorText message={form.formState.errors.contractAmount?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sale-contract-reference">Reference</Label>
        <Input id="sale-contract-reference" {...form.register('reference')} />
        <FormErrorText message={form.formState.errors.reference?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sale-contract-notes">Notes</Label>
        <Textarea id="sale-contract-notes" {...form.register('notes')} />
        <FormErrorText message={form.formState.errors.notes?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel="Create contract"
      />
    </form>
  );
};

export const SaleContractEditPanel = ({
  saleContract,
  isPending,
  onClose,
  onSubmit,
}: {
  saleContract: SaleContractRecord;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: SaleContractEditFormValues) => Promise<unknown>;
}) => {
  const form = useForm<SaleContractEditFormValues>({
    resolver: zodResolver(saleContractEditFormSchema),
    defaultValues: {
      reference: saleContract.reference ?? '',
      notes: saleContract.notes ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      reference: saleContract.reference ?? '',
      notes: saleContract.notes ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, saleContract]);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to update the sale contract.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <CrmPropertyDeskQueryErrorBanner message={submitError} /> : null}
      <EntityContext
        items={[
          { label: 'Customer', value: saleContract.customerName },
          { label: 'Project', value: `${saleContract.projectCode} - ${saleContract.projectName}` },
          { label: 'Unit', value: `${saleContract.unitCode} - ${saleContract.unitName}` },
          { label: 'Booking amount', value: formatAccountingAmount(saleContract.bookingAmount) },
          { label: 'Contract amount', value: formatAccountingAmount(saleContract.contractAmount) },
          { label: 'Contract date', value: saleContract.contractDate },
        ]}
      />
      <div className="space-y-2">
        <Label htmlFor="sale-contract-edit-reference">Reference</Label>
        <Input id="sale-contract-edit-reference" {...form.register('reference')} />
        <FormErrorText message={form.formState.errors.reference?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sale-contract-edit-notes">Notes</Label>
        <Textarea id="sale-contract-edit-notes" {...form.register('notes')} />
        <FormErrorText message={form.formState.errors.notes?.message} />
      </div>
      <FormActions isPending={isPending} onClose={onClose} submitLabel="Save changes" />
    </form>
  );
};

export const InstallmentSchedulesCreatePanel = ({
  saleContracts,
  isPending,
  onClose,
  onSubmit,
}: {
  saleContracts: SaleContractRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: InstallmentSchedulesCreateFormValues) => Promise<unknown>;
}) => {
  const form = useForm<InstallmentSchedulesCreateFormValues>({
    resolver: zodResolver(installmentSchedulesCreateFormSchema),
    defaultValues: {
      saleContractId: '',
      rows: [
        {
          sequenceNumber: 1,
          dueDate: '',
          amount: '',
          description: '',
        },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rows',
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();
  const saleContractId = form.watch('saleContractId');
  const selectedSaleContract = saleContracts.find(
    (saleContract) => saleContract.id === saleContractId,
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(
        form.setError,
        error,
        'Unable to create installment schedules.',
      );
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <CrmPropertyDeskQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="installment-sale-contract">Sale contract</Label>
        <Select id="installment-sale-contract" {...form.register('saleContractId')}>
          <option value="">Select sale contract</option>
          {saleContracts.map((saleContract) => (
            <option key={saleContract.id} value={saleContract.id}>
              {getSaleContractLabel(saleContract)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.saleContractId?.message} />
      </div>
      {selectedSaleContract ? (
        <EntityContext
          items={[
            { label: 'Customer', value: selectedSaleContract.customerName },
            { label: 'Project', value: `${selectedSaleContract.projectCode} - ${selectedSaleContract.projectName}` },
            { label: 'Unit', value: `${selectedSaleContract.unitCode} - ${selectedSaleContract.unitName}` },
            { label: 'Contract amount', value: formatAccountingAmount(selectedSaleContract.contractAmount) },
            { label: 'Reference', value: selectedSaleContract.reference || 'No reference' },
          ]}
        />
      ) : null}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            className="space-y-4 rounded-2xl border border-border/70 p-4"
            key={field.id}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Schedule row {index + 1}
              </p>
              {fields.length > 1 ? (
                <Button
                  onClick={() => remove(index)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`schedule-sequence-${index}`}>Sequence</Label>
                <Input
                  id={`schedule-sequence-${index}`}
                  type="number"
                  {...form.register(`rows.${index}.sequenceNumber`, {
                    valueAsNumber: true,
                  })}
                />
                <FormErrorText
                  message={form.formState.errors.rows?.[index]?.sequenceNumber?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`schedule-date-${index}`}>Due date</Label>
                <Input
                  id={`schedule-date-${index}`}
                  type="date"
                  {...form.register(`rows.${index}.dueDate`)}
                />
                <FormErrorText
                  message={form.formState.errors.rows?.[index]?.dueDate?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`schedule-amount-${index}`}>Amount</Label>
                <Input
                  id={`schedule-amount-${index}`}
                  inputMode="decimal"
                  {...form.register(`rows.${index}.amount`)}
                />
                <FormErrorText
                  message={form.formState.errors.rows?.[index]?.amount?.message}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`schedule-description-${index}`}>Description</Label>
              <Textarea
                id={`schedule-description-${index}`}
                {...form.register(`rows.${index}.description`)}
              />
              <FormErrorText
                message={form.formState.errors.rows?.[index]?.description?.message}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-start">
        <Button
          onClick={() =>
            append({
              sequenceNumber: fields.length + 1,
              dueDate: '',
              amount: '',
              description: '',
            })
          }
          type="button"
          variant="outline"
        >
          Add row
        </Button>
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel="Create schedules"
      />
    </form>
  );
};

export const InstallmentScheduleEditPanel = ({
  schedule,
  isPending,
  onClose,
  onSubmit,
}: {
  schedule: InstallmentScheduleRecord;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: InstallmentScheduleEditFormValues) => Promise<unknown>;
}) => {
  const form = useForm<InstallmentScheduleEditFormValues>({
    resolver: zodResolver(installmentScheduleEditFormSchema),
    defaultValues: {
      sequenceNumber: schedule.sequenceNumber,
      dueDate: schedule.dueDate,
      amount: schedule.amount,
      description: schedule.description ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      sequenceNumber: schedule.sequenceNumber,
      dueDate: schedule.dueDate,
      amount: schedule.amount,
      description: schedule.description ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, schedule]);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(
        form.setError,
        error,
        'Unable to update the installment schedule.',
      );
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <CrmPropertyDeskQueryErrorBanner message={submitError} /> : null}
      <EntityContext
        items={[
          { label: 'Customer', value: schedule.customerName },
          { label: 'Project', value: `${schedule.projectCode} - ${schedule.projectName}` },
          { label: 'Unit', value: `${schedule.unitCode} - ${schedule.unitName}` },
          { label: 'Collected', value: formatAccountingAmount(schedule.collectedAmount) },
          { label: 'Balance', value: formatAccountingAmount(schedule.balanceAmount) },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="edit-schedule-sequence">Sequence</Label>
          <Input
            id="edit-schedule-sequence"
            type="number"
            {...form.register('sequenceNumber', { valueAsNumber: true })}
          />
          <FormErrorText message={form.formState.errors.sequenceNumber?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-schedule-date">Due date</Label>
          <Input id="edit-schedule-date" type="date" {...form.register('dueDate')} />
          <FormErrorText message={form.formState.errors.dueDate?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-schedule-amount">Amount</Label>
          <Input
            id="edit-schedule-amount"
            inputMode="decimal"
            {...form.register('amount')}
          />
          <FormErrorText message={form.formState.errors.amount?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-schedule-description">Description</Label>
        <Textarea id="edit-schedule-description" {...form.register('description')} />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <FormActions isPending={isPending} onClose={onClose} submitLabel="Save changes" />
    </form>
  );
};

export const CollectionCreatePanel = ({
  customers,
  vouchers,
  bookings,
  saleContracts,
  schedules,
  isPending,
  onClose,
  onSubmit,
}: {
  customers: CustomerRecord[];
  vouchers: VoucherRecord[];
  bookings: BookingRecord[];
  saleContracts: SaleContractRecord[];
  schedules: InstallmentScheduleRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: CollectionCreateFormValues) => Promise<unknown>;
}) => {
  const form = useForm<CollectionCreateFormValues>({
    resolver: zodResolver(collectionCreateFormSchema),
    defaultValues: {
      customerId: '',
      voucherId: '',
      bookingId: '',
      saleContractId: '',
      installmentScheduleId: '',
      collectionDate: '',
      amount: '',
      reference: '',
      notes: '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();
  const customerId = form.watch('customerId');
  const bookingId = form.watch('bookingId');
  const saleContractId = form.watch('saleContractId');
  const installmentScheduleId = form.watch('installmentScheduleId');
  const voucherId = form.watch('voucherId');

  const availableBookings = useMemo(
    () => bookings.filter((booking) => booking.customerId === customerId),
    [bookings, customerId],
  );
  const availableSaleContracts = useMemo(
    () =>
      saleContracts.filter(
        (saleContract) =>
          saleContract.customerId === customerId &&
          (!bookingId || saleContract.bookingId === bookingId),
      ),
    [bookingId, customerId, saleContracts],
  );
  const availableSchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) =>
          schedule.customerId === customerId &&
          (!saleContractId || schedule.saleContractId === saleContractId) &&
          (!bookingId || schedule.bookingId === bookingId),
      ),
    [bookingId, customerId, saleContractId, schedules],
  );

  useEffect(() => {
    if (bookingId && !availableBookings.some((booking) => booking.id === bookingId)) {
      form.setValue('bookingId', '');
    }
  }, [availableBookings, bookingId, form]);

  useEffect(() => {
    if (
      saleContractId &&
      !availableSaleContracts.some((saleContract) => saleContract.id === saleContractId)
    ) {
      form.setValue('saleContractId', '');
    }
  }, [availableSaleContracts, form, saleContractId]);

  useEffect(() => {
    if (
      installmentScheduleId &&
      !availableSchedules.some((schedule) => schedule.id === installmentScheduleId)
    ) {
      form.setValue('installmentScheduleId', '');
    }
  }, [availableSchedules, form, installmentScheduleId]);

  useEffect(() => {
    if (!saleContractId) {
      return;
    }

    const linkedContract = availableSaleContracts.find(
      (saleContract) => saleContract.id === saleContractId,
    );

    if (linkedContract && linkedContract.bookingId !== bookingId) {
      form.setValue('bookingId', linkedContract.bookingId);
    }
  }, [availableSaleContracts, bookingId, form, saleContractId]);

  useEffect(() => {
    if (!installmentScheduleId) {
      return;
    }

    const linkedSchedule = availableSchedules.find(
      (schedule) => schedule.id === installmentScheduleId,
    );

    if (!linkedSchedule) {
      return;
    }

    if (linkedSchedule.saleContractId !== saleContractId) {
      form.setValue('saleContractId', linkedSchedule.saleContractId);
    }

    if (linkedSchedule.bookingId !== bookingId) {
      form.setValue('bookingId', linkedSchedule.bookingId);
    }
  }, [availableSchedules, bookingId, form, installmentScheduleId, saleContractId]);

  const selectedVoucher = vouchers.find((voucher) => voucher.id === voucherId);
  const selectedBooking = availableBookings.find((booking) => booking.id === bookingId);
  const selectedSaleContract = availableSaleContracts.find(
    (saleContract) => saleContract.id === saleContractId,
  );
  const selectedSchedule = availableSchedules.find(
    (schedule) => schedule.id === installmentScheduleId,
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to create the collection.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <CrmPropertyDeskQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="collection-customer">Customer</Label>
        <Select id="collection-customer" {...form.register('customerId')}>
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {getCustomerLabel(customer)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.customerId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="collection-voucher">Posted voucher</Label>
        <Select id="collection-voucher" {...form.register('voucherId')}>
          <option value="">Select posted voucher</option>
          {vouchers.map((voucher) => (
            <option key={voucher.id} value={voucher.id}>
              {getVoucherLabel(voucher)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.voucherId?.message} />
      </div>
      {selectedVoucher ? (
        <EntityContext
          items={[
            { label: 'Voucher date', value: formatDate(selectedVoucher.voucherDate) },
            { label: 'Voucher reference', value: selectedVoucher.reference || 'No reference' },
            { label: 'Voucher totals', value: formatAccountingAmount(selectedVoucher.totalDebit) },
          ]}
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="collection-booking">Booking</Label>
        <Select
          disabled={!customerId}
          id="collection-booking"
          {...form.register('bookingId')}
        >
          <option value="">No booking link</option>
          {availableBookings.map((booking) => (
            <option key={booking.id} value={booking.id}>
              {getBookingLabel(booking)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.bookingId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="collection-sale-contract">Sale contract</Label>
        <Select
          disabled={!customerId}
          id="collection-sale-contract"
          {...form.register('saleContractId')}
        >
          <option value="">No sale contract link</option>
          {availableSaleContracts.map((saleContract) => (
            <option key={saleContract.id} value={saleContract.id}>
              {getSaleContractLabel(saleContract)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.saleContractId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="collection-installment-schedule">Installment schedule</Label>
        <Select
          disabled={!customerId}
          id="collection-installment-schedule"
          {...form.register('installmentScheduleId')}
        >
          <option value="">No installment link</option>
          {availableSchedules.map((schedule) => (
            <option key={schedule.id} value={schedule.id}>
              {getInstallmentScheduleLabel(schedule)}
            </option>
          ))}
        </Select>
        <FormErrorText
          message={form.formState.errors.installmentScheduleId?.message}
        />
      </div>
      <RelationBadgeRow
        items={[
          selectedBooking ? `${selectedBooking.unitCode} booking` : null,
          selectedSaleContract ? `${selectedSaleContract.unitCode} contract` : null,
          selectedSchedule ? `Installment #${selectedSchedule.sequenceNumber}` : null,
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="collection-date">Collection date</Label>
          <Input id="collection-date" type="date" {...form.register('collectionDate')} />
          <FormErrorText message={form.formState.errors.collectionDate?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="collection-amount">Collection amount</Label>
          <Input
            id="collection-amount"
            inputMode="decimal"
            {...form.register('amount')}
          />
          <FormErrorText message={form.formState.errors.amount?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="collection-reference">Reference</Label>
        <Input id="collection-reference" {...form.register('reference')} />
        <FormErrorText message={form.formState.errors.reference?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="collection-notes">Notes</Label>
        <Textarea id="collection-notes" {...form.register('notes')} />
        <FormErrorText message={form.formState.errors.notes?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel="Create collection"
      />
    </form>
  );
};

export const CollectionDetailPanel = ({
  collection,
  booking,
  saleContract,
  schedule,
  voucher,
  onClose,
}: {
  collection: {
    customerName: string;
    collectionDate: string;
    amount: string;
    reference: string | null;
    notes: string | null;
  };
  booking?: BookingRecord | null;
  saleContract?: SaleContractRecord | null;
  schedule?: InstallmentScheduleRecord | null;
  voucher?: VoucherRecord | null;
  onClose: () => void;
}) => (
  <div className="space-y-5">
    <EntityContext
      items={[
        { label: 'Customer', value: collection.customerName },
        { label: 'Collection date', value: collection.collectionDate },
        { label: 'Amount', value: formatAccountingAmount(collection.amount) },
        { label: 'Reference', value: collection.reference || 'No reference' },
      ]}
    />
    <RelationBadgeRow
      items={[
        booking ? getBookingLabel(booking) : null,
        saleContract ? getSaleContractLabel(saleContract) : null,
        schedule ? getInstallmentScheduleLabel(schedule) : null,
        voucher ? getVoucherLabel(voucher) : null,
      ]}
    />
    <div className="space-y-2">
      <Label>Notes</Label>
      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-foreground">
        {collection.notes || 'No notes'}
      </div>
    </div>
    <div className="flex justify-end">
      <Button onClick={onClose} type="button" variant="outline">
        Close
      </Button>
    </div>
  </div>
);

export const ReadOnlyBookingContext = ({
  booking,
}: {
  booking: BookingRecord;
}) => (
  <div className="space-y-4">
    <ReadOnlyField label="Customer" value={booking.customerName} />
    <ReadOnlyField
      label="Project"
      value={`${booking.projectCode} - ${booking.projectName}`}
    />
    <ReadOnlyField label="Unit" value={`${booking.unitCode} - ${booking.unitName}`} />
    <ReadOnlyField
      label="Booking amount"
      value={formatAccountingAmount(booking.bookingAmount)}
    />
  </div>
);
