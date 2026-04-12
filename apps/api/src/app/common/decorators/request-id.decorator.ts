import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { RequestWithRequestId } from '../interfaces/request-with-request-id.interface';

export const RequestId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithRequestId>();

    return request.requestId;
  },
);
