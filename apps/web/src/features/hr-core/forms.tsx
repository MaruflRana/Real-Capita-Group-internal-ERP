'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FieldValues, UseFormSetError } from 'react-hook-form';
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
  HR_ATTENDANCE_LOG_DIRECTIONS,
  type AttendanceDeviceRecord,
  type CompanyUserRecord,
  type DepartmentRecord,
  type DeviceUserRecord,
  type EmployeeRecord,
  type LeaveRequestRecord,
  type LeaveTypeRecord,
  type LocationRecord,
} from '../../lib/api/types';
import { applyApiFormErrors } from '../../lib/forms';
import { formatDate, formatDateTime, formatName } from '../../lib/format';
import {
  FormErrorText,
  HrCoreQueryErrorBanner,
  HrCoreReadOnlyNotice,
  KeyValueList,
  LeaveRequestStatusBadge,
  RelationBadgeRow,
} from './shared';
import {
  getAttendanceDeviceLabel,
  getDepartmentLabel,
  getDeviceUserLabel,
  getEmployeeLabel,
  getLeaveTypeLabel,
  getLocationLabel,
  getUserLabel,
} from './utils';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/u;
const dateTimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u;
const optionalIdSchema = z.string().optional().or(z.literal(''));
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
const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Description must be 500 characters or fewer.')
  .optional()
  .or(z.literal(''));
const dateSchema = z.string().trim().regex(dateRegex, 'Use YYYY-MM-DD.');
const dateTimeLocalSchema = z
  .string()
  .trim()
  .regex(dateTimeLocalRegex, 'Use a valid local date and time.');

export const employeeFormSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(1, 'Employee code is required.')
    .max(50, 'Employee code must be 50 characters or fewer.'),
  fullName: z
    .string()
    .trim()
    .min(1, 'Employee name is required.')
    .max(120, 'Employee name must be 120 characters or fewer.'),
  departmentId: optionalIdSchema,
  locationId: optionalIdSchema,
  userId: optionalIdSchema,
  managerEmployeeId: optionalIdSchema,
});

export const attendanceDeviceFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Device code is required.')
    .max(50, 'Device code must be 50 characters or fewer.'),
  name: z
    .string()
    .trim()
    .min(1, 'Device name is required.')
    .max(120, 'Device name must be 120 characters or fewer.'),
  description: optionalDescriptionSchema,
  locationId: optionalIdSchema,
});

export const deviceUserFormSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required.'),
  attendanceDeviceId: z.string().min(1, 'Attendance device is required.'),
  deviceEmployeeCode: z
    .string()
    .trim()
    .min(1, 'Device employee code is required.')
    .max(64, 'Device employee code must be 64 characters or fewer.'),
});

export const attendanceLogCreateFormSchema = z.object({
  deviceUserId: z.string().min(1, 'Device mapping is required.'),
  loggedAt: dateTimeLocalSchema,
  direction: z.enum(HR_ATTENDANCE_LOG_DIRECTIONS),
  externalLogId: optionalShortTextSchema,
});

export const attendanceLogBulkFormSchema = z.object({
  entries: z
    .array(attendanceLogCreateFormSchema)
    .min(1, 'At least one attendance log entry is required.'),
});

export const leaveTypeFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Leave type code is required.')
    .max(50, 'Leave type code must be 50 characters or fewer.'),
  name: z
    .string()
    .trim()
    .min(1, 'Leave type name is required.')
    .max(120, 'Leave type name must be 120 characters or fewer.'),
  description: optionalDescriptionSchema,
});

export const leaveRequestFormSchema = z
  .object({
    employeeId: z.string().min(1, 'Employee is required.'),
    leaveTypeId: z.string().min(1, 'Leave type is required.'),
    startDate: dateSchema,
    endDate: dateSchema,
    reason: optionalTextSchema,
  })
  .superRefine((values, context) => {
    if (values.startDate && values.endDate && values.startDate > values.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be on or after the start date.',
      });
    }
  });

export const leaveRequestDecisionSchema = z.object({
  decisionNote: optionalTextSchema,
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
export type AttendanceDeviceFormValues = z.infer<typeof attendanceDeviceFormSchema>;
export type DeviceUserFormValues = z.infer<typeof deviceUserFormSchema>;
export type AttendanceLogCreateFormValues = z.infer<
  typeof attendanceLogCreateFormSchema
>;
export type AttendanceLogBulkFormValues = z.infer<
  typeof attendanceLogBulkFormSchema
>;
export type LeaveTypeFormValues = z.infer<typeof leaveTypeFormSchema>;
export type LeaveRequestFormValues = z.infer<typeof leaveRequestFormSchema>;
export type LeaveRequestDecisionFormValues = z.infer<
  typeof leaveRequestDecisionSchema
>;

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

export const EmployeeFormPanel = ({
  employee,
  departments,
  locations,
  users,
  managers,
  isPending,
  onClose,
  onSubmit,
}: {
  employee: EmployeeRecord | null;
  departments: DepartmentRecord[];
  locations: LocationRecord[];
  users: CompanyUserRecord[];
  managers: EmployeeRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => Promise<unknown>;
}) => {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employeeCode: employee?.employeeCode ?? '',
      fullName: employee?.fullName ?? '',
      departmentId: employee?.departmentId ?? '',
      locationId: employee?.locationId ?? '',
      userId: employee?.userId ?? '',
      managerEmployeeId: employee?.managerEmployeeId ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      employeeCode: employee?.employeeCode ?? '',
      fullName: employee?.fullName ?? '',
      departmentId: employee?.departmentId ?? '',
      locationId: employee?.locationId ?? '',
      userId: employee?.userId ?? '',
      managerEmployeeId: employee?.managerEmployeeId ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, employee, form]);

  const selectedDepartment = departments.find(
    (department) => department.id === form.watch('departmentId'),
  );
  const selectedLocation = locations.find(
    (location) => location.id === form.watch('locationId'),
  );
  const selectedUser = users.find((user) => user.id === form.watch('userId'));
  const selectedManager = managers.find(
    (manager) => manager.id === form.watch('managerEmployeeId'),
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the employee.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <HrCoreQueryErrorBanner message={submitError} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employee-code">Employee code</Label>
          <Input id="employee-code" {...form.register('employeeCode')} />
          <FormErrorText message={form.formState.errors.employeeCode?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee-full-name">Employee name</Label>
          <Input id="employee-full-name" {...form.register('fullName')} />
          <FormErrorText message={form.formState.errors.fullName?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="employee-department">Department</Label>
        <Select id="employee-department" {...form.register('departmentId')}>
          <option value="">No department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {getDepartmentLabel(department)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.departmentId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="employee-location">Location</Label>
        <Select id="employee-location" {...form.register('locationId')}>
          <option value="">No location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {getLocationLabel(location)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.locationId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="employee-user">Linked user</Label>
        <Select id="employee-user" {...form.register('userId')}>
          <option value="">No linked user</option>
          {users.map((user) => (
            <option
              disabled={
                (!user.identityIsActive || !user.companyAccessIsActive) &&
                form.watch('userId') !== user.id
              }
              key={user.id}
              value={user.id}
            >
              {getUserLabel(user)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.userId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="employee-manager">Manager</Label>
        <Select id="employee-manager" {...form.register('managerEmployeeId')}>
          <option value="">No manager</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {getEmployeeLabel(manager)}
            </option>
          ))}
        </Select>
        <FormErrorText
          message={form.formState.errors.managerEmployeeId?.message}
        />
      </div>
      {(selectedDepartment || selectedLocation || selectedUser || selectedManager) ? (
        <EntityContext
          items={[
            ...(selectedDepartment
              ? [{ label: 'Department', value: getDepartmentLabel(selectedDepartment) }]
              : []),
            ...(selectedLocation
              ? [{ label: 'Location', value: getLocationLabel(selectedLocation) }]
              : []),
            ...(selectedUser
              ? [{ label: 'Linked user', value: getUserLabel(selectedUser) }]
              : []),
            ...(selectedManager
              ? [{ label: 'Manager', value: getEmployeeLabel(selectedManager) }]
              : []),
          ]}
        />
      ) : null}
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={employee ? 'Save changes' : 'Create employee'}
      />
    </form>
  );
};

export const AttendanceDeviceFormPanel = ({
  attendanceDevice,
  locations,
  isPending,
  onClose,
  onSubmit,
}: {
  attendanceDevice: AttendanceDeviceRecord | null;
  locations: LocationRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: AttendanceDeviceFormValues) => Promise<unknown>;
}) => {
  const form = useForm<AttendanceDeviceFormValues>({
    resolver: zodResolver(attendanceDeviceFormSchema),
    defaultValues: {
      code: attendanceDevice?.code ?? '',
      name: attendanceDevice?.name ?? '',
      description: attendanceDevice?.description ?? '',
      locationId: attendanceDevice?.locationId ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      code: attendanceDevice?.code ?? '',
      name: attendanceDevice?.name ?? '',
      description: attendanceDevice?.description ?? '',
      locationId: attendanceDevice?.locationId ?? '',
    });
    clearSubmitError();
  }, [attendanceDevice, clearSubmitError, form]);

  const selectedLocation = locations.find(
    (location) => location.id === form.watch('locationId'),
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the attendance device.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <HrCoreQueryErrorBanner message={submitError} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="attendance-device-code">Device code</Label>
          <Input id="attendance-device-code" {...form.register('code')} />
          <FormErrorText message={form.formState.errors.code?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="attendance-device-name">Device name</Label>
          <Input id="attendance-device-name" {...form.register('name')} />
          <FormErrorText message={form.formState.errors.name?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="attendance-device-location">Location</Label>
        <Select id="attendance-device-location" {...form.register('locationId')}>
          <option value="">No location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {getLocationLabel(location)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.locationId?.message} />
      </div>
      {selectedLocation ? (
        <EntityContext
          items={[{ label: 'Location', value: getLocationLabel(selectedLocation) }]}
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="attendance-device-description">Description</Label>
        <Textarea
          id="attendance-device-description"
          {...form.register('description')}
        />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={attendanceDevice ? 'Save changes' : 'Create device'}
      />
    </form>
  );
};

export const DeviceUserFormPanel = ({
  deviceUser,
  employees,
  attendanceDevices,
  isPending,
  onClose,
  onSubmit,
}: {
  deviceUser: DeviceUserRecord | null;
  employees: EmployeeRecord[];
  attendanceDevices: AttendanceDeviceRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: DeviceUserFormValues) => Promise<unknown>;
}) => {
  const form = useForm<DeviceUserFormValues>({
    resolver: zodResolver(deviceUserFormSchema),
    defaultValues: {
      employeeId: deviceUser?.employeeId ?? '',
      attendanceDeviceId: deviceUser?.attendanceDeviceId ?? '',
      deviceEmployeeCode: deviceUser?.deviceEmployeeCode ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      employeeId: deviceUser?.employeeId ?? '',
      attendanceDeviceId: deviceUser?.attendanceDeviceId ?? '',
      deviceEmployeeCode: deviceUser?.deviceEmployeeCode ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, deviceUser, form]);

  const selectedEmployee = employees.find(
    (employee) => employee.id === form.watch('employeeId'),
  );
  const selectedAttendanceDevice = attendanceDevices.find(
    (attendanceDevice) => attendanceDevice.id === form.watch('attendanceDeviceId'),
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the device mapping.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <HrCoreQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="device-user-employee">Employee</Label>
        <Select id="device-user-employee" {...form.register('employeeId')}>
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
      <div className="space-y-2">
        <Label htmlFor="device-user-attendance-device">Attendance device</Label>
        <Select
          id="device-user-attendance-device"
          {...form.register('attendanceDeviceId')}
        >
          <option value="">Select attendance device</option>
          {attendanceDevices.map((attendanceDevice) => (
            <option
              disabled={
                !attendanceDevice.isActive &&
                form.watch('attendanceDeviceId') !== attendanceDevice.id
              }
              key={attendanceDevice.id}
              value={attendanceDevice.id}
            >
              {getAttendanceDeviceLabel(attendanceDevice)}
            </option>
          ))}
        </Select>
        <FormErrorText
          message={form.formState.errors.attendanceDeviceId?.message}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="device-user-code">Device employee code</Label>
        <Input id="device-user-code" {...form.register('deviceEmployeeCode')} />
        <FormErrorText
          message={form.formState.errors.deviceEmployeeCode?.message}
        />
      </div>
      {(selectedEmployee || selectedAttendanceDevice) ? (
        <EntityContext
          items={[
            ...(selectedEmployee
              ? [
                  {
                    label: 'Employee',
                    value: `${getEmployeeLabel(selectedEmployee)}${
                      selectedEmployee.locationName
                        ? ` | ${selectedEmployee.locationName}`
                        : ''
                    }`,
                  },
                ]
              : []),
            ...(selectedAttendanceDevice
              ? [
                  {
                    label: 'Attendance device',
                    value: `${getAttendanceDeviceLabel(selectedAttendanceDevice)}${
                      selectedAttendanceDevice.locationName
                        ? ` | ${selectedAttendanceDevice.locationName}`
                        : ''
                    }`,
                  },
                ]
              : []),
          ]}
        />
      ) : null}
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={deviceUser ? 'Save changes' : 'Create mapping'}
      />
    </form>
  );
};

export const AttendanceLogCreatePanel = ({
  deviceUsers,
  isPending,
  onClose,
  onSubmit,
}: {
  deviceUsers: DeviceUserRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: AttendanceLogCreateFormValues) => Promise<unknown>;
}) => {
  const form = useForm<AttendanceLogCreateFormValues>({
    resolver: zodResolver(attendanceLogCreateFormSchema),
    defaultValues: {
      deviceUserId: '',
      loggedAt: '',
      direction: 'UNKNOWN',
      externalLogId: '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  const selectedDeviceUser = deviceUsers.find(
    (deviceUser) => deviceUser.id === form.watch('deviceUserId'),
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to create the attendance log.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <HrCoreQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="attendance-log-device-user">Device mapping</Label>
        <Select id="attendance-log-device-user" {...form.register('deviceUserId')}>
          <option value="">Select device mapping</option>
          {deviceUsers.map((deviceUser) => (
            <option
              disabled={!deviceUser.isActive}
              key={deviceUser.id}
              value={deviceUser.id}
            >
              {getDeviceUserLabel(deviceUser)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.deviceUserId?.message} />
      </div>
      {selectedDeviceUser ? (
        <EntityContext
          items={[
            {
              label: 'Employee',
              value: `${selectedDeviceUser.employeeCode} - ${selectedDeviceUser.employeeFullName}`,
            },
            {
              label: 'Attendance device',
              value: `${selectedDeviceUser.attendanceDeviceCode} - ${selectedDeviceUser.attendanceDeviceName}`,
            },
            {
              label: 'Location',
              value: selectedDeviceUser.locationName || 'No location',
            },
          ]}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="attendance-log-logged-at">Logged at</Label>
          <Input
            id="attendance-log-logged-at"
            type="datetime-local"
            {...form.register('loggedAt')}
          />
          <FormErrorText message={form.formState.errors.loggedAt?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="attendance-log-direction">Direction</Label>
          <Select id="attendance-log-direction" {...form.register('direction')}>
            {HR_ATTENDANCE_LOG_DIRECTIONS.map((direction) => (
              <option key={direction} value={direction}>
                {direction}
              </option>
            ))}
          </Select>
          <FormErrorText message={form.formState.errors.direction?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="attendance-log-external-id">External log ID</Label>
        <Input id="attendance-log-external-id" {...form.register('externalLogId')} />
        <FormErrorText message={form.formState.errors.externalLogId?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel="Create attendance log"
      />
    </form>
  );
};

export const AttendanceLogBulkPanel = ({
  deviceUsers,
  isPending,
  onClose,
  onSubmit,
}: {
  deviceUsers: DeviceUserRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: AttendanceLogBulkFormValues) => Promise<unknown>;
}) => {
  const form = useForm<AttendanceLogBulkFormValues>({
    resolver: zodResolver(attendanceLogBulkFormSchema),
    defaultValues: {
      entries: [
        {
          deviceUserId: '',
          loggedAt: '',
          direction: 'UNKNOWN',
          externalLogId: '',
        },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to bulk ingest attendance logs.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <HrCoreQueryErrorBanner message={submitError} /> : null}
      {fields.map((field, index) => {
        const selectedDeviceUser = deviceUsers.find(
          (deviceUser) =>
            deviceUser.id === form.watch(`entries.${index}.deviceUserId`),
        );

        return (
          <div
            className="space-y-4 rounded-2xl border border-border/70 p-4"
            key={field.id}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Log entry {index + 1}
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
            <div className="space-y-2">
              <Label htmlFor={`bulk-attendance-log-device-user-${index}`}>
                Device mapping
              </Label>
              <Select
                id={`bulk-attendance-log-device-user-${index}`}
                {...form.register(`entries.${index}.deviceUserId`)}
              >
                <option value="">Select device mapping</option>
                {deviceUsers.map((deviceUser) => (
                  <option
                    disabled={!deviceUser.isActive}
                    key={deviceUser.id}
                    value={deviceUser.id}
                  >
                    {getDeviceUserLabel(deviceUser)}
                  </option>
                ))}
              </Select>
              <FormErrorText
                message={form.formState.errors.entries?.[index]?.deviceUserId?.message}
              />
            </div>
            {selectedDeviceUser ? (
              <RelationBadgeRow
                items={[
                  `${selectedDeviceUser.employeeCode} ${selectedDeviceUser.employeeFullName}`,
                  selectedDeviceUser.attendanceDeviceCode,
                  selectedDeviceUser.locationName,
                ]}
              />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`bulk-attendance-log-logged-at-${index}`}>
                  Logged at
                </Label>
                <Input
                  id={`bulk-attendance-log-logged-at-${index}`}
                  type="datetime-local"
                  {...form.register(`entries.${index}.loggedAt`)}
                />
                <FormErrorText
                  message={form.formState.errors.entries?.[index]?.loggedAt?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`bulk-attendance-log-direction-${index}`}>
                  Direction
                </Label>
                <Select
                  id={`bulk-attendance-log-direction-${index}`}
                  {...form.register(`entries.${index}.direction`)}
                >
                  {HR_ATTENDANCE_LOG_DIRECTIONS.map((direction) => (
                    <option key={direction} value={direction}>
                      {direction}
                    </option>
                  ))}
                </Select>
                <FormErrorText
                  message={form.formState.errors.entries?.[index]?.direction?.message}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`bulk-attendance-log-external-id-${index}`}>
                External log ID
              </Label>
              <Input
                id={`bulk-attendance-log-external-id-${index}`}
                {...form.register(`entries.${index}.externalLogId`)}
              />
              <FormErrorText
                message={form.formState.errors.entries?.[index]?.externalLogId?.message}
              />
            </div>
          </div>
        );
      })}
      <div className="flex justify-start">
        <Button
          onClick={() =>
            append({
              deviceUserId: '',
              loggedAt: '',
              direction: 'UNKNOWN',
              externalLogId: '',
            })
          }
          type="button"
          variant="outline"
        >
          Add entry
        </Button>
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel="Bulk ingest"
      />
    </form>
  );
};

export const AttendanceLogDetailPanel = ({
  attendanceLog,
}: {
  attendanceLog: {
    employeeCode: string;
    employeeFullName: string;
    attendanceDeviceCode: string;
    attendanceDeviceName: string;
    locationName: string | null;
    deviceEmployeeCode: string;
    loggedAt: string;
    direction: string;
    externalLogId: string | null;
    createdAt: string;
  };
}) => (
  <div className="space-y-5">
    <EntityContext
      items={[
        {
          label: 'Employee',
          value: `${attendanceLog.employeeCode} - ${attendanceLog.employeeFullName}`,
        },
        {
          label: 'Attendance device',
          value: `${attendanceLog.attendanceDeviceCode} - ${attendanceLog.attendanceDeviceName}`,
        },
        {
          label: 'Location',
          value: attendanceLog.locationName || 'No location',
        },
        {
          label: 'Device employee code',
          value: attendanceLog.deviceEmployeeCode,
        },
        {
          label: 'Logged at',
          value: formatDateTime(attendanceLog.loggedAt),
        },
        {
          label: 'Created',
          value: formatDateTime(attendanceLog.createdAt),
        },
      ]}
    />
    <RelationBadgeRow
      items={[
        `Direction: ${attendanceLog.direction}`,
        attendanceLog.externalLogId
          ? `External ID: ${attendanceLog.externalLogId}`
          : null,
      ]}
    />
  </div>
);

export const LeaveTypeFormPanel = ({
  leaveType,
  isPending,
  onClose,
  onSubmit,
}: {
  leaveType: LeaveTypeRecord | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: LeaveTypeFormValues) => Promise<unknown>;
}) => {
  const form = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeFormSchema),
    defaultValues: {
      code: leaveType?.code ?? '',
      name: leaveType?.name ?? '',
      description: leaveType?.description ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      code: leaveType?.code ?? '',
      name: leaveType?.name ?? '',
      description: leaveType?.description ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, leaveType]);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the leave type.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <HrCoreQueryErrorBanner message={submitError} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="leave-type-code">Leave type code</Label>
          <Input id="leave-type-code" {...form.register('code')} />
          <FormErrorText message={form.formState.errors.code?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leave-type-name">Leave type name</Label>
          <Input id="leave-type-name" {...form.register('name')} />
          <FormErrorText message={form.formState.errors.name?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="leave-type-description">Description</Label>
        <Textarea id="leave-type-description" {...form.register('description')} />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={leaveType ? 'Save changes' : 'Create leave type'}
      />
    </form>
  );
};

export const LeaveRequestFormPanel = ({
  leaveRequest,
  employees,
  leaveTypes,
  isPending,
  onClose,
  onSubmit,
  submitLabel,
}: {
  leaveRequest: LeaveRequestRecord | null;
  employees: EmployeeRecord[];
  leaveTypes: LeaveTypeRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: LeaveRequestFormValues) => Promise<unknown>;
  submitLabel: string;
}) => {
  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestFormSchema),
    defaultValues: {
      employeeId: leaveRequest?.employeeId ?? '',
      leaveTypeId: leaveRequest?.leaveTypeId ?? '',
      startDate: leaveRequest?.startDate ?? '',
      endDate: leaveRequest?.endDate ?? '',
      reason: leaveRequest?.reason ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      employeeId: leaveRequest?.employeeId ?? '',
      leaveTypeId: leaveRequest?.leaveTypeId ?? '',
      startDate: leaveRequest?.startDate ?? '',
      endDate: leaveRequest?.endDate ?? '',
      reason: leaveRequest?.reason ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, leaveRequest]);

  const selectedEmployee = employees.find(
    (employee) => employee.id === form.watch('employeeId'),
  );
  const selectedLeaveType = leaveTypes.find(
    (leaveType) => leaveType.id === form.watch('leaveTypeId'),
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the leave request.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <HrCoreQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="leave-request-employee">Employee</Label>
        <Select id="leave-request-employee" {...form.register('employeeId')}>
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
      <div className="space-y-2">
        <Label htmlFor="leave-request-leave-type">Leave type</Label>
        <Select id="leave-request-leave-type" {...form.register('leaveTypeId')}>
          <option value="">Select leave type</option>
          {leaveTypes.map((leaveType) => (
            <option
              disabled={!leaveType.isActive && form.watch('leaveTypeId') !== leaveType.id}
              key={leaveType.id}
              value={leaveType.id}
            >
              {getLeaveTypeLabel(leaveType)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.leaveTypeId?.message} />
      </div>
      {(selectedEmployee || selectedLeaveType) ? (
        <EntityContext
          items={[
            ...(selectedEmployee
              ? [
                  {
                    label: 'Employee context',
                    value: [
                      getEmployeeLabel(selectedEmployee),
                      selectedEmployee.departmentName,
                      selectedEmployee.locationName,
                    ]
                      .filter(Boolean)
                      .join(' | '),
                  },
                ]
              : []),
            ...(selectedLeaveType
              ? [
                  {
                    label: 'Leave type',
                    value: getLeaveTypeLabel(selectedLeaveType),
                  },
                ]
              : []),
          ]}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="leave-request-start-date">Start date</Label>
          <Input
            id="leave-request-start-date"
            type="date"
            {...form.register('startDate')}
          />
          <FormErrorText message={form.formState.errors.startDate?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leave-request-end-date">End date</Label>
          <Input
            id="leave-request-end-date"
            type="date"
            {...form.register('endDate')}
          />
          <FormErrorText message={form.formState.errors.endDate?.message} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="leave-request-reason">Reason</Label>
        <Textarea id="leave-request-reason" {...form.register('reason')} />
        <FormErrorText message={form.formState.errors.reason?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={submitLabel}
      />
    </form>
  );
};

export const LeaveRequestDetailPanel = ({
  leaveRequest,
}: {
  leaveRequest: LeaveRequestRecord;
}) => (
  <div className="space-y-5">
    <div className="flex flex-wrap gap-2">
      <LeaveRequestStatusBadge status={leaveRequest.status} />
    </div>
    <EntityContext
      items={[
        {
          label: 'Employee',
          value: `${leaveRequest.employeeCode} - ${leaveRequest.employeeFullName}`,
        },
        {
          label: 'Department',
          value: leaveRequest.departmentName || 'No department',
        },
        {
          label: 'Location',
          value: leaveRequest.locationName || 'No location',
        },
        {
          label: 'Leave type',
          value: `${leaveRequest.leaveTypeCode} - ${leaveRequest.leaveTypeName}`,
        },
        {
          label: 'Date range',
          value:
            leaveRequest.startDate === leaveRequest.endDate
              ? formatDate(leaveRequest.startDate)
              : `${formatDate(leaveRequest.startDate)} to ${formatDate(leaveRequest.endDate)}`,
        },
        {
          label: 'Updated',
          value: formatDateTime(leaveRequest.updatedAt),
        },
      ]}
    />
    <div className="space-y-2">
      <Label>Reason</Label>
      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-foreground">
        {leaveRequest.reason || 'No reason'}
      </div>
    </div>
    <div className="space-y-2">
      <Label>Decision note</Label>
      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-foreground">
        {leaveRequest.decisionNote || 'No decision note'}
      </div>
    </div>
  </div>
);

export const LeaveRequestActionPanel = ({
  leaveRequest,
  isPending,
  onAction,
}: {
  leaveRequest: LeaveRequestRecord;
  isPending: boolean;
  onAction: (
    action: 'submit' | 'approve' | 'reject' | 'cancel',
    values: LeaveRequestDecisionFormValues,
  ) => Promise<unknown>;
}) => {
  const form = useForm<LeaveRequestDecisionFormValues>({
    resolver: zodResolver(leaveRequestDecisionSchema),
    defaultValues: {
      decisionNote: leaveRequest.decisionNote ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      decisionNote: leaveRequest.decisionNote ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, leaveRequest]);

  const handleAction = async (
    action: 'submit' | 'approve' | 'reject' | 'cancel',
  ) => {
    clearSubmitError();
    form.clearErrors();
    const isValid = await form.trigger();

    if (!isValid) {
      return;
    }

    try {
      await onAction(action, form.getValues());
    } catch (error) {
      handleError(form.setError, error, 'Unable to update the leave request.');
    }
  };

  if (
    leaveRequest.status !== 'DRAFT' &&
    leaveRequest.status !== 'SUBMITTED'
  ) {
    return (
      <HrCoreReadOnlyNotice
        title="Lifecycle locked"
        description="Approved, rejected, and cancelled leave requests are protected in this phase."
      />
    );
  }

  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      {submitError ? <HrCoreQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="leave-request-decision-note">Decision note</Label>
        <Textarea
          id="leave-request-decision-note"
          {...form.register('decisionNote')}
        />
        <FormErrorText message={form.formState.errors.decisionNote?.message} />
      </div>
      <div className="flex flex-wrap gap-3">
        {leaveRequest.status === 'DRAFT' ? (
          <>
            <Button
              disabled={isPending}
              onClick={() => void handleAction('submit')}
              type="button"
            >
              {isPending ? 'Saving...' : 'Submit request'}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void handleAction('cancel')}
              type="button"
              variant="outline"
            >
              {isPending ? 'Saving...' : 'Cancel request'}
            </Button>
          </>
        ) : null}
        {leaveRequest.status === 'SUBMITTED' ? (
          <>
            <Button
              disabled={isPending}
              onClick={() => void handleAction('approve')}
              type="button"
            >
              {isPending ? 'Saving...' : 'Approve'}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void handleAction('reject')}
              type="button"
              variant="outline"
            >
              {isPending ? 'Saving...' : 'Reject'}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void handleAction('cancel')}
              type="button"
              variant="outline"
            >
              {isPending ? 'Saving...' : 'Cancel'}
            </Button>
          </>
        ) : null}
      </div>
    </form>
  );
};

export const ExistingEmployeeSummary = ({
  employee,
}: {
  employee: EmployeeRecord;
}) => (
  <EntityContext
    items={[
      {
        label: 'Employee',
        value: getEmployeeLabel(employee),
      },
      {
        label: 'Department',
        value: employee.departmentName || 'No department',
      },
      {
        label: 'Location',
        value: employee.locationName || 'No location',
      },
      {
        label: 'Manager',
        value:
          employee.managerFullName && employee.managerEmployeeCode
            ? `${employee.managerFullName} (${employee.managerEmployeeCode})`
            : 'No manager',
      },
      {
        label: 'Linked user',
        value:
          employee.userEmail
            ? formatName(
                employee.userFirstName,
                employee.userLastName,
                employee.userEmail,
              )
            : 'No linked user',
      },
    ]}
  />
);
