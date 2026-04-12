import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AUDIT_EVENT_TYPES } from '../audit/constants/audit.constants';
import { AuditService } from '../audit/audit.service';
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
import type { SaleContractRecord } from './crm-property-desk-reference.service';
import { CrmPropertyDeskReferenceService } from './crm-property-desk-reference.service';
import type {
  CreateSaleContractDto,
  SaleContractDto,
  SaleContractsListQueryDto,
  UpdateSaleContractDto,
} from './dto/sale-contracts.dto';
import {
  buildDateRangeFilter,
  normalizeOptionalString,
  parseCalendarDate,
  parseDecimalAmount,
} from './property-desk.utils';

const SALE_CONTRACT_SORT_FIELDS = [
  'contractAmount',
  'contractDate',
  'createdAt',
  'updatedAt',
] as const;

type SaleContractListRecord = Prisma.SaleContractGetPayload<{
  include: {
    booking: {
      include: {
        customer: true;
        project: true;
        unit: true;
      };
    };
  };
}>;

@Injectable()
export class SaleContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: CrmPropertyDeskReferenceService,
    private readonly auditService: AuditService,
  ) {}

  async listSaleContracts(companyId: string, query: SaleContractsListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const contractDateFilter = buildDateRangeFilter(
      query.dateFrom,
      query.dateTo,
      'date',
    );
    const where: Prisma.SaleContractWhereInput = {
      companyId,
      ...(query.customerId
        ? {
            booking: {
              customerId: query.customerId,
            },
          }
        : {}),
      ...(query.projectId
        ? {
            booking: {
              projectId: query.projectId,
            },
          }
        : {}),
      ...(query.unitId
        ? {
            booking: {
              unitId: query.unitId,
            },
          }
        : {}),
      ...(contractDateFilter ? { contractDate: contractDateFilter } : {}),
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
                notes: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
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
                  unit: {
                    name: {
                      contains: query.search,
                      mode: 'insensitive',
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
      SALE_CONTRACT_SORT_FIELDS,
      'contractDate',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.SaleContractOrderByWithRelationInput;
    const [saleContracts, total] = await Promise.all([
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
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.saleContract.count({
        where,
      }),
    ]);

    return {
      items: saleContracts.map((saleContract) =>
        this.mapSaleContract(saleContract),
      ),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getSaleContractDetail(companyId: string, saleContractId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const saleContract = await this.referenceService.getSaleContractRecord(
      companyId,
      saleContractId,
    );

    return this.mapSaleContract(saleContract);
  }

  async createSaleContract(
    companyId: string,
    actorUserId: string,
    requestId: string | undefined,
    createSaleContractDto: CreateSaleContractDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const booking = await this.referenceService.getBookingRecord(
      companyId,
      createSaleContractDto.bookingId,
    );

    if (booking.saleContract) {
      throw toConflictException(
        'A sale contract already exists for the requested booking.',
      );
    }

    if (booking.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Sale contract can only be created from an active booking.',
      );
    }

    if (booking.unit.unitStatus.code !== 'BOOKED') {
      throw new BadRequestException(
        'Sale contract creation requires the linked unit to be BOOKED.',
      );
    }

    try {
      const saleContract = await this.prisma.saleContract.create({
        data: {
          companyId,
          bookingId: createSaleContractDto.bookingId,
          contractDate: parseCalendarDate(
            createSaleContractDto.contractDate,
            'contractDate',
          ),
          contractAmount: parseDecimalAmount(
            createSaleContractDto.contractAmount,
            'contractAmount',
          ),
          reference: normalizeOptionalString(createSaleContractDto.reference) ?? null,
          notes: normalizeOptionalString(createSaleContractDto.notes) ?? null,
        },
      });

      await this.auditService.recordEvent({
        companyId,
        actorUserId,
        category: 'CRM_PROPERTY_DESK',
        eventType: AUDIT_EVENT_TYPES.saleContractCreated,
        targetEntityType: 'SALE_CONTRACT',
        targetEntityId: saleContract.id,
        requestId,
        metadata: {
          bookingId: saleContract.bookingId,
          contractDate: saleContract.contractDate.toISOString().slice(0, 10),
          contractAmount: saleContract.contractAmount.toFixed(2),
          reference: saleContract.reference,
        },
      });

      return this.getSaleContractDetail(companyId, saleContract.id);
    } catch (error) {
      this.throwSaleContractMutationError(error);
    }
  }

  async updateSaleContract(
    companyId: string,
    saleContractId: string,
    updateSaleContractDto: UpdateSaleContractDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const existingSaleContract = await this.referenceService.getSaleContractRecord(
      companyId,
      saleContractId,
    );
    const normalizedReference =
      updateSaleContractDto.reference === undefined
        ? existingSaleContract.reference
        : (normalizeOptionalString(updateSaleContractDto.reference) ?? null);
    const normalizedNotes =
      updateSaleContractDto.notes === undefined
        ? existingSaleContract.notes
        : (normalizeOptionalString(updateSaleContractDto.notes) ?? null);

    if (
      normalizedReference === existingSaleContract.reference &&
      normalizedNotes === existingSaleContract.notes
    ) {
      return this.mapSaleContract(existingSaleContract);
    }

    try {
      await this.prisma.saleContract.update({
        where: {
          id: existingSaleContract.id,
        },
        data: {
          reference: normalizedReference,
          notes: normalizedNotes,
        },
      });
    } catch (error) {
      this.throwSaleContractMutationError(error);
    }

    return this.getSaleContractDetail(companyId, saleContractId);
  }

  private mapSaleContract(
    saleContract: SaleContractRecord | SaleContractListRecord,
  ): SaleContractDto {
    return {
      id: saleContract.id,
      companyId: saleContract.companyId,
      bookingId: saleContract.bookingId,
      customerId: saleContract.booking.customerId,
      customerName: saleContract.booking.customer.fullName,
      projectId: saleContract.booking.projectId,
      projectCode: saleContract.booking.project.code,
      projectName: saleContract.booking.project.name,
      unitId: saleContract.booking.unitId,
      unitCode: saleContract.booking.unit.code,
      unitName: saleContract.booking.unit.name,
      bookingDate: saleContract.booking.bookingDate.toISOString().slice(0, 10),
      bookingAmount: saleContract.booking.bookingAmount.toFixed(2),
      contractDate: saleContract.contractDate.toISOString().slice(0, 10),
      contractAmount: saleContract.contractAmount.toFixed(2),
      reference: saleContract.reference,
      notes: saleContract.notes,
      createdAt: saleContract.createdAt.toISOString(),
      updatedAt: saleContract.updatedAt.toISOString(),
    };
  }

  private throwSaleContractMutationError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage) {
      throw new BadRequestException(databaseMessage);
    }

    if (isUniqueConstraintError(error)) {
      throw toConflictException(
        'A sale contract already exists for the requested booking.',
      );
    }

    throw error;
  }
}
