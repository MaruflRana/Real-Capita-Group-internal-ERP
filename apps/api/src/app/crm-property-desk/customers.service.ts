import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import {
  isUniqueConstraintError,
  toConflictException,
} from '../common/utils/prisma-error.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import { CrmPropertyDeskReferenceService } from './crm-property-desk-reference.service';
import type {
  CreateCustomerDto,
  CustomerDto,
  CustomerProfileDto,
  CustomersListQueryDto,
  UpdateCustomerDto,
} from './dto/customers.dto';
import {
  normalizeEmail,
  normalizeOptionalString,
  normalizePhone,
  normalizeRequiredString,
} from './property-desk.utils';

const CUSTOMER_SORT_FIELDS = ['createdAt', 'fullName', 'updatedAt'] as const;

type CustomerRecord = Prisma.CustomerGetPayload<object>;

const CUSTOMER_PROFILE_BOOKING_INCLUDE = {
  project: true,
  unit: true,
  saleContract: true,
} satisfies Prisma.BookingInclude;

const CUSTOMER_PROFILE_SALE_CONTRACT_INCLUDE = {
  booking: {
    include: {
      project: true,
      unit: true,
    },
  },
} satisfies Prisma.SaleContractInclude;

const CUSTOMER_PROFILE_INSTALLMENT_INCLUDE = {
  saleContract: {
    include: {
      booking: {
        include: {
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
} satisfies Prisma.InstallmentScheduleInclude;

const CUSTOMER_PROFILE_COLLECTION_INCLUDE = {
  voucher: true,
  booking: {
    include: {
      project: true,
      unit: true,
    },
  },
  saleContract: {
    include: {
      booking: {
        include: {
          project: true,
          unit: true,
        },
      },
    },
  },
  installmentSchedule: {
    include: {
      saleContract: {
        include: {
          booking: {
            include: {
              project: true,
              unit: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CollectionInclude;

type CustomerProfileBookingRecord = Prisma.BookingGetPayload<{
  include: typeof CUSTOMER_PROFILE_BOOKING_INCLUDE;
}>;

type CustomerProfileSaleContractRecord = Prisma.SaleContractGetPayload<{
  include: typeof CUSTOMER_PROFILE_SALE_CONTRACT_INCLUDE;
}>;

type CustomerProfileInstallmentRecord = Prisma.InstallmentScheduleGetPayload<{
  include: typeof CUSTOMER_PROFILE_INSTALLMENT_INCLUDE;
}>;

type CustomerProfileCollectionRecord = Prisma.CollectionGetPayload<{
  include: typeof CUSTOMER_PROFILE_COLLECTION_INCLUDE;
}>;

type CustomerProfileTimelineEvent = CustomerProfileDto['timeline'][number];

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: CrmPropertyDeskReferenceService,
  ) {}

  async listCustomers(companyId: string, query: CustomersListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

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
              {
                address: {
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
    const sortField = resolveSortField(
      query.sortBy,
      CUSTOMER_SORT_FIELDS,
      'fullName',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.CustomerOrderByWithRelationInput;
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.customer.count({
        where,
      }),
    ]);

    return {
      items: customers.map((customer) => this.mapCustomer(customer)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getCustomerDetail(companyId: string, customerId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const customer = await this.referenceService.getCustomerRecord(
      companyId,
      customerId,
    );

    return this.mapCustomer(customer);
  }

  async getCustomerProfile(
    companyId: string,
    customerId: string,
  ): Promise<CustomerProfileDto> {
    await this.referenceService.assertCompanyExists(companyId);

    const customer = await this.referenceService.getCustomerRecord(
      companyId,
      customerId,
    );

    const [bookings, saleContracts, installmentSchedules, collections] =
      await Promise.all([
        this.prisma.booking.findMany({
          where: {
            companyId,
            customerId,
          },
          include: CUSTOMER_PROFILE_BOOKING_INCLUDE,
          orderBy: [
            {
              bookingDate: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
        }),
        this.prisma.saleContract.findMany({
          where: {
            companyId,
            booking: {
              customerId,
            },
          },
          include: CUSTOMER_PROFILE_SALE_CONTRACT_INCLUDE,
          orderBy: [
            {
              contractDate: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
        }),
        this.prisma.installmentSchedule.findMany({
          where: {
            companyId,
            saleContract: {
              booking: {
                customerId,
              },
            },
          },
          include: CUSTOMER_PROFILE_INSTALLMENT_INCLUDE,
          orderBy: [
            {
              dueDate: 'asc',
            },
            {
              sequenceNumber: 'asc',
            },
          ],
        }),
        this.prisma.collection.findMany({
          where: {
            companyId,
            customerId,
          },
          include: CUSTOMER_PROFILE_COLLECTION_INCLUDE,
          orderBy: [
            {
              collectionDate: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
        }),
      ]);

    const totalContractAmount = this.sumDecimal(
      saleContracts,
      (saleContract) => saleContract.contractAmount,
    );
    const totalScheduledInstallmentAmount = this.sumDecimal(
      installmentSchedules,
      (schedule) => schedule.amount,
    );
    const totalCollectedAmount = this.sumDecimal(
      collections,
      (collection) => collection.amount,
    );
    const postedVoucherBackedCollectionAmount = this.sumDecimal(
      collections.filter(
        (collection) => collection.voucher.status === 'POSTED',
      ),
      (collection) => collection.amount,
    );

    return {
      customer: this.mapCustomerProfileCustomer(customer),
      summary: {
        totalBookings: bookings.length,
        activeBookingCount: bookings.filter(
          (booking) => booking.status === 'ACTIVE',
        ).length,
        saleContractCount: saleContracts.length,
        totalContractAmount: totalContractAmount.toFixed(2),
        installmentScheduleCount: installmentSchedules.length,
        totalScheduledInstallmentAmount:
          totalScheduledInstallmentAmount.toFixed(2),
        totalCollectionsCount: collections.length,
        totalCollectedAmount: totalCollectedAmount.toFixed(2),
        latestCollectionDate:
          collections[0]?.collectionDate.toISOString().slice(0, 10) ?? null,
        postedVoucherBackedCollectionAmount:
          postedVoucherBackedCollectionAmount.toFixed(2),
      },
      bookings: bookings.map((booking) => this.mapProfileBooking(booking)),
      saleContracts: saleContracts.map((saleContract) =>
        this.mapProfileSaleContract(saleContract),
      ),
      installmentSchedules: installmentSchedules.map((schedule) =>
        this.mapProfileInstallmentSchedule(schedule),
      ),
      transactionHistory: collections.map((collection) =>
        this.mapProfileTransaction(collection),
      ),
      timeline: this.buildCustomerProfileTimeline(
        customer,
        bookings,
        saleContracts,
        installmentSchedules,
        collections,
      ),
      assumptions: [
        'Installment collected and balance fields use only collections directly linked to the exact installment schedule.',
        'Customer-level outstanding, remaining, and overdue totals are intentionally deferred until payment allocation rules support those claims.',
      ],
    };
  }

  async createCustomer(
    companyId: string,
    createCustomerDto: CreateCustomerDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const normalizedInput = this.normalizeCustomerInput(createCustomerDto);
    await this.assertContactUniqueness(
      companyId,
      normalizedInput.email,
      normalizedInput.phone,
    );

    try {
      const customer = await this.prisma.customer.create({
        data: {
          companyId,
          ...normalizedInput,
        },
      });

      return this.mapCustomer(customer);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'The customer contact details already exist in the company.',
        );
      }

      throw error;
    }
  }

  async updateCustomer(
    companyId: string,
    customerId: string,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const existingCustomer = await this.referenceService.getCustomerRecord(
      companyId,
      customerId,
    );
    const normalizedInput = this.normalizeCustomerInput({
      fullName: updateCustomerDto.fullName ?? existingCustomer.fullName,
      email:
        updateCustomerDto.email === undefined
          ? existingCustomer.email
          : updateCustomerDto.email,
      phone:
        updateCustomerDto.phone === undefined
          ? existingCustomer.phone
          : updateCustomerDto.phone,
      address:
        updateCustomerDto.address === undefined
          ? existingCustomer.address
          : updateCustomerDto.address,
      notes:
        updateCustomerDto.notes === undefined
          ? existingCustomer.notes
          : updateCustomerDto.notes,
    });

    await this.assertContactUniqueness(
      companyId,
      normalizedInput.email,
      normalizedInput.phone,
      existingCustomer.id,
    );

    try {
      const customer = await this.prisma.customer.update({
        where: {
          id: existingCustomer.id,
        },
        data: normalizedInput,
      });

      return this.mapCustomer(customer);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw toConflictException(
          'The customer contact details already exist in the company.',
        );
      }

      throw error;
    }
  }

  async setCustomerActiveState(
    companyId: string,
    customerId: string,
    isActive: boolean,
  ) {
    await this.referenceService.assertCompanyExists(companyId);
    await this.referenceService.getCustomerRecord(companyId, customerId);

    const customer = await this.prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        isActive,
      },
    });

    return this.mapCustomer(customer);
  }

  private async assertContactUniqueness(
    companyId: string,
    email: string | null,
    phone: string | null,
    ignoredCustomerId?: string,
  ) {
    const filters: Prisma.CustomerWhereInput[] = [];

    if (email) {
      filters.push({
        companyId,
        email,
        ...(ignoredCustomerId ? { id: { not: ignoredCustomerId } } : {}),
      });
    }

    if (phone) {
      filters.push({
        companyId,
        phone,
        ...(ignoredCustomerId ? { id: { not: ignoredCustomerId } } : {}),
      });
    }

    if (filters.length === 0) {
      return;
    }

    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        OR: filters,
      },
      select: {
        id: true,
        email: true,
        phone: true,
      },
    });

    if (!existingCustomer) {
      return;
    }

    if (email && existingCustomer.email === email) {
      throw toConflictException(
        'A customer with this email already exists in the company.',
      );
    }

    if (phone && existingCustomer.phone === phone) {
      throw toConflictException(
        'A customer with this phone already exists in the company.',
      );
    }

    throw new BadRequestException(
      'The customer contact details conflict with an existing customer.',
    );
  }

  private normalizeCustomerInput(input: {
    fullName: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
  }) {
    return {
      fullName: normalizeRequiredString(input.fullName),
      email: normalizeEmail(input.email) ?? null,
      phone: normalizePhone(input.phone) ?? null,
      address: normalizeOptionalString(input.address) ?? null,
      notes: normalizeOptionalString(input.notes) ?? null,
    };
  }

  private sumDecimal<T>(items: T[], getAmount: (item: T) => Prisma.Decimal) {
    return items.reduce(
      (total, item) => total.plus(getAmount(item)),
      new Prisma.Decimal(0),
    );
  }

  private mapCustomerProfileCustomer(
    customer: CustomerRecord,
  ): CustomerProfileDto['customer'] {
    return {
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }

  private mapProfileBooking(
    booking: CustomerProfileBookingRecord,
  ): CustomerProfileDto['bookings'][number] {
    return {
      id: booking.id,
      bookingDate: booking.bookingDate.toISOString().slice(0, 10),
      bookingAmount: booking.bookingAmount.toFixed(2),
      status: booking.status,
      projectId: booking.projectId,
      projectCode: booking.project.code,
      projectName: booking.project.name,
      unitId: booking.unitId,
      unitCode: booking.unit.code,
      unitName: booking.unit.name,
      saleContractId: booking.saleContract?.id ?? null,
      saleContractReference: booking.saleContract?.reference ?? null,
    };
  }

  private mapProfileSaleContract(
    saleContract: CustomerProfileSaleContractRecord,
  ): CustomerProfileDto['saleContracts'][number] {
    return {
      id: saleContract.id,
      reference: saleContract.reference,
      contractDate: saleContract.contractDate.toISOString().slice(0, 10),
      contractAmount: saleContract.contractAmount.toFixed(2),
      bookingId: saleContract.bookingId,
      bookingDate: saleContract.booking.bookingDate.toISOString().slice(0, 10),
      projectId: saleContract.booking.projectId,
      projectCode: saleContract.booking.project.code,
      projectName: saleContract.booking.project.name,
      unitId: saleContract.booking.unitId,
      unitCode: saleContract.booking.unit.code,
      unitName: saleContract.booking.unit.name,
    };
  }

  private mapProfileInstallmentSchedule(
    schedule: CustomerProfileInstallmentRecord,
  ): CustomerProfileDto['installmentSchedules'][number] {
    const directCollectedAmount =
      schedule.collections.length > 0
        ? this.sumDecimal(
            schedule.collections,
            (collection) => collection.amount,
          )
        : null;

    return {
      id: schedule.id,
      saleContractId: schedule.saleContractId,
      saleContractReference: schedule.saleContract.reference,
      sequenceNumber: schedule.sequenceNumber,
      dueDate: schedule.dueDate.toISOString().slice(0, 10),
      amount: schedule.amount.toFixed(2),
      collectedAmount: directCollectedAmount?.toFixed(2) ?? null,
      balanceAmount: directCollectedAmount
        ? schedule.amount.minus(directCollectedAmount).toFixed(2)
        : null,
      bookingId: schedule.saleContract.bookingId,
      projectId: schedule.saleContract.booking.projectId,
      projectCode: schedule.saleContract.booking.project.code,
      projectName: schedule.saleContract.booking.project.name,
      unitId: schedule.saleContract.booking.unitId,
      unitCode: schedule.saleContract.booking.unit.code,
      unitName: schedule.saleContract.booking.unit.name,
    };
  }

  private mapProfileTransaction(
    collection: CustomerProfileCollectionRecord,
  ): CustomerProfileDto['transactionHistory'][number] {
    const linkedBooking =
      collection.booking ??
      collection.saleContract?.booking ??
      collection.installmentSchedule?.saleContract.booking ??
      null;
    const linkedSaleContract =
      collection.saleContract ??
      collection.installmentSchedule?.saleContract ??
      null;
    const linkedInstallmentSchedule = collection.installmentSchedule ?? null;

    return {
      id: collection.id,
      reference: collection.reference,
      collectionDate: collection.collectionDate.toISOString().slice(0, 10),
      amount: collection.amount.toFixed(2),
      notes: collection.notes,
      voucherId: collection.voucherId,
      voucherReference: collection.voucher.reference,
      voucherType: collection.voucher.voucherType,
      voucherDate: collection.voucher.voucherDate.toISOString().slice(0, 10),
      voucherStatus: collection.voucher.status,
      bookingId: linkedBooking?.id ?? null,
      bookingDate:
        linkedBooking?.bookingDate.toISOString().slice(0, 10) ?? null,
      bookingProjectName: linkedBooking?.project.name ?? null,
      bookingUnitCode: linkedBooking?.unit.code ?? null,
      bookingUnitName: linkedBooking?.unit.name ?? null,
      saleContractId: linkedSaleContract?.id ?? null,
      saleContractReference: linkedSaleContract?.reference ?? null,
      saleContractDate:
        linkedSaleContract?.contractDate.toISOString().slice(0, 10) ?? null,
      installmentScheduleId: linkedInstallmentSchedule?.id ?? null,
      installmentSequenceNumber:
        linkedInstallmentSchedule?.sequenceNumber ?? null,
      installmentDueDate:
        linkedInstallmentSchedule?.dueDate.toISOString().slice(0, 10) ?? null,
    };
  }

  private buildCustomerProfileTimeline(
    customer: CustomerRecord,
    bookings: CustomerProfileBookingRecord[],
    saleContracts: CustomerProfileSaleContractRecord[],
    installmentSchedules: CustomerProfileInstallmentRecord[],
    collections: CustomerProfileCollectionRecord[],
  ): CustomerProfileTimelineEvent[] {
    const events: CustomerProfileTimelineEvent[] = [
      {
        id: `customer-created-${customer.id}`,
        type: 'CUSTOMER_CREATED',
        eventDate: customer.createdAt.toISOString(),
        title: 'Customer created',
        description: 'Customer record opened in CRM & Property Desk.',
        recordId: customer.id,
        recordReference: null,
      },
      ...bookings.map((booking) => ({
        id: `booking-recorded-${booking.id}`,
        type: 'BOOKING_RECORDED',
        eventDate: booking.bookingDate.toISOString().slice(0, 10),
        title: 'Booking recorded',
        description: `${booking.project.name} / ${booking.unit.code} booking for ${booking.bookingAmount.toFixed(2)}.`,
        recordId: booking.id,
        recordReference: booking.unit.code,
      })),
      ...saleContracts.map((saleContract) => ({
        id: `sale-contract-recorded-${saleContract.id}`,
        type: 'SALE_CONTRACT_RECORDED',
        eventDate: saleContract.contractDate.toISOString().slice(0, 10),
        title: 'Sale contract recorded',
        description: `${saleContract.reference ?? 'Sale contract'} for ${saleContract.booking.project.name} / ${saleContract.booking.unit.code}.`,
        recordId: saleContract.id,
        recordReference: saleContract.reference,
      })),
      ...installmentSchedules.map((schedule) => ({
        id: `installment-scheduled-${schedule.id}`,
        type: 'INSTALLMENT_SCHEDULED',
        eventDate: schedule.dueDate.toISOString().slice(0, 10),
        title: 'Installment scheduled',
        description: `Installment #${schedule.sequenceNumber} scheduled for ${schedule.amount.toFixed(2)}.`,
        recordId: schedule.id,
        recordReference: `#${schedule.sequenceNumber}`,
      })),
      ...collections.map((collection) => ({
        id: `collection-recorded-${collection.id}`,
        type: 'COLLECTION_RECORDED',
        eventDate: collection.collectionDate.toISOString().slice(0, 10),
        title: 'Collection recorded',
        description: `${collection.reference ?? collection.voucher.reference ?? 'Collection'} received for ${collection.amount.toFixed(2)}.`,
        recordId: collection.id,
        recordReference: collection.reference ?? collection.voucher.reference,
      })),
    ];

    const eventRank = new Map([
      ['CUSTOMER_CREATED', 0],
      ['BOOKING_RECORDED', 1],
      ['SALE_CONTRACT_RECORDED', 2],
      ['INSTALLMENT_SCHEDULED', 3],
      ['COLLECTION_RECORDED', 4],
    ]);

    return events.sort((left, right) => {
      const dateComparison =
        new Date(left.eventDate).getTime() -
        new Date(right.eventDate).getTime();

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return (
        (eventRank.get(left.type) ?? 99) - (eventRank.get(right.type) ?? 99)
      );
    });
  }

  private mapCustomer(customer: CustomerRecord): CustomerDto {
    return {
      id: customer.id,
      companyId: customer.companyId,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
