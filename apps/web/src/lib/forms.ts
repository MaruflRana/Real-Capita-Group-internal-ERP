import type {
  FieldPath,
  FieldValues,
  UseFormSetError,
} from 'react-hook-form';

import { isApiError } from './api/client';
import type { ValidationErrorDetail } from './api/types';

const isValidationDetails = (
  value: unknown,
): value is ValidationErrorDetail[] =>
  Array.isArray(value) &&
  value.every(
    (detail) =>
      typeof detail === 'object' &&
      detail !== null &&
      'field' in detail &&
      'messages' in detail,
  );

export const applyApiFormErrors = <TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  error: unknown,
): boolean => {
  if (!isApiError(error) || !isValidationDetails(error.apiError.details)) {
    return false;
  }

  for (const detail of error.apiError.details) {
    setError(detail.field as FieldPath<TFieldValues>, {
      type: 'server',
      message: detail.messages.join(' '),
    });
  }

  return error.apiError.details.length > 0;
};
