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
  CollectionDto,
  CollectionsListQueryDto,
  CreateCollectionDto,
} from './dto/collections.dto';
import {
  buildDateRangeFilter,
  normalizeOptionalString,
  parseCalendarDate,
  parseDecimalAmount,
} from './property-desk.utils';

const COLLECTION_SORT_FIELDS = [
  'amount',
  'collectionDate',
  'createdAt',
  'updatedAt',
] as const;

type CollectionRecord = Prisma.CollectionGetPayload<{
  include: {
    customer: true;
    voucher: true;
  };
}>;

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: CrmPropertyDeskReferenceService,
  ) {}

  async listCollections(companyId: string, query: CollectionsListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const collectionDateFilter = buildDateRangeFilter(
      query.dateFrom,
      query.dateTo,
      'date',
    );
    const where: Prisma.CollectionWhereInput = {
      companyId,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.bookingId ? { bookingId: query.bookingId } : {}),
      ...(query.saleContractId ? { saleContractId: query.saleContractId } : {}),
      ...(query.installmentScheduleId
        ? { installmentScheduleId: query.installmentScheduleId }
        : {}),
      ...(query.voucherId ? { voucherId: query.voucherId } : {}),
      ...(collectionDateFilter ? { collectionDate: collectionDateFilter } : {}),
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
                customer: {
                  fullName: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                voucher: {
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
    const sortField = resolveSortField(
      query.sortBy,
      COLLECTION_SORT_FIELDS,
      'collectionDate',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.CollectionOrderByWithRelationInput;
    const [collections, total] = await Promise.all([
      this.prisma.collection.findMany({
        where,
        include: {
          customer: true,
          voucher: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.collection.count({
        where,
      }),
    ]);

    return {
      items: collections.map((collection) => this.mapCollection(collection)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getCollectionDetail(companyId: string, collectionId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const collection = await this.getCollectionRecord(companyId, collectionId);

    return this.mapCollection(collection);
  }

  async createCollection(companyId: string, createCollectionDto: CreateCollectionDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const customer = await this.referenceService.getCustomerRecord(
      companyId,
      createCollectionDto.customerId,
    );

    if (!customer.isActive) {
      throw new BadRequestException(
        'Inactive customers cannot receive new collections.',
      );
    }

    const voucher = await this.referenceService.getVoucherRecord(
      companyId,
      createCollectionDto.voucherId,
    );

    if (voucher.status !== 'POSTED') {
      throw new BadRequestException('Collection must reference a posted voucher.');
    }

    let bookingId = createCollectionDto.bookingId ?? null;

    if (bookingId) {
      const booking = await this.referenceService.getBookingRecord(companyId, bookingId);

      if (booking.customerId !== createCollectionDto.customerId) {
        throw new BadRequestException(
          'Collection customer does not match the referenced booking.',
        );
      }
    }

    if (createCollectionDto.saleContractId) {
      const saleContract = await this.referenceService.getSaleContractRecord(
        companyId,
        createCollectionDto.saleContractId,
      );

      if (saleContract.booking.customerId !== createCollectionDto.customerId) {
        throw new BadRequestException(
          'Collection customer does not match the referenced sale contract.',
        );
      }

      if (bookingId && saleContract.bookingId !== bookingId) {
        throw new BadRequestException(
          'Collection booking and sale contract do not match.',
        );
      }

      bookingId = saleContract.bookingId;
    }

    if (createCollectionDto.installmentScheduleId) {
      const installmentSchedule =
        await this.referenceService.getInstallmentScheduleRecord(
          companyId,
          createCollectionDto.installmentScheduleId,
        );

      if (
        installmentSchedule.saleContract.booking.customerId !==
        createCollectionDto.customerId
      ) {
        throw new BadRequestException(
          'Collection customer does not match the referenced installment schedule.',
        );
      }

      if (
        createCollectionDto.saleContractId &&
        installmentSchedule.saleContractId !== createCollectionDto.saleContractId
      ) {
        throw new BadRequestException(
          'Collection sale contract and installment schedule do not match.',
        );
      }

      if (
        bookingId &&
        installmentSchedule.saleContract.bookingId !== bookingId
      ) {
        throw new BadRequestException(
          'Collection booking and installment schedule do not match.',
        );
      }
    }

    try {
      const collection = await this.prisma.collection.create({
        data: {
          companyId,
          customerId: createCollectionDto.customerId,
          voucherId: createCollectionDto.voucherId,
          bookingId: createCollectionDto.bookingId ?? null,
          saleContractId: createCollectionDto.saleContractId ?? null,
          installmentScheduleId:
            createCollectionDto.installmentScheduleId ?? null,
          collectionDate: parseCalendarDate(
            createCollectionDto.collectionDate,
            'collectionDate',
          ),
          amount: parseDecimalAmount(createCollectionDto.amount, 'amount'),
          reference: normalizeOptionalString(createCollectionDto.reference) ?? null,
          notes: normalizeOptionalString(createCollectionDto.notes) ?? null,
        },
      });

      return this.getCollectionDetail(companyId, collection.id);
    } catch (error) {
      this.throwCollectionMutationError(error);
    }
  }

  private async getCollectionRecord(companyId: string, collectionId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: {
        id: collectionId,
        companyId,
      },
      include: {
        customer: true,
        voucher: true,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }

    return collection;
  }

  private mapCollection(collection: CollectionRecord): CollectionDto {
    return {
      id: collection.id,
      companyId: collection.companyId,
      customerId: collection.customerId,
      customerName: collection.customer.fullName,
      voucherId: collection.voucherId,
      voucherStatus: collection.voucher.status,
      voucherDate: collection.voucher.voucherDate.toISOString().slice(0, 10),
      voucherReference: collection.voucher.reference,
      bookingId: collection.bookingId,
      saleContractId: collection.saleContractId,
      installmentScheduleId: collection.installmentScheduleId,
      collectionDate: collection.collectionDate.toISOString().slice(0, 10),
      amount: collection.amount.toFixed(2),
      reference: collection.reference,
      notes: collection.notes,
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
    };
  }

  private throwCollectionMutationError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage) {
      throw new BadRequestException(databaseMessage);
    }

    if (isUniqueConstraintError(error)) {
      throw toConflictException(
        'The voucher is already linked to an existing collection.',
      );
    }

    throw error;
  }
}
