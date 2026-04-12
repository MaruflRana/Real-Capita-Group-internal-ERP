import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type BookingStatus } from '@prisma/client';

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
import type { BookingRecord } from './crm-property-desk-reference.service';
import { CrmPropertyDeskReferenceService } from './crm-property-desk-reference.service';
import type {
  BookingDto,
  BookingsListQueryDto,
  CreateBookingDto,
  UpdateBookingDto,
} from './dto/bookings.dto';
import {
  buildDateRangeFilter,
  normalizeOptionalString,
  parseCalendarDate,
  parseDecimalAmount,
} from './property-desk.utils';

const BOOKING_SORT_FIELDS = [
  'bookingAmount',
  'bookingDate',
  'createdAt',
  'status',
  'updatedAt',
] as const;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: CrmPropertyDeskReferenceService,
    private readonly auditService: AuditService,
  ) {}

  async listBookings(companyId: string, query: BookingsListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const bookingDateFilter = buildDateRangeFilter(
      query.dateFrom,
      query.dateTo,
      'date',
    );
    const where: Prisma.BookingWhereInput = {
      companyId,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.unitId ? { unitId: query.unitId } : {}),
      ...(query.status ? { status: query.status as BookingStatus } : {}),
      ...(bookingDateFilter ? { bookingDate: bookingDateFilter } : {}),
      ...(query.search
        ? {
            OR: [
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
                customer: {
                  email: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                customer: {
                  phone: {
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
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(query.sortBy, BOOKING_SORT_FIELDS, 'bookingDate');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.BookingOrderByWithRelationInput;
    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
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
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.booking.count({
        where,
      }),
    ]);

    return {
      items: bookings.map((booking) => this.mapBooking(booking)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getBookingDetail(companyId: string, bookingId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const booking = await this.referenceService.getBookingRecord(companyId, bookingId);

    return this.mapBooking(booking);
  }

  async createBooking(
    companyId: string,
    actorUserId: string,
    requestId: string | undefined,
    createBookingDto: CreateBookingDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const customer = await this.referenceService.getCustomerRecord(
      companyId,
      createBookingDto.customerId,
    );

    if (!customer.isActive) {
      throw new BadRequestException('Inactive customers cannot create bookings.');
    }

    const unit = await this.referenceService.getUnitRecord(
      companyId,
      createBookingDto.unitId,
    );

    if (!unit.project.isActive || !unit.isActive) {
      throw new BadRequestException(
        'Only active units in active projects can be booked.',
      );
    }

    if (unit.unitStatus.code !== 'AVAILABLE') {
      throw new BadRequestException('Only AVAILABLE units can be booked.');
    }

    try {
      const booking = await this.prisma.booking.create({
        data: {
          companyId,
          projectId: unit.projectId,
          customerId: createBookingDto.customerId,
          unitId: createBookingDto.unitId,
          bookingDate: parseCalendarDate(
            createBookingDto.bookingDate,
            'bookingDate',
          ),
          bookingAmount: parseDecimalAmount(
            createBookingDto.bookingAmount,
            'bookingAmount',
          ),
          notes: normalizeOptionalString(createBookingDto.notes) ?? null,
        },
      });

      await this.auditService.recordEvent({
        companyId,
        actorUserId,
        category: 'CRM_PROPERTY_DESK',
        eventType: AUDIT_EVENT_TYPES.bookingCreated,
        targetEntityType: 'BOOKING',
        targetEntityId: booking.id,
        requestId,
        metadata: {
          customerId: booking.customerId,
          projectId: booking.projectId,
          unitId: booking.unitId,
          bookingDate: booking.bookingDate.toISOString().slice(0, 10),
          bookingAmount: booking.bookingAmount.toFixed(2),
        },
      });

      return this.getBookingDetail(companyId, booking.id);
    } catch (error) {
      this.throwBookingMutationError(error);
    }
  }

  async updateBooking(
    companyId: string,
    bookingId: string,
    updateBookingDto: UpdateBookingDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const existingBooking = await this.referenceService.getBookingRecord(
      companyId,
      bookingId,
    );
    const normalizedNotes =
      updateBookingDto.notes === undefined
        ? existingBooking.notes
        : (normalizeOptionalString(updateBookingDto.notes) ?? null);

    if (normalizedNotes === existingBooking.notes) {
      return this.mapBooking(existingBooking);
    }

    try {
      await this.prisma.booking.update({
        where: {
          id: existingBooking.id,
        },
        data: {
          notes: normalizedNotes,
        },
      });
    } catch (error) {
      this.throwBookingMutationError(error);
    }

    return this.getBookingDetail(companyId, bookingId);
  }

  private mapBooking(booking: BookingRecord): BookingDto {
    return {
      id: booking.id,
      companyId: booking.companyId,
      projectId: booking.projectId,
      projectCode: booking.project.code,
      projectName: booking.project.name,
      customerId: booking.customerId,
      customerName: booking.customer.fullName,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      unitId: booking.unitId,
      unitCode: booking.unit.code,
      unitName: booking.unit.name,
      unitStatusId: booking.unit.unitStatusId,
      unitStatusCode: booking.unit.unitStatus.code,
      unitStatusName: booking.unit.unitStatus.name,
      bookingDate: booking.bookingDate.toISOString().slice(0, 10),
      bookingAmount: booking.bookingAmount.toFixed(2),
      status: booking.status,
      notes: booking.notes,
      saleContractId: booking.saleContract?.id ?? null,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    };
  }

  private throwBookingMutationError(error: unknown): never {
    const databaseMessage = extractDatabaseErrorMessage(error);

    if (databaseMessage) {
      throw new BadRequestException(databaseMessage);
    }

    if (isUniqueConstraintError(error)) {
      throw toConflictException('The unit already has an active booking.');
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Booking not found.');
    }

    throw error;
  }
}
