import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AUTH_ROLES_KEY, COMPANY_SCOPE_KEY } from '../constants/auth.constants';
import type { CompanyScopeOptions } from '../decorators/company-scope.decorator';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class CompanyAssignmentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authRepository: AuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const company = await this.authRepository.findCompanyById(companyValue);

    if (!company) {
      return true;
    }

    const assignments = await this.authRepository.findUserCompanyAssignments(
      authenticatedUser.id,
      companyValue,
      {
        allowInactiveCompany: scopeOptions.allowInactiveCompany ?? false,
      },
    );

    if (!assignments) {
      return false;
    }

    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(AUTH_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const assignedRoles = new Set(
      assignments.map((assignment) => assignment.role.code),
    );

    return requiredRoles.some((role) => assignedRoles.has(role));
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
