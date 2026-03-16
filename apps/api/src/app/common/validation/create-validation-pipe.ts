import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

interface ValidationErrorDetail {
  field: string;
  messages: string[];
}

const flattenValidationErrors = (
  errors: ValidationError[],
  parentPath = '',
): ValidationErrorDetail[] =>
  errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const currentMessages = Object.values(error.constraints ?? {});
    const currentError =
      currentMessages.length === 0
        ? []
        : [
            {
              field,
              messages: currentMessages,
            },
          ];

    return [
      ...currentError,
      ...flattenValidationErrors(error.children ?? [], field),
    ];
  });

export const createValidationPipe = (): ValidationPipe =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: false,
    },
    exceptionFactory: (errors) =>
      new BadRequestException({
        error: 'Bad Request',
        message: 'Validation failed',
        details: flattenValidationErrors(errors),
      }),
  });
