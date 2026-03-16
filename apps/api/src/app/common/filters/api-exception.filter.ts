import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import type { Response } from 'express';

import type { RequestWithRequestId } from '../interfaces/request-with-request-id.interface';

interface NormalizedExceptionResponse {
  error: string;
  message: string;
  details?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

@Catch()
@Injectable()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithRequestId>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const normalizedResponse = this.normalizeExceptionResponse(
      status,
      exception instanceof HttpException ? exception.getResponse() : undefined,
    );

    const payload = {
      statusCode: status,
      error: normalizedResponse.error,
      message: normalizedResponse.message,
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
      requestId: request.requestId ?? null,
      ...(normalizedResponse.details === undefined
        ? {}
        : { details: normalizedResponse.details }),
    };
    const requestSummary = `${request.method} ${request.originalUrl ?? request.url}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${requestSummary} failed with status ${status} requestId=${request.requestId ?? 'n/a'}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${requestSummary} failed with status ${status} requestId=${request.requestId ?? 'n/a'}`,
      );
    }

    response.status(status).json(payload);
  }

  private normalizeExceptionResponse(
    status: number,
    exceptionResponse: unknown,
  ): NormalizedExceptionResponse {
    const fallbackMessage =
      status >= HttpStatus.INTERNAL_SERVER_ERROR
        ? 'An unexpected error occurred.'
        : (STATUS_CODES[status] ?? 'Request failed.');
    const fallbackError = STATUS_CODES[status] ?? 'Error';

    if (typeof exceptionResponse === 'string') {
      return {
        error: fallbackError,
        message: exceptionResponse,
      };
    }

    if (isRecord(exceptionResponse)) {
      const error =
        typeof exceptionResponse.error === 'string'
          ? exceptionResponse.error
          : fallbackError;
      const details = exceptionResponse.details;

      if (Array.isArray(exceptionResponse.message)) {
        return {
          error,
          message: 'Validation failed',
          details: details ?? exceptionResponse.message,
        };
      }

      if (typeof exceptionResponse.message === 'string') {
        return {
          error,
          message: exceptionResponse.message,
          details,
        };
      }

      if (details !== undefined) {
        return {
          error,
          message: fallbackMessage,
          details,
        };
      }
    }

    return {
      error: fallbackError,
      message: fallbackMessage,
    };
  }
}
