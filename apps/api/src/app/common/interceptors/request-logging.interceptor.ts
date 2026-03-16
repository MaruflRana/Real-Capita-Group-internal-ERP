import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, finalize } from 'rxjs';

import type { RequestWithRequestId } from '../interfaces/request-with-request-id.interface';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RequestWithRequestId>();
    const response = httpContext.getResponse<Response>();
    const startedAt = performance.now();

    return next.handle().pipe(
      finalize(() => {
        const durationMs =
          Math.round((performance.now() - startedAt) * 100) / 100;

        this.logger.log(
          `${request.method} ${request.originalUrl ?? request.url} ${response.statusCode} ${durationMs}ms requestId=${request.requestId ?? 'n/a'}`,
        );
      }),
    );
  }
}
