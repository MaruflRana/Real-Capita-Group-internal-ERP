import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttachmentEntityType } from '@prisma/client';

import { ROLE_COMPANY_ADMIN } from '../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { PrismaService } from '../database/prisma.service';
import { ATTACHMENT_ENTITY_ROLE_ACCESS } from './attachments.constants';

@Injectable()
export class AttachmentEntityReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }
  }

  getAccessibleEntityTypes(
    authenticatedUser: AuthenticatedUser,
  ): AttachmentEntityType[] {
    if (authenticatedUser.roles.includes(ROLE_COMPANY_ADMIN)) {
      return Object.values(AttachmentEntityType);
    }

    return Object.values(AttachmentEntityType).filter((entityType) =>
      ATTACHMENT_ENTITY_ROLE_ACCESS[entityType].some((roleCode) =>
        authenticatedUser.roles.includes(roleCode),
      ),
    );
  }

  assertEntityAccess(
    authenticatedUser: AuthenticatedUser,
    entityType: AttachmentEntityType,
  ): void {
    if (authenticatedUser.roles.includes(ROLE_COMPANY_ADMIN)) {
      return;
    }

    const allowedRoles = ATTACHMENT_ENTITY_ROLE_ACCESS[entityType];

    if (!allowedRoles.some((roleCode) => authenticatedUser.roles.includes(roleCode))) {
      throw new ForbiddenException(
        `You do not have access to manage attachments for ${entityType.toLowerCase()} records.`,
      );
    }
  }

  async assertEntityReference(
    companyId: string,
    entityType: AttachmentEntityType,
    entityId: string,
  ): Promise<void> {
    if (entityType === AttachmentEntityType.COMPANY) {
      if (entityId !== companyId) {
        throw new BadRequestException(
          'Company attachments must link to the current company scope.',
        );
      }

      await this.assertCompanyExists(companyId);

      return;
    }

    const exists = await this.resolveEntityReference(companyId, entityType, entityId);

    if (!exists) {
      throw new NotFoundException(
        `${entityType.toLowerCase().replace('_', ' ')} was not found in the requested company.`,
      );
    }
  }

  private async resolveEntityReference(
    companyId: string,
    entityType: AttachmentEntityType,
    entityId: string,
  ): Promise<boolean> {
    switch (entityType) {
      case AttachmentEntityType.USER: {
        const user = await this.prisma.user.findFirst({
          where: {
            id: entityId,
            userRoles: {
              some: {
                companyId,
              },
            },
          },
          select: {
            id: true,
          },
        });

        return Boolean(user);
      }

      case AttachmentEntityType.EMPLOYEE: {
        const employee = await this.prisma.employee.findFirst({
          where: {
            id: entityId,
            companyId,
          },
          select: {
            id: true,
          },
        });

        return Boolean(employee);
      }

      case AttachmentEntityType.PROJECT: {
        const project = await this.prisma.project.findFirst({
          where: {
            id: entityId,
            companyId,
          },
          select: {
            id: true,
          },
        });

        return Boolean(project);
      }

      case AttachmentEntityType.UNIT: {
        const unit = await this.prisma.unit.findFirst({
          where: {
            id: entityId,
            project: {
              companyId,
            },
          },
          select: {
            id: true,
          },
        });

        return Boolean(unit);
      }

      case AttachmentEntityType.CUSTOMER: {
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: entityId,
            companyId,
          },
          select: {
            id: true,
          },
        });

        return Boolean(customer);
      }

      case AttachmentEntityType.BOOKING: {
        const booking = await this.prisma.booking.findFirst({
          where: {
            id: entityId,
            companyId,
          },
          select: {
            id: true,
          },
        });

        return Boolean(booking);
      }

      case AttachmentEntityType.SALE_CONTRACT: {
        const saleContract = await this.prisma.saleContract.findFirst({
          where: {
            id: entityId,
            companyId,
          },
          select: {
            id: true,
          },
        });

        return Boolean(saleContract);
      }

      case AttachmentEntityType.VOUCHER: {
        const voucher = await this.prisma.voucher.findFirst({
          where: {
            id: entityId,
            companyId,
          },
          select: {
            id: true,
          },
        });

        return Boolean(voucher);
      }

      case AttachmentEntityType.PAYROLL_RUN: {
        const payrollRun = await this.prisma.payrollRun.findFirst({
          where: {
            id: entityId,
            companyId,
          },
          select: {
            id: true,
          },
        });

        return Boolean(payrollRun);
      }

      default:
        return false;
    }
  }
}
