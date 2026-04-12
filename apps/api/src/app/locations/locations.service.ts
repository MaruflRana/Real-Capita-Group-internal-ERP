import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AUDIT_EVENT_TYPES } from '../audit/constants/audit.constants';
import { AuditService } from '../audit/audit.service';
import { buildPaginationMeta, getPaginationSkip } from '../common/utils/pagination.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import type { CreateLocationDto } from './dto/create-location.dto';
import type { LocationsListQueryDto } from './dto/locations-list-query.dto';
import type { UpdateLocationDto } from './dto/update-location.dto';

const LOCATION_SORT_FIELDS = ['code', 'createdAt', 'name', 'updatedAt'] as const;

type LocationRecord = Prisma.LocationGetPayload<object>;

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listLocations(companyId: string, query: LocationsListQueryDto) {
    await this.assertCompanyExists(companyId);

    const where: Prisma.LocationWhereInput = {
      companyId,
      ...(query.isActive === undefined
        ? {}
        : {
            isActive: query.isActive,
          }),
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
            ],
          }
        : {}),
    };
    const sortField = resolveSortField(
      query.sortBy,
      LOCATION_SORT_FIELDS,
      'name',
    );
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.LocationOrderByWithRelationInput;
    const [locations, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.location.count({
        where,
      }),
    ]);

    return {
      items: locations.map((location) => this.mapLocation(location)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getLocationDetail(companyId: string, locationId: string) {
    await this.assertCompanyExists(companyId);

    const location = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        companyId,
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found.');
    }

    return this.mapLocation(location);
  }

  async createLocation(
    companyId: string,
    actorUserId: string,
    requestId: string | undefined,
    createLocationDto: CreateLocationDto,
  ) {
    await this.assertCompanyExists(companyId);

    const normalizedInput = this.normalizeInput({
      code: createLocationDto.code,
      name: createLocationDto.name,
      description: createLocationDto.description,
    });

    await this.assertLocationUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
    );

    const location = await this.prisma.location.create({
      data: {
        companyId,
        ...normalizedInput,
      },
    });

    await this.auditService.recordEvent({
      companyId,
      actorUserId,
      category: 'ADMIN',
      eventType: AUDIT_EVENT_TYPES.locationCreated,
      targetEntityType: 'LOCATION',
      targetEntityId: location.id,
      requestId,
      metadata: {
        code: location.code,
        name: location.name,
      },
    });

    return this.mapLocation(location);
  }

  async updateLocation(
    companyId: string,
    locationId: string,
    actorUserId: string,
    requestId: string | undefined,
    updateLocationDto: UpdateLocationDto,
  ) {
    await this.assertCompanyExists(companyId);

    const existingLocation = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        companyId,
      },
    });

    if (!existingLocation) {
      throw new NotFoundException('Location not found.');
    }

    const normalizedInput = this.normalizeInput({
      code: updateLocationDto.code ?? existingLocation.code,
      name: updateLocationDto.name ?? existingLocation.name,
      description:
        updateLocationDto.description === undefined
          ? existingLocation.description ?? undefined
          : updateLocationDto.description,
    });

    await this.assertLocationUniqueness(
      companyId,
      normalizedInput.code,
      normalizedInput.name,
      existingLocation.id,
    );

    const location = await this.prisma.location.update({
      where: {
        id: existingLocation.id,
      },
      data: normalizedInput,
    });

    await this.auditService.recordEvent({
      companyId,
      actorUserId,
      category: 'ADMIN',
      eventType: AUDIT_EVENT_TYPES.locationUpdated,
      targetEntityType: 'LOCATION',
      targetEntityId: location.id,
      requestId,
      metadata: {
        code: location.code,
        name: location.name,
      },
    });

    return this.mapLocation(location);
  }

  async setLocationActiveState(
    companyId: string,
    locationId: string,
    actorUserId: string,
    requestId: string | undefined,
    isActive: boolean,
  ) {
    await this.assertCompanyExists(companyId);

    const location = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        companyId,
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found.');
    }

    const updatedLocation = await this.prisma.location.update({
      where: {
        id: location.id,
      },
      data: {
        isActive,
      },
    });

    await this.auditService.recordEvent({
      companyId,
      actorUserId,
      category: 'ADMIN',
      eventType: isActive
        ? AUDIT_EVENT_TYPES.locationActivated
        : AUDIT_EVENT_TYPES.locationDeactivated,
      targetEntityType: 'LOCATION',
      targetEntityId: updatedLocation.id,
      requestId,
    });

    return this.mapLocation(updatedLocation);
  }

  private async assertCompanyExists(companyId: string): Promise<void> {
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

  private normalizeInput(input: {
    code: string;
    name: string;
    description: string | undefined | null;
  }) {
    return {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
    };
  }

  private async assertLocationUniqueness(
    companyId: string,
    code: string,
    name: string,
    ignoredLocationId?: string,
  ): Promise<void> {
    const existingLocationWithCode = await this.prisma.location.findFirst({
      where: {
        companyId,
        code: {
          equals: code,
          mode: 'insensitive',
        },
        ...(ignoredLocationId
          ? {
              id: {
                not: ignoredLocationId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingLocationWithCode) {
      throw new ConflictException(
        'A location with this code already exists in the company.',
      );
    }

    const existingLocationWithName = await this.prisma.location.findFirst({
      where: {
        companyId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        ...(ignoredLocationId
          ? {
              id: {
                not: ignoredLocationId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingLocationWithName) {
      throw new ConflictException(
        'A location with this name already exists in the company.',
      );
    }
  }

  private mapLocation(location: LocationRecord) {
    return {
      id: location.id,
      companyId: location.companyId,
      code: location.code,
      name: location.name,
      description: location.description,
      isActive: location.isActive,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    };
  }
}
