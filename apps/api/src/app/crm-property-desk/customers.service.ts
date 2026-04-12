import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
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
  CustomersListQueryDto,
  UpdateCustomerDto,
} from './dto/customers.dto';
import {
  normalizeEmail,
  normalizeOptionalString,
  normalizePhone,
  normalizeRequiredString,
} from './property-desk.utils';

const CUSTOMER_SORT_FIELDS = [
  'createdAt',
  'fullName',
  'updatedAt',
] as const;

type CustomerRecord = Prisma.CustomerGetPayload<object>;

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
    const sortField = resolveSortField(query.sortBy, CUSTOMER_SORT_FIELDS, 'fullName');
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

  async createCustomer(companyId: string, createCustomerDto: CreateCustomerDto) {
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
