import { Injectable } from '@nestjs/common';
import { AttachmentEntityType, Prisma } from '@prisma/client';

import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import { PrismaService } from '../database/prisma.service';
import type { CompanyUsersListQueryDto } from '../users/dto/company-users-list-query.dto';
import type { AttachmentEntityReferencesListQueryDto } from './dto/attachment-references.dto';
import { ATTACHMENT_ENTITY_LABELS } from './attachments.constants';
import { AttachmentEntityReferenceService } from './attachment-entity-reference.service';

type UserReferenceRecord = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

type EmployeeReferenceRecord = Prisma.EmployeeGetPayload<{
  include: {
    department: true;
    location: true;
    user: true;
  };
}>;

type ProjectReferenceRecord = Prisma.ProjectGetPayload<{
  include: {
    location: true;
  };
}>;

type UnitReferenceRecord = Prisma.UnitGetPayload<{
  include: {
    project: true;
    unitType: true;
    unitStatus: true;
  };
}>;

type VoucherReferenceRecord = Prisma.VoucherGetPayload<{
  include: {
    _count: {
      select: {
        voucherLines: true;
      };
    };
  };
}>;

type PayrollRunReferenceRecord = Prisma.PayrollRunGetPayload<{
  include: {
    project: true;
    costCenter: true;
    postedVoucher: true;
  };
}>;

@Injectable()
export class AttachmentsReferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entityReferenceService: AttachmentEntityReferenceService,
  ) {}

  async listEntityTypes(
    companyId: string,
    authenticatedUser: AuthenticatedUser,
  ) {
    await this.entityReferenceService.assertCompanyExists(companyId);

    return {
      items: this.entityReferenceService
        .getAccessibleEntityTypes(authenticatedUser)
        .map((entityType) => ({
          entityType,
          label: ATTACHMENT_ENTITY_LABELS[entityType],
        })),
    };
  }

  async listEntityReferences(
    companyId: string,
    authenticatedUser: AuthenticatedUser,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    await this.entityReferenceService.assertCompanyExists(companyId);
    this.entityReferenceService.assertEntityAccess(
      authenticatedUser,
      query.entityType,
    );

    switch (query.entityType) {
      case AttachmentEntityType.COMPANY:
        return this.listCompanyReferences(companyId, query);
      case AttachmentEntityType.USER:
        return this.listUserEntityReferences(companyId, query);
      case AttachmentEntityType.EMPLOYEE:
        return this.listEmployeeReferences(companyId, query);
      case AttachmentEntityType.PROJECT:
        return this.listProjectReferences(companyId, query);
      case AttachmentEntityType.UNIT:
        return this.listUnitReferences(companyId, query);
      case AttachmentEntityType.CUSTOMER:
        return this.listCustomerReferences(companyId, query);
      case AttachmentEntityType.BOOKING:
        return this.listBookingReferences(companyId, query);
      case AttachmentEntityType.SALE_CONTRACT:
        return this.listSaleContractReferences(companyId, query);
      case AttachmentEntityType.VOUCHER:
        return this.listVoucherReferences(companyId, query);
      case AttachmentEntityType.PAYROLL_RUN:
        return this.listPayrollRunReferences(companyId, query);
    }
  }

  async listUploaderReferences(
    companyId: string,
    query: CompanyUsersListQueryDto,
  ) {
    await this.entityReferenceService.assertCompanyExists(companyId);

    const normalizedRoleCode = query.roleCode?.trim().toLowerCase();
    const andConditions: Prisma.UserWhereInput[] = [
      {
        userRoles: {
          some: {
            companyId,
          },
        },
      },
    ];

    if (query.search) {
      andConditions.push({
        OR: [
          {
            email: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            firstName: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    if (normalizedRoleCode) {
      andConditions.push({
        userRoles: {
          some: {
            companyId,
            role: {
              code: normalizedRoleCode,
            },
          },
        },
      });
    }

    if (query.isActive === true) {
      andConditions.push({
        userRoles: {
          some: {
            companyId,
            isActive: true,
            role: {
              ...(normalizedRoleCode ? { code: normalizedRoleCode } : {}),
              isActive: true,
            },
          },
        },
      });
    }

    if (query.isActive === false) {
      andConditions.push({
        NOT: {
          userRoles: {
            some: {
              companyId,
              isActive: true,
              role: {
                ...(normalizedRoleCode ? { code: normalizedRoleCode } : {}),
                isActive: true,
              },
            },
          },
        },
      });
    }

    const where: Prisma.UserWhereInput = {
      AND: andConditions,
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: {
            where: {
              companyId,
            },
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          email: query.sortOrder,
        },
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      items: items.map((user) => this.mapCompanyUser(user)),
      meta: buildPaginationMeta(query, total),
    };
  }

  private async listCompanyReferences(
    companyId: string,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
        ...(query.search
          ? {
              OR: [
                {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
                {
                  slug: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
    });

    const items = company
      ? [
          {
            id: company.id,
            entityType: AttachmentEntityType.COMPANY,
            primaryLabel: company.name,
            secondaryLabel: company.slug,
            contextLabel: company.isActive ? 'Active company scope' : 'Inactive company scope',
            isActive: company.isActive,
          },
        ]
      : [];

    return {
      items,
      meta: buildPaginationMeta(query, items.length),
    };
  }

  private async listUserEntityReferences(
    companyId: string,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    const andConditions: Prisma.UserWhereInput[] = [
      {
        userRoles: {
          some: {
            companyId,
          },
        },
      },
    ];

    if (query.search) {
      andConditions.push({
        OR: [
          {
            email: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            firstName: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    if (query.isActive === true) {
      andConditions.push({
        userRoles: {
          some: {
            companyId,
            isActive: true,
            role: {
              isActive: true,
            },
          },
        },
      });
    }

    if (query.isActive === false) {
      andConditions.push({
        NOT: {
          userRoles: {
            some: {
              companyId,
              isActive: true,
              role: {
                isActive: true,
              },
            },
          },
        },
      });
    }

    const where: Prisma.UserWhereInput = {
      AND: andConditions,
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: {
            where: {
              companyId,
            },
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          email: query.sortOrder,
        },
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      items: items.map((user) => {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        const activeRoleCodes = Array.from(
          new Set(
            user.userRoles
              .filter((assignment) => assignment.isActive && assignment.role.isActive)
              .map((assignment) => assignment.role.code),
          ),
        ).sort();

        return {
          id: user.id,
          entityType: AttachmentEntityType.USER,
          primaryLabel: user.email,
          secondaryLabel: fullName || null,
          contextLabel:
            activeRoleCodes.length > 0
              ? activeRoleCodes.join(', ')
              : 'No active company roles',
          isActive: activeRoleCodes.length > 0,
        };
      }),
      meta: buildPaginationMeta(query, total),
    };
  }

  private async listEmployeeReferences(
    companyId: string,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    const where: Prisma.EmployeeWhereInput = {
      companyId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search
        ? {
            OR: [
              {
                employeeCode: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                fullName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                department: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                location: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                user: {
                  email: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          department: true,
          location: true,
          user: true,
        },
        orderBy: {
          employeeCode: query.sortOrder,
        },
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.employee.count({
        where,
      }),
    ]);

    return {
      items: items.map((employee) => this.mapEmployeeReference(employee)),
      meta: buildPaginationMeta(query, total),
    };
  }

  private async listProjectReferences(
    companyId: string,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    const where: Prisma.ProjectWhereInput = {
      companyId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search
        ? {
            OR: [
              {
                code: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                location: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          location: true,
        },
        orderBy: {
          name: query.sortOrder,
        },
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.project.count({
        where,
      }),
    ]);

    return {
      items: items.map((project) => this.mapProjectReference(project)),
      meta: buildPaginationMeta(query, total),
    };
  }

  private async listUnitReferences(
    companyId: string,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    const where: Prisma.UnitWhereInput = {
      project: {
        companyId,
      },
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search
        ? {
            OR: [
              {
                code: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                project: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                project: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                unitType: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                unitStatus: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        include: {
          project: true,
          unitType: true,
          unitStatus: true,
        },
        orderBy: {
          code: query.sortOrder,
        },
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.unit.count({
        where,
      }),
    ]);

    return {
      items: items.map((unit) => this.mapUnitReference(unit)),
      meta: buildPaginationMeta(query, total),
    };
  }

  private async listCustomerReferences(
    companyId: string,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    const where: Prisma.CustomerWhereInput = {
      companyId,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search
        ? {
            OR: [
              {
                fullName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                phone: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: {
          fullName: query.sortOrder,
        },
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.customer.count({
        where,
      }),
    ]);

    return {
      items: items.map((customer) => ({
        id: customer.id,
        entityType: AttachmentEntityType.CUSTOMER,
        primaryLabel: customer.fullName,
        secondaryLabel:
          [customer.email, customer.phone].filter(Boolean).join(' | ') || null,
        contextLabel: customer.address ?? null,
        isActive: customer.isActive,
      })),
      meta: buildPaginationMeta(query, total),
    };
  }

  private async listBookingReferences(
    companyId: string,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    const where: Prisma.BookingWhereInput = {
      companyId,
      ...(query.search
        ? {
            OR: [
              {
                customer: {
                  fullName: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                unit: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                unit: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                project: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                project: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                notes: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          project: true,
          customer: true,
          unit: true,
        },
        orderBy: {
          bookingDate: query.sortOrder,
        },
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.booking.count({
        where,
      }),
    ]);

    return {
      items: items.map((booking) => ({
        id: booking.id,
        entityType: AttachmentEntityType.BOOKING,
        primaryLabel: `${booking.customer.fullName} | ${booking.unit.code}`,
        secondaryLabel: `${booking.project.code} - ${booking.project.name}`,
        contextLabel: `${booking.status} | ${booking.bookingDate.toISOString().slice(0, 10)}`,
        isActive: null,
      })),
      meta: buildPaginationMeta(query, total),
    };
  }

  private async listSaleContractReferences(
    companyId: string,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    const where: Prisma.SaleContractWhereInput = {
      companyId,
      ...(query.search
        ? {
            OR: [
              {
                booking: {
                  customer: {
                    fullName: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                booking: {
                  unit: {
                    code: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                booking: {
                  project: {
                    code: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                reference: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                notes: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.saleContract.findMany({
        where,
        include: {
          booking: {
            include: {
              customer: true,
              project: true,
              unit: true,
            },
          },
        },
        orderBy: {
          contractDate: query.sortOrder,
        },
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.saleContract.count({
        where,
      }),
    ]);

    return {
      items: items.map((saleContract) => ({
        id: saleContract.id,
        entityType: AttachmentEntityType.SALE_CONTRACT,
        primaryLabel: `${saleContract.booking.customer.fullName} | ${saleContract.booking.unit.code}`,
        secondaryLabel:
          saleContract.reference ??
          `${saleContract.booking.project.code} - ${saleContract.booking.project.name}`,
        contextLabel: `${saleContract.contractDate.toISOString().slice(0, 10)} | ${saleContract.contractAmount.toFixed(2)}`,
        isActive: null,
      })),
      meta: buildPaginationMeta(query, total),
    };
  }

  private async listVoucherReferences(
    companyId: string,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    const where: Prisma.VoucherWhereInput = {
      companyId,
      ...(query.search
        ? {
            OR: [
              {
                reference: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where,
        include: {
          _count: {
            select: {
              voucherLines: true,
            },
          },
        },
        orderBy: {
          voucherDate: query.sortOrder,
        },
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.voucher.count({
        where,
      }),
    ]);

    return {
      items: items.map((voucher) => this.mapVoucherReference(voucher)),
      meta: buildPaginationMeta(query, total),
    };
  }

  private async listPayrollRunReferences(
    companyId: string,
    query: AttachmentEntityReferencesListQueryDto,
  ) {
    const where: Prisma.PayrollRunWhereInput = {
      companyId,
      ...(query.search
        ? {
            OR: [
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                project: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                project: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                costCenter: {
                  code: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                costCenter: {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                postedVoucher: {
                  reference: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.payrollRun.findMany({
        where,
        include: {
          project: true,
          costCenter: true,
          postedVoucher: true,
        },
        orderBy: [
          {
            payrollYear: query.sortOrder,
          },
          {
            payrollMonth: query.sortOrder,
          },
        ],
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.payrollRun.count({
        where,
      }),
    ]);

    return {
      items: items.map((payrollRun) => this.mapPayrollRunReference(payrollRun)),
      meta: buildPaginationMeta(query, total),
    };
  }

  private mapCompanyUser(user: UserReferenceRecord) {
    const roles = Array.from(
      new Set(
        user.userRoles
          .filter((assignment) => assignment.isActive && assignment.role.isActive)
          .map((assignment) => assignment.role.code),
      ),
    ).sort();

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      identityIsActive: user.isActive,
      companyAccessIsActive: roles.length > 0,
      roles,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private mapEmployeeReference(employee: EmployeeReferenceRecord) {
    return {
      id: employee.id,
      entityType: AttachmentEntityType.EMPLOYEE,
      primaryLabel: `${employee.employeeCode} - ${employee.fullName}`,
      secondaryLabel:
        [employee.department?.name ?? null, employee.location?.name ?? null]
          .filter(Boolean)
          .join(' | ') || null,
      contextLabel: employee.user?.email ?? null,
      isActive: employee.isActive,
    };
  }

  private mapProjectReference(project: ProjectReferenceRecord) {
    return {
      id: project.id,
      entityType: AttachmentEntityType.PROJECT,
      primaryLabel: `${project.code} - ${project.name}`,
      secondaryLabel: project.location?.name ?? null,
      contextLabel: project.description ?? null,
      isActive: project.isActive,
    };
  }

  private mapUnitReference(unit: UnitReferenceRecord) {
    return {
      id: unit.id,
      entityType: AttachmentEntityType.UNIT,
      primaryLabel: `${unit.code} - ${unit.name}`,
      secondaryLabel: `${unit.project.code} - ${unit.project.name}`,
      contextLabel:
        [unit.unitType.name, unit.unitStatus.name].filter(Boolean).join(' | ') || null,
      isActive: unit.isActive,
    };
  }

  private mapVoucherReference(voucher: VoucherReferenceRecord) {
    const label =
      voucher.reference && voucher.reference.trim().length > 0
        ? voucher.reference
        : `${voucher.voucherType} ${voucher.voucherDate.toISOString().slice(0, 10)}`;

    return {
      id: voucher.id,
      entityType: AttachmentEntityType.VOUCHER,
      primaryLabel: label,
      secondaryLabel: `${voucher.voucherType} | ${voucher.status}`,
      contextLabel: `${voucher.voucherDate.toISOString().slice(0, 10)} | ${voucher._count.voucherLines} lines`,
      isActive: null,
    };
  }

  private mapPayrollRunReference(payrollRun: PayrollRunReferenceRecord) {
    const scopeLabels = [
      payrollRun.project ? `${payrollRun.project.code} - ${payrollRun.project.name}` : null,
      payrollRun.costCenter
        ? `${payrollRun.costCenter.code} - ${payrollRun.costCenter.name}`
        : null,
    ].filter((value): value is string => Boolean(value));

    return {
      id: payrollRun.id,
      entityType: AttachmentEntityType.PAYROLL_RUN,
      primaryLabel: `Payroll ${payrollRun.payrollYear}-${String(payrollRun.payrollMonth).padStart(2, '0')}`,
      secondaryLabel: scopeLabels.join(' | ') || 'Company-wide payroll scope',
      contextLabel:
        payrollRun.postedVoucher?.reference
          ? `${payrollRun.status} | ${payrollRun.postedVoucher.reference}`
          : payrollRun.status,
      isActive: null,
    };
  }
}
