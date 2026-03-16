import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';

import { REQUEST_ID_HEADER } from '../constants/api.constants';
import type { RequestWithRequestId } from '../interfaces/request-with-request-id.interface';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(
    request: RequestWithRequestId,
    response: Response,
    next: NextFunction,
  ): void {
    const incomingRequestId = request.header(REQUEST_ID_HEADER);
    const requestId =
      typeof incomingRequestId === 'string' && incomingRequestId.trim().length > 0
        ? incomingRequestId.trim()
        : randomUUID();

    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
