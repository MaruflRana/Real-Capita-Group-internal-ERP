import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import {
  extractDatabaseErrorMessage,
  isUniqueConstraintError,
  toConflictException,
} from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import { CrmPropertyDeskReferenceService } from './crm-property-desk-reference.service';
import type {
  CreateInstallmentSchedulesDto,
  InstallmentScheduleDto,
  InstallmentSchedulesListQueryDto,
  UpdateInstallmentScheduleDto,
} from './dto/installment-schedules.dto';
import {
  getTodayDateString,
  normalizeOptionalString,
  parseCalendarDate,
  parseDecimalAmount,
} from './property-desk.utils';

const INSTALLMENT_SCHEDULE_SORT_FIELDS = [
  'amount',
  'createdAt',
  'dueDate',
  'sequenceNumber',
  'updatedAt',
] as const;

type InstallmentScheduleRecord = Prisma.InstallmentScheduleGetPayload<{
  include: {
    saleContract: {
      include: {
        booking: {
          include: {
            customer: true;
            project: true;
            unit: true;
          };
        };
      };
    };
    collections: {
      select: {
        amount: true;
      };
    };
  };
}>;

@Injectable()
export class InstallmentSchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: CrmPropertyDeskReferenceService,
  ) {}

  async listInstallmentSchedules(
    companyId: string,
    query: InstallmentSchedulesListQueryDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const today = parseCalendarDate(getTodayDateString(), 'today');
    const where: Prisma.InstallmentScheduleWhereInput = {
      companyId,
      ...(query.saleContractId ? { saleContractId: query.saleContractId } : {}),
      ...(query.dueState === 'due'
        ? { dueDate: today }
        : query.dueState === 'overdue'
          ? { dueDate: { lt: today } }
          : {}),
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
                saleContract: {
                  reference: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                saleContract: {
                  booking: {
                    customer: {
                      fullName: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
              {
                saleContract: {
                  booking: {
                    unit: {
                      code: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
              {
                saleContract: {
                  booking: {
                    unit: {
                      name: {
                        contains: query.search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      INSTALLMENT_SCHEDULE_SORT_FIELDS,
      'sequenceNumber',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.InstallmentScheduleOrderByWithRelationInput;
    const [installmentSchedules, total] = await Promise.all([
      this.prisma.installmentSchedule.findMany({
        where,
        include: {
          saleContract: {
            include: {
              booking: {
                include: {
                  customer: true,
                  project: true,
                  unit: true,
                },
              },
            },
          },
          collections: {
            select: {
              amount: true,
            },
          },
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.installmentSchedule.count({
        where,
      }),
    ]);

    return {
      items: installmentSchedules.map((schedule) => this.mapSchedule(schedule)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getInstallmentScheduleDetail(
    companyId: string,
    installmentScheduleId: string,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const installmentSchedule = await this.getInstallmentScheduleRecord(
      companyId,
      installmentScheduleId,
    );

    return this.mapSchedule(installmentSchedule);
  }

  async createInstallmentSchedules(
    companyId: string,
    createInstallmentSchedulesDto: CreateInstallmentSchedulesDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);
    await this.referenceService.getSaleContractRecord(
      companyId,
      createInstallmentSchedulesDto.saleContractId,
    );

    const sequenceNumbers = createInstallmentSchedulesDto.rows.map(
      (row) => row.sequenceNumber,
    );

    if (new Set(sequenceNumbers).size !== sequenceNumbers.length) {
      throw new BadRequestException(
        'Installment schedule sequence numbers must be unique within the request.',
      );
    }

    const createdSchedules = await this.prisma.$transaction(async (transaction) =>
      Promise.all(
        createInstallmentSchedulesDto.rows.map((row) =>
          transaction.installmentSchedule.create({
            data: {
              companyId,
              saleContractId: createInstallmentSchedulesDto.saleContractId,
              sequenceNumber: row.sequenceNumber,
              dueDate: parseCalendarDate(row.dueDate, 'dueDate'),
              amount: parseDecimalAmount(row.amount, 'amount'),
              description: normalizeOptionalString(row.description) ?? null,
            },
            include: {
              saleContract: {
                include: {
                  booking: {
                    include: {
                      customer: true,
                      project: true,
                      unit: true,
                    },
                  },
                },
              },
              collections: {
                select: {
                  amount: true,
                },
              },
            },
          }),
        ),
      ),
    ).catch((error: unknown) => this.throwInstallmentScheduleMutationError(error));

    return {
      items: createdSchedules.map((schedule) => this.mapSchedule(schedule)),
      meta: buildPaginationMeta(
        {
          page: 1,
          pageSize: createdSchedules.length,
        },
        createdSchedules.length,
      ),
    };
  }

  async updateInstallmentSchedule(
    companyId: string,
    installmentScheduleId: string,
    updateInstallmentScheduleDto: UpdateInstallmentScheduleDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const existingSchedule = await this.getInstallmentScheduleRecord(
      companyId,
      installmentScheduleId,
    );

    if (updateInstallmentScheduleDto.sequenceNumber === undefined &&
        updateInstallmentScheduleDto.dueDate === undefined &&
        updateInstallmentScheduleDto.amount === undefined &&
        updateInstallmentScheduleDto.description === undefined) {
      return this.mapSchedule(existingSchedule);
    }

    if (existingSchedule.collections.length > 0) {
      throw new BadRequestException(
        'Installment schedules with linked collections cannot be changed.',
      );
    }

    try {
      await this.prisma.installmentSchedule.update({
        where: {
          id: existingSchedule.id,
        },
        data: {
          sequenceNumber:
            updateInstallmentScheduleDto.sequenceNumber ??
            existingSchedule.sequenceNumber,
          dueDate:
            updateInstallmentScheduleDto.dueDate === undefined
              ? existingSchedule.dueDate
              : parseCalendarDate(updateInstallmentScheduleDto.dueDate, 'dueDate'),
          amount:
            updateInstallmentScheduleDto.amount === undefined
              ? existingSchedule.amount
              : parseDecimalAmount(updateInstallmentScheduleDto.amount, 'amount'),
          description:
            updateInstallmentScheduleDto.description === undefined
              ? existingSchedule.description
              : (normalizeOptionalString(updateInstallmentScheduleDto.description) ??
                null),
        },
      });
    } catch (error) {
      this.throwInstallmentScheduleMutationError(error);
    }

    return this.getInstallmentScheduleDetail(companyId, installmentScheduleId);
  }

  async removeInstallmentSchedule(
    companyId: string,
    installmentScheduleId: string,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const existingSchedule = await this.getInstallmentScheduleRecord(
      companyId,
      installmentScheduleId,
    );

    if (existingSchedule.collections.length > 0) {
      throw new BadRequestException(
        'Installment schedules with linked collections cannot be changed.',
      );
    }

    try {
      await this.prisma.installmentSchedule.delete({
        where: {
          id: existingSchedule.id,
        },
      });
    } catch (error) {
      this.throwInstallmentScheduleMutationError(error);
    }

    return this.mapSchedule(existingSchedule);
  }

  private async getInstallmentScheduleRecord(
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
                unit: true,
              },
            },
          },
        },
        collections: {
          select: {
            amount: true,
          },
        },
      },
    });

    if (!installmentSchedule) {
      throw new NotFoundException('Installment schedule not found.');
    }

    return installmentSchedule;
  }

  private mapSchedule(
    installmentSchedule: InstallmentScheduleRecord,
  ): InstallmentScheduleDto {
    const collectedAmount = installmentSchedule.collections.reduce(
      (total, collection) => total.plus(collection.amount),
      new Prisma.Decimal(0),
    );
    const balanceAmount = installmentSchedule.amount.minus(collectedAmount);

    return {
      id: installmentSchedule.id,
      companyId: installmentSchedule.companyId,
      saleContractId: installmentSchedule.saleContractId,
      bookingId: installmentSchedule.saleContract.bookingId,
      customerId: installmentSchedule.saleContract.booking.customerId,
      customerName: installmentSchedule.saleContract.booking.customer.fullName,
      projectId: installmentSchedule.saleContract.booking.projectId,
      projectCode: installmentSchedule.saleContract.booking.project.code,
      projectName: installmentSchedule.saleContract.booking.project.name,
      unitId: installmentSchedule.saleContract.booking.unitId,
      unitCode: installmentSchedule.saleContract.booking.unit.code,
      unitName: installmentSchedule.saleContract.booking.unit.name,
      sequenceNumber: installmentSchedule.sequenceNumber,
      dueDate: installmentSchedule.dueDate.toISOString().slice(0, 10),
      amount: installmentSchedule.amount.toFixed(2),
      collectedAmount: collectedAmount.toFixed(2),
      balanceAmount: balanceAmount.toFixed(2),
      description: installmentSchedule.description,
      createdAt: installmentSchedule.createdAt.toISOString(),
      updatedAt: installmentSchedule.updatedAt.toISOString(),
    };
  }

  private throwInstallmentScheduleMutationError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage) {
      throw new BadRequestException(databaseMessage);
    }

    if (isUniqueConstraintError(error)) {
      throw toConflictException(
        'An installment schedule with this sequence number already exists for the contract.',
      );
    }

    throw error;
  }
}
