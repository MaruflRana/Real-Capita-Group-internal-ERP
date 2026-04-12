import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type VoucherType } from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { ProjectsListQueryDto } from '../project-property/dto/projects.dto';
import type { UnitsListQueryDto } from '../project-property/dto/units.dto';
import type { VouchersListQueryDto } from '../vouchers/dto/vouchers.dto';
import { buildDateRangeFilter } from './property-desk.utils';

export type CustomerRecord = Prisma.CustomerGetPayload<object>;
export type UnitRecord = Prisma.UnitGetPayload<{
  include: {
    project: true;
    unitStatus: true;
    unitType: true;
  };
}>;
export type BookingRecord = Prisma.BookingGetPayload<{
  include: {
    customer: true;
    project: true;
    unit: {
      include: {
        unitStatus: true;
        unitType: true;
      };
    };
    saleContract: true;
  };
}>;
export type SaleContractRecord = Prisma.SaleContractGetPayload<{
  include: {
    booking: {
      include: {
        customer: true;
        project: true;
        unit: {
          include: {
            unitStatus: true;
            unitType: true;
          };
        };
      };
    };
  };
}>;
export type InstallmentScheduleRecord = Prisma.InstallmentScheduleGetPayload<{
  include: {
    saleContract: {
      include: {
        booking: {
          include: {
            customer: true;
            project: true;
            unit: {
              include: {
                unitStatus: true;
                unitType: true;
              };
            };
          };
        };
      };
    };
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
    phase: true;
    block: true;
    zone: true;
    unitType: true;
    unitStatus: true;
  };
}>;
type VoucherReferenceRecord = Prisma.VoucherGetPayload<{
  include: {
    voucherLines: {
      select: {
        debitAmount: true;
        creditAmount: true;
      };
    };
  };
}>;

const PROJECT_REFERENCE_SORT_FIELDS = [
  'code',
  'createdAt',
  'name',
  'updatedAt',
] as const;
const UNIT_REFERENCE_SORT_FIELDS = [
  'code',
  'createdAt',
  'name',
  'updatedAt',
] as const;
const VOUCHER_REFERENCE_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'voucherDate',
  'reference',
] as const;

@Injectable()
export class CrmPropertyDeskReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjectReferences(companyId: string, query: ProjectsListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.ProjectWhereInput = {
      companyId,
      ...(query.locationId ? { locationId: query.locationId } : {}),
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
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      PROJECT_REFERENCE_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.ProjectOrderByWithRelationInput;
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          location: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.project.count({
        where,
      }),
    ]);

    return {
      items: projects.map((project) => this.mapProjectReference(project)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async listUnitReferences(companyId: string, query: UnitsListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.UnitWhereInput = {
      project: {
        companyId,
      },
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.phaseId ? { phaseId: query.phaseId } : {}),
      ...(query.blockId ? { blockId: query.blockId } : {}),
      ...(query.zoneId ? { zoneId: query.zoneId } : {}),
      ...(query.unitTypeId ? { unitTypeId: query.unitTypeId } : {}),
      ...(query.unitStatusId ? { unitStatusId: query.unitStatusId } : {}),
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
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      UNIT_REFERENCE_SORT_FIELDS,
      'updatedAt',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.UnitOrderByWithRelationInput;
    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        include: {
          project: true,
          phase: true,
          block: true,
          zone: true,
          unitType: true,
          unitStatus: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.unit.count({
        where,
      }),
    ]);

    return {
      items: units.map((unit) => this.mapUnitReference(unit)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async listPostedVoucherReferences(
    companyId: string,
    query: VouchersListQueryDto,
  ) {
    await this.assertCompanyExists(companyId);

    const voucherDateFilter = buildDateRangeFilter(
      query.dateFrom,
      query.dateTo,
      'date',
    );
    const where: Prisma.VoucherWhereInput = {
      companyId,
      status: 'POSTED',
      ...(query.voucherType
        ? { voucherType: query.voucherType as VoucherType }
        : {}),
      ...(voucherDateFilter ? { voucherDate: voucherDateFilter } : {}),
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
    const sortField = resolveSortField(
      query.sortBy,
      VOUCHER_REFERENCE_SORT_FIELDS,
      'voucherDate',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.VoucherOrderByWithRelationInput;
    const [vouchers, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where,
        include: {
          voucherLines: {
            select: {
              debitAmount: true,
              creditAmount: true,
            },
          },
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.voucher.count({
        where,
      }),
    ]);

    return {
      items: vouchers.map((voucher) => this.mapVoucherReference(voucher)),
      meta: buildPaginationMeta(query, total),
    };
  }

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

  async assertProjectBelongsToCompany(
    companyId: string,
    projectId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
  }

  async getCustomerRecord(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return customer;
  }

  async getUnitRecord(companyId: string, unitId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: unitId,
        project: {
          companyId,
        },
      },
      include: {
        project: true,
        unitStatus: true,
        unitType: true,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found.');
    }

    return unit;
  }

  async getBookingRecord(companyId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        companyId,
      },
      include: {
        customer: true,
        project: true,
        unit: {
          include: {
            unitStatus: true,
            unitType: true,
          },
        },
        saleContract: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    return booking;
  }

  async getSaleContractRecord(companyId: string, saleContractId: string) {
    const saleContract = await this.prisma.saleContract.findFirst({
      where: {
        id: saleContractId,
        companyId,
      },
      include: {
        booking: {
          include: {
            customer: true,
            project: true,
            unit: {
              include: {
                unitStatus: true,
                unitType: true,
              },
            },
          },
        },
      },
    });

    if (!saleContract) {
      throw new NotFoundException('Sale contract not found.');
    }

    return saleContract;
  }

  async getInstallmentScheduleRecord(
    companyId: string,
    installmentScheduleId: string,
  ) {
    const installmentSchedule = await this.prisma.installmentSchedule.findFirst({
      where: {
        id: installmentScheduleId,
        companyId,
      },
      include: {
        saleContract: {
          include: {
            booking: {
              include: {
                customer: true,
                project: true,
                unit: {
                  include: {
                    unitStatus: true,
                    unitType: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!installmentSchedule) {
      throw new NotFoundException('Installment schedule not found.');
    }

    return installmentSchedule;
  }

  async getVoucherRecord(companyId: string, voucherId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: {
        id: voucherId,
        companyId,
      },
      select: {
        id: true,
        status: true,
        voucherDate: true,
        reference: true,
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found.');
    }

    return voucher;
  }

  private mapProjectReference(project: ProjectReferenceRecord) {
    return {
      id: project.id,
      companyId: project.companyId,
      locationId: project.locationId,
      locationCode: project.location?.code ?? null,
      locationName: project.location?.name ?? null,
      code: project.code,
      name: project.name,
      description: project.description,
      isActive: project.isActive,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  private mapUnitReference(unit: UnitReferenceRecord) {
    return {
      id: unit.id,
      companyId: unit.project.companyId,
      projectId: unit.projectId,
      projectCode: unit.project.code,
      projectName: unit.project.name,
      phaseId: unit.phaseId,
      phaseCode: unit.phase?.code ?? null,
      phaseName: unit.phase?.name ?? null,
      blockId: unit.blockId,
      blockCode: unit.block?.code ?? null,
      blockName: unit.block?.name ?? null,
      zoneId: unit.zoneId,
      zoneCode: unit.zone?.code ?? null,
      zoneName: unit.zone?.name ?? null,
      unitTypeId: unit.unitTypeId,
      unitTypeCode: unit.unitType.code,
      unitTypeName: unit.unitType.name,
      unitStatusId: unit.unitStatusId,
      unitStatusCode: unit.unitStatus.code,
      unitStatusName: unit.unitStatus.name,
      code: unit.code,
      name: unit.name,
      description: unit.description,
      isActive: unit.isActive,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
    };
  }

  private mapVoucherReference(voucher: VoucherReferenceRecord) {
    const totals = voucher.voucherLines.reduce(
      (currentTotals, line) => ({
        totalDebit: currentTotals.totalDebit.plus(line.debitAmount),
        totalCredit: currentTotals.totalCredit.plus(line.creditAmount),
      }),
      {
        totalDebit: new Prisma.Decimal(0),
        totalCredit: new Prisma.Decimal(0),
      },
    );

    return {
      id: voucher.id,
      companyId: voucher.companyId,
      voucherType: voucher.voucherType,
      status: voucher.status,
      voucherDate: voucher.voucherDate.toISOString().slice(0, 10),
      description: voucher.description,
      reference: voucher.reference,
      createdById: voucher.createdById,
      postedById: voucher.postedById,
      postedAt: voucher.postedAt?.toISOString() ?? null,
      lineCount: voucher.voucherLines.length,
      totalDebit: totals.totalDebit.toFixed(2),
      totalCredit: totals.totalCredit.toFixed(2),
      createdAt: voucher.createdAt.toISOString(),
      updatedAt: voucher.updatedAt.toISOString(),
    };
  }
}
