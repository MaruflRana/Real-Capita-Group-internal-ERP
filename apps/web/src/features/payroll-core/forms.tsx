'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FieldValues, UseFormSetError } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@real-capita/ui';

import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { isApiError } from '../../lib/api/client';
import { applyApiFormErrors } from '../../lib/forms';
import { formatAccountingAmount, formatDate } from '../../lib/format';
import type {
  CostCenterRecord,
  EmployeeRecord,
  ParticularAccountRecord,
  PayrollRunLineRecord,
  PayrollRunRecord,
  ProjectRecord,
  SalaryStructureRecord,
} from '../../lib/api/types';
import {
  FormErrorText,
  KeyValueList,
  PayrollCoreQueryErrorBanner,
  PayrollCoreReadOnlyNotice,
  RelationBadgeRow,
} from './shared';
import {
  PAYROLL_MONTH_OPTIONS,
  buildPayrollAmountPreview,
  buildPayrollYearOptions,
  formatPayrollPeriodLabel,
  getCostCenterLabel,
  getEmployeeLabel,
  getParticularAccountLabel,
  getPayrollReferencePreview,
  getProjectLabel,
  parseAmount,
  toFixedAmountString,
} from './utils';

const amountRegex = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/u;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/u;
const optionalIdSchema = z.string().optional().or(z.literal(''));
const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Description must be 500 characters or fewer.')
  .optional()
  .or(z.literal(''));

const amountFieldSchema = z
  .string()
  .trim()
  .regex(amountRegex, 'Use a non-negative amount with up to 2 decimals.');

type PayrollAmountFields = {
  basicAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
};

const payrollAmountsSchema = z.object({
  basicAmount: amountFieldSchema,
  allowanceAmount: amountFieldSchema,
  deductionAmount: amountFieldSchema,
});

const addPayrollAmountIssues = (
  values: PayrollAmountFields,
  context: z.RefinementCtx,
) => {
  if (
    !amountRegex.test(values.basicAmount.trim()) ||
    !amountRegex.test(values.allowanceAmount.trim()) ||
    !amountRegex.test(values.deductionAmount.trim())
  ) {
    return;
  }

  const preview = buildPayrollAmountPreview(values);

  if (!preview.hasPositiveGross) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['basicAmount'],
      message: 'Payroll amounts must include a positive gross amount.',
    });
  }

  if (preview.hasExcessDeduction) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['deductionAmount'],
      message:
        'Deduction amount cannot exceed basic amount plus allowance amount.',
    });
  }
};

export const salaryStructureFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'Salary structure code is required.')
      .max(50, 'Salary structure code must be 50 characters or fewer.'),
    name: z
      .string()
      .trim()
      .min(1, 'Salary structure name is required.')
      .max(120, 'Salary structure name must be 120 characters or fewer.'),
    description: optionalDescriptionSchema,
    basicAmount: payrollAmountsSchema.shape.basicAmount,
    allowanceAmount: payrollAmountsSchema.shape.allowanceAmount,
    deductionAmount: payrollAmountsSchema.shape.deductionAmount,
  })
  .superRefine(addPayrollAmountIssues);

export const payrollRunFormSchema = z.object({
  payrollYear: z
    .number()
    .int('Use a whole year value.')
    .min(2000, 'Payroll year must be 2000 or later.')
    .max(9999, 'Payroll year must be 9999 or earlier.'),
  payrollMonth: z
    .number()
    .int('Select a valid payroll month.')
    .min(1, 'Select a valid payroll month.')
    .max(12, 'Select a valid payroll month.'),
  projectId: optionalIdSchema,
  costCenterId: optionalIdSchema,
  description: optionalDescriptionSchema,
});

export const payrollRunLineFormSchema = z
  .object({
    employeeId: z.string().min(1, 'Employee is required.'),
    basicAmount: amountFieldSchema,
    allowanceAmount: amountFieldSchema,
    deductionAmount: amountFieldSchema,
  })
  .superRefine(addPayrollAmountIssues);

export const payrollPostingFormSchema = (requiresDeductionAccount: boolean) =>
  z
    .object({
      voucherDate: z.string().trim().regex(dateRegex, 'Use YYYY-MM-DD.'),
      expenseParticularAccountId: z
        .string()
        .min(1, 'Gross expense account is required.'),
      payableParticularAccountId: z
        .string()
        .min(1, 'Payroll payable account is required.'),
      deductionParticularAccountId: optionalIdSchema,
    })
    .superRefine((values, context) => {
      if (
        requiresDeductionAccount &&
        (!values.deductionParticularAccountId ||
          values.deductionParticularAccountId.length === 0)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['deductionParticularAccountId'],
          message:
            'A deduction liability account is required when payroll deductions are present.',
        });
      }
    });

export type SalaryStructureFormValues = z.infer<typeof salaryStructureFormSchema>;
export type PayrollRunFormValues = z.infer<typeof payrollRunFormSchema>;
export type PayrollRunLineFormValues = z.infer<typeof payrollRunLineFormSchema>;
export type PayrollPostingFormValues = z.infer<
  ReturnType<typeof payrollPostingFormSchema>
>;

export const buildPayrollAmountPayload = (values: {
  basicAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
}) => {
  const preview = buildPayrollAmountPreview(values);

  return {
    basicAmount: toFixedAmountString(values.basicAmount),
    allowanceAmount: toFixedAmountString(values.allowanceAmount),
    deductionAmount: toFixedAmountString(values.deductionAmount),
    netAmount: preview.net.toFixed(2),
  };
};

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
    <TFieldValues extends FieldValues>(
      setError: UseFormSetError<TFieldValues>,
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

const buildDefaultVoucherDate = (payrollRun: PayrollRunRecord) =>
  new Date(Date.UTC(payrollRun.payrollYear, payrollRun.payrollMonth, 0))
    .toISOString()
    .slice(0, 10);

export const SalaryStructureFormPanel = ({
  salaryStructure,
  isPending,
  onClose,
  onSubmit,
}: {
  salaryStructure: SalaryStructureRecord | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: SalaryStructureFormValues) => Promise<unknown>;
}) => {
  const form = useForm<SalaryStructureFormValues>({
    resolver: zodResolver(salaryStructureFormSchema),
    defaultValues: {
      code: salaryStructure?.code ?? '',
      name: salaryStructure?.name ?? '',
      description: salaryStructure?.description ?? '',
      basicAmount: salaryStructure?.basicAmount ?? '0.00',
      allowanceAmount: salaryStructure?.allowanceAmount ?? '0.00',
      deductionAmount: salaryStructure?.deductionAmount ?? '0.00',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      code: salaryStructure?.code ?? '',
      name: salaryStructure?.name ?? '',
      description: salaryStructure?.description ?? '',
      basicAmount: salaryStructure?.basicAmount ?? '0.00',
      allowanceAmount: salaryStructure?.allowanceAmount ?? '0.00',
      deductionAmount: salaryStructure?.deductionAmount ?? '0.00',
    });
    clearSubmitError();
  }, [clearSubmitError, form, salaryStructure]);

  const amountPreview = buildPayrollAmountPreview({
    basicAmount: form.watch('basicAmount'),
    allowanceAmount: form.watch('allowanceAmount'),
    deductionAmount: form.watch('deductionAmount'),
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the salary structure.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <PayrollCoreQueryErrorBanner message={submitError} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="salary-structure-code">Structure code</Label>
          <Input id="salary-structure-code" {...form.register('code')} />
          <FormErrorText message={form.formState.errors.code?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary-structure-name">Structure name</Label>
          <Input id="salary-structure-name" {...form.register('name')} />
          <FormErrorText message={form.formState.errors.name?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="salary-structure-description">Description</Label>
        <Textarea
          id="salary-structure-description"
          {...form.register('description')}
        />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="salary-structure-basic-amount">Basic amount</Label>
          <Input
            id="salary-structure-basic-amount"
            inputMode="decimal"
            {...form.register('basicAmount')}
          />
          <FormErrorText message={form.formState.errors.basicAmount?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary-structure-allowance-amount">
            Allowance amount
          </Label>
          <Input
            id="salary-structure-allowance-amount"
            inputMode="decimal"
            {...form.register('allowanceAmount')}
          />
          <FormErrorText
            message={form.formState.errors.allowanceAmount?.message}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary-structure-deduction-amount">
            Deduction amount
          </Label>
          <Input
            id="salary-structure-deduction-amount"
            inputMode="decimal"
            {...form.register('deductionAmount')}
          />
          <FormErrorText
            message={form.formState.errors.deductionAmount?.message}
          />
        </div>
      </div>
      <EntityContext
        items={[
          {
            label: 'Gross preview',
            value: amountPreview.grossLabel,
          },
          {
            label: 'Net preview',
            value: amountPreview.netLabel,
          },
          {
            label: 'Deductions',
            value: amountPreview.deductionLabel,
          },
        ]}
      />
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={salaryStructure ? 'Save changes' : 'Create salary structure'}
      />
    </form>
  );
};

export const PayrollRunFormPanel = ({
  payrollRun,
  projects,
  costCenters,
  isPending,
  onClose,
  onSubmit,
}: {
  payrollRun: PayrollRunRecord | null;
  projects: ProjectRecord[];
  costCenters: CostCenterRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: PayrollRunFormValues) => Promise<unknown>;
}) => {
  const currentDate = useMemo(() => new Date(), []);
  const form = useForm<PayrollRunFormValues>({
    resolver: zodResolver(payrollRunFormSchema),
    defaultValues: {
      payrollYear: payrollRun?.payrollYear ?? currentDate.getUTCFullYear(),
      payrollMonth: payrollRun?.payrollMonth ?? currentDate.getUTCMonth() + 1,
      projectId: payrollRun?.projectId ?? '',
      costCenterId: payrollRun?.costCenterId ?? '',
      description: payrollRun?.description ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      payrollYear: payrollRun?.payrollYear ?? currentDate.getUTCFullYear(),
      payrollMonth: payrollRun?.payrollMonth ?? currentDate.getUTCMonth() + 1,
      projectId: payrollRun?.projectId ?? '',
      costCenterId: payrollRun?.costCenterId ?? '',
      description: payrollRun?.description ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, currentDate, form, payrollRun]);

  const selectedProjectId = form.watch('projectId');
  const selectedCostCenterId = form.watch('costCenterId');
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const selectedCostCenter = costCenters.find(
    (costCenter) => costCenter.id === selectedCostCenterId,
  );

  const filteredCostCenters = useMemo(
    () =>
      costCenters.filter(
        (costCenter) =>
          !selectedProjectId ||
          !costCenter.projectId ||
          costCenter.projectId === selectedProjectId ||
          costCenter.id === selectedCostCenterId,
      ),
    [costCenters, selectedCostCenterId, selectedProjectId],
  );

  useEffect(() => {
    if (!selectedCostCenter || !selectedCostCenter.projectId) {
      return;
    }

    if (!selectedProjectId || selectedProjectId !== selectedCostCenter.projectId) {
      form.setValue('projectId', selectedCostCenter.projectId, {
        shouldDirty: true,
      });
    }
  }, [form, selectedCostCenter, selectedProjectId]);

  useEffect(() => {
    if (
      selectedProjectId &&
      selectedCostCenter &&
      selectedCostCenter.projectId &&
      selectedCostCenter.projectId !== selectedProjectId
    ) {
      form.setValue('costCenterId', '', {
        shouldDirty: true,
      });
    }
  }, [form, selectedCostCenter, selectedProjectId]);

  const payrollYear = form.watch('payrollYear');
  const payrollMonth = form.watch('payrollMonth');
  const yearOptions = buildPayrollYearOptions(payrollYear);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the payroll run.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <PayrollCoreQueryErrorBanner message={submitError} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payroll-run-year">Payroll year</Label>
          <Select
            id="payroll-run-year"
            {...form.register('payrollYear', { valueAsNumber: true })}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
          <FormErrorText message={form.formState.errors.payrollYear?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payroll-run-month">Payroll month</Label>
          <Select
            id="payroll-run-month"
            {...form.register('payrollMonth', { valueAsNumber: true })}
          >
            {PAYROLL_MONTH_OPTIONS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </Select>
          <FormErrorText message={form.formState.errors.payrollMonth?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="payroll-run-project">Project</Label>
        <Select id="payroll-run-project" {...form.register('projectId')}>
          <option value="">Company-wide scope</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {getProjectLabel(project)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.projectId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payroll-run-cost-center">Cost center</Label>
        <Select id="payroll-run-cost-center" {...form.register('costCenterId')}>
          <option value="">No cost center</option>
          {filteredCostCenters.map((costCenter) => (
            <option key={costCenter.id} value={costCenter.id}>
              {getCostCenterLabel(costCenter)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.costCenterId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payroll-run-description">Description</Label>
        <Textarea id="payroll-run-description" {...form.register('description')} />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <EntityContext
        items={[
          {
            label: 'Reference preview',
            value: getPayrollReferencePreview(payrollYear, payrollMonth),
          },
          {
            label: 'Payroll period',
            value: formatPayrollPeriodLabel(payrollYear, payrollMonth),
          },
          {
            label: 'Scope',
            value: selectedProject
              ? getProjectLabel(selectedProject)
              : 'Company-wide payroll scope',
          },
          {
            label: 'Cost center',
            value: selectedCostCenter
              ? getCostCenterLabel(selectedCostCenter)
              : 'No cost center',
          },
        ]}
      />
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={payrollRun ? 'Save changes' : 'Create payroll run'}
      />
    </form>
  );
};

export const PayrollRunLineFormPanel = ({
  payrollRunLine,
  employees,
  isPending,
  onClose,
  onSubmit,
}: {
  payrollRunLine: PayrollRunLineRecord | null;
  employees: EmployeeRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: PayrollRunLineFormValues) => Promise<unknown>;
}) => {
  const form = useForm<PayrollRunLineFormValues>({
    resolver: zodResolver(payrollRunLineFormSchema),
    defaultValues: {
      employeeId: payrollRunLine?.employeeId ?? '',
      basicAmount: payrollRunLine?.basicAmount ?? '0.00',
      allowanceAmount: payrollRunLine?.allowanceAmount ?? '0.00',
      deductionAmount: payrollRunLine?.deductionAmount ?? '0.00',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      employeeId: payrollRunLine?.employeeId ?? '',
      basicAmount: payrollRunLine?.basicAmount ?? '0.00',
      allowanceAmount: payrollRunLine?.allowanceAmount ?? '0.00',
      deductionAmount: payrollRunLine?.deductionAmount ?? '0.00',
    });
    clearSubmitError();
  }, [clearSubmitError, form, payrollRunLine]);

  const selectedEmployee = employees.find(
    (employee) => employee.id === form.watch('employeeId'),
  );
  const amountPreview = buildPayrollAmountPreview({
    basicAmount: form.watch('basicAmount'),
    allowanceAmount: form.watch('allowanceAmount'),
    deductionAmount: form.watch('deductionAmount'),
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the payroll line.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <PayrollCoreQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="payroll-run-line-employee">Employee</Label>
        <Select
          disabled={Boolean(payrollRunLine)}
          id="payroll-run-line-employee"
          {...form.register('employeeId')}
        >
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option
              disabled={!employee.isActive && form.watch('employeeId') !== employee.id}
              key={employee.id}
              value={employee.id}
            >
              {getEmployeeLabel(employee)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.employeeId?.message} />
      </div>
      {payrollRunLine ? (
        <PayrollCoreReadOnlyNotice
          title="Employee locked"
          description="Employee selection is fixed after the payroll line is created. Create a new line if a different employee is required."
        />
      ) : null}
      {selectedEmployee ? (
        <EntityContext
          items={[
            {
              label: 'Employee',
              value: getEmployeeLabel(selectedEmployee),
            },
            {
              label: 'Department',
              value: selectedEmployee.departmentName || 'No department',
            },
            {
              label: 'Location',
              value: selectedEmployee.locationName || 'No location',
            },
          ]}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="payroll-run-line-basic-amount">Basic amount</Label>
          <Input
            id="payroll-run-line-basic-amount"
            inputMode="decimal"
            {...form.register('basicAmount')}
          />
          <FormErrorText message={form.formState.errors.basicAmount?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payroll-run-line-allowance-amount">
            Allowance amount
          </Label>
          <Input
            id="payroll-run-line-allowance-amount"
            inputMode="decimal"
            {...form.register('allowanceAmount')}
          />
          <FormErrorText
            message={form.formState.errors.allowanceAmount?.message}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payroll-run-line-deduction-amount">
            Deduction amount
          </Label>
          <Input
            id="payroll-run-line-deduction-amount"
            inputMode="decimal"
            {...form.register('deductionAmount')}
          />
          <FormErrorText
            message={form.formState.errors.deductionAmount?.message}
          />
        </div>
      </div>
      <EntityContext
        items={[
          {
            label: 'Gross preview',
            value: amountPreview.grossLabel,
          },
          {
            label: 'Net preview',
            value: amountPreview.netLabel,
          },
          {
            label: 'Deductions',
            value: amountPreview.deductionLabel,
          },
        ]}
      />
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={payrollRunLine ? 'Save changes' : 'Create payroll line'}
      />
    </form>
  );
};

export const PayrollPostingFormPanel = ({
  payrollRun,
  particularAccounts,
  isPending,
  onClose,
  onSubmit,
}: {
  payrollRun: PayrollRunRecord;
  particularAccounts: ParticularAccountRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: PayrollPostingFormValues) => Promise<unknown>;
}) => {
  const requiresDeductionAccount = parseAmount(payrollRun.totalDeductionAmount) > 0;
  const form = useForm<PayrollPostingFormValues>({
    resolver: zodResolver(payrollPostingFormSchema(requiresDeductionAccount)),
    defaultValues: {
      voucherDate: buildDefaultVoucherDate(payrollRun),
      expenseParticularAccountId: '',
      payableParticularAccountId: '',
      deductionParticularAccountId: '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      voucherDate: buildDefaultVoucherDate(payrollRun),
      expenseParticularAccountId: '',
      payableParticularAccountId: '',
      deductionParticularAccountId: '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, payrollRun]);

  const expenseAccount = particularAccounts.find(
    (account) => account.id === form.watch('expenseParticularAccountId'),
  );
  const payableAccount = particularAccounts.find(
    (account) => account.id === form.watch('payableParticularAccountId'),
  );
  const deductionAccount = particularAccounts.find(
    (account) => account.id === form.watch('deductionParticularAccountId'),
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to post the payroll run.');
    }
  });

  if (payrollRun.status === 'POSTED') {
    return (
      <PayrollCoreReadOnlyNotice
        title="Payroll already posted"
        description="This payroll run is already linked to accounting and cannot be posted again."
      />
    );
  }

  if (payrollRun.status !== 'FINALIZED') {
    return (
      <PayrollCoreReadOnlyNotice
        title="Posting unavailable"
        description="Only finalized payroll runs can be posted to accounting in this phase."
      />
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <PayrollCoreQueryErrorBanner message={submitError} /> : null}
      <PayrollCoreReadOnlyNotice
        title="Explicit posting"
        description="Posting creates a journal voucher immediately. Review the voucher date and posting accounts carefully before continuing."
      />
      <EntityContext
        items={[
          {
            label: 'Payroll period',
            value: formatPayrollPeriodLabel(
              payrollRun.payrollYear,
              payrollRun.payrollMonth,
            ),
          },
          {
            label: 'Voucher reference preview',
            value: getPayrollReferencePreview(
              payrollRun.payrollYear,
              payrollRun.payrollMonth,
            ),
          },
          {
            label: 'Gross expense',
            value: formatAccountingAmount(
              parseAmount(payrollRun.totalBasicAmount) +
                parseAmount(payrollRun.totalAllowanceAmount),
            ),
          },
          {
            label: 'Payroll payable',
            value: formatAccountingAmount(payrollRun.totalNetAmount),
          },
          {
            label: 'Deductions payable',
            value: formatAccountingAmount(payrollRun.totalDeductionAmount),
          },
          {
            label: 'Line count',
            value: String(payrollRun.lineCount),
          },
        ]}
      />
      <div className="space-y-2">
        <Label htmlFor="payroll-posting-voucher-date">Voucher date</Label>
        <Input
          id="payroll-posting-voucher-date"
          type="date"
          {...form.register('voucherDate')}
        />
        <FormErrorText message={form.formState.errors.voucherDate?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payroll-posting-expense-account">
          Gross expense account
        </Label>
        <Select
          id="payroll-posting-expense-account"
          {...form.register('expenseParticularAccountId')}
        >
          <option value="">Select gross expense account</option>
          {particularAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {getParticularAccountLabel(account)}
            </option>
          ))}
        </Select>
        <FormErrorText
          message={form.formState.errors.expenseParticularAccountId?.message}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payroll-posting-payable-account">
          Payroll payable account
        </Label>
        <Select
          id="payroll-posting-payable-account"
          {...form.register('payableParticularAccountId')}
        >
          <option value="">Select payroll payable account</option>
          {particularAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {getParticularAccountLabel(account)}
            </option>
          ))}
        </Select>
        <FormErrorText
          message={form.formState.errors.payableParticularAccountId?.message}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payroll-posting-deduction-account">
          Deduction liability account
        </Label>
        <Select
          id="payroll-posting-deduction-account"
          {...form.register('deductionParticularAccountId')}
        >
          <option value="">
            {requiresDeductionAccount
              ? 'Select deduction liability account'
              : 'No deduction account required'}
          </option>
          {particularAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {getParticularAccountLabel(account)}
            </option>
          ))}
        </Select>
        <FormErrorText
          message={form.formState.errors.deductionParticularAccountId?.message}
        />
      </div>
      {(expenseAccount || payableAccount || deductionAccount) ? (
        <RelationBadgeRow
          items={[
            expenseAccount
              ? `Expense: ${getParticularAccountLabel(expenseAccount)}`
              : null,
            payableAccount
              ? `Payable: ${getParticularAccountLabel(payableAccount)}`
              : null,
            deductionAccount
              ? `Deductions: ${getParticularAccountLabel(deductionAccount)}`
              : null,
          ]}
        />
      ) : null}
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel="Post payroll run"
      />
    </form>
  );
};

export const PayrollRunDetailSummary = ({
  payrollRun,
}: {
  payrollRun: PayrollRunRecord;
}) => (
  <EntityContext
    items={[
      {
        label: 'Payroll period',
        value: formatPayrollPeriodLabel(
          payrollRun.payrollYear,
          payrollRun.payrollMonth,
        ),
      },
      {
        label: 'Reference preview',
        value: getPayrollReferencePreview(
          payrollRun.payrollYear,
          payrollRun.payrollMonth,
        ),
      },
      {
        label: 'Project',
        value: payrollRun.projectName
          ? `${payrollRun.projectCode} - ${payrollRun.projectName}`
          : 'Company-wide scope',
      },
      {
        label: 'Cost center',
        value: payrollRun.costCenterName
          ? `${payrollRun.costCenterCode} - ${payrollRun.costCenterName}`
          : 'No cost center',
      },
      {
        label: 'Description',
        value: payrollRun.description || 'No description',
      },
      {
        label: 'Posted voucher',
        value: payrollRun.postedVoucherReference
          ? `${payrollRun.postedVoucherReference}${
              payrollRun.postedVoucherDate
                ? ` | ${formatDate(payrollRun.postedVoucherDate)}`
                : ''
            }`
          : 'Not posted',
      },
    ]}
  />
);
