import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { COMPANY_SCOPE_KEY } from '../constants/auth.constants';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import type { CompanyScopeOptions } from '../decorators/company-scope.decorator';

@Injectable()
export class CompanyScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const scopeOptions =
      this.reflector.getAllAndOverride<CompanyScopeOptions>(COMPANY_SCOPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!scopeOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authenticatedUser = request.user;

    if (!authenticatedUser) {
      return false;
    }

    const companyValue = this.readCompanyValue(
      request,
      scopeOptions.source ?? 'params',
      scopeOptions.key ?? 'companyId',
    );

    if (!companyValue) {
      return true;
    }

    return authenticatedUser.companyId === companyValue;
  }

  private readCompanyValue(
    request: AuthenticatedRequest,
    source: NonNullable<CompanyScopeOptions['source']>,
    key: string,
  ): string | undefined {
    if (source === 'headers') {
      const headerValue = request.headers[key.toLowerCase()];

      if (Array.isArray(headerValue)) {
        return headerValue[0];
      }

      return headerValue;
    }

    const container = request[source] as Record<string, unknown> | undefined;
    const value = container?.[key];

    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
