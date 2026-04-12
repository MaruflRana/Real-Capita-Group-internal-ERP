import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type LeadStatus } from '@prisma/client';

import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../common/utils/pagination.util';
import { resolveSortField } from '../common/utils/sort.util';
import { PrismaService } from '../database/prisma.service';
import { CrmPropertyDeskReferenceService } from './crm-property-desk-reference.service';
import type {
  CreateLeadDto,
  LeadDto,
  LeadsListQueryDto,
  UpdateLeadDto,
} from './dto/leads.dto';
import {
  normalizeEmail,
  normalizeOptionalString,
  normalizePhone,
  normalizeRequiredString,
} from './property-desk.utils';

const LEAD_SORT_FIELDS = [
  'createdAt',
  'fullName',
  'status',
  'updatedAt',
] as const;

type LeadRecord = Prisma.LeadGetPayload<{
  include: {
    project: true;
  };
}>;

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceService: CrmPropertyDeskReferenceService,
  ) {}

  async listLeads(companyId: string, query: LeadsListQueryDto) {
    await this.referenceService.assertCompanyExists(companyId);

    const where: Prisma.LeadWhereInput = {
      companyId,
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status as LeadStatus } : {}),
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
                source: {
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
    const sortField = resolveSortField(query.sortBy, LEAD_SORT_FIELDS, 'fullName');
    const orderBy = {
      [sortField]: query.sortOrder,
    } satisfies Prisma.LeadOrderByWithRelationInput;
    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          project: true,
        },
        orderBy,
        skip: getPaginationSkip(query),
        take: query.pageSize,
      }),
      this.prisma.lead.count({
        where,
      }),
    ]);

    return {
      items: leads.map((lead) => this.mapLead(lead)),
      meta: buildPaginationMeta(query, total),
    };
  }

  async getLeadDetail(companyId: string, leadId: string) {
    await this.referenceService.assertCompanyExists(companyId);

    const lead = await this.getLeadRecord(companyId, leadId);

    return this.mapLead(lead);
  }

  async createLead(companyId: string, createLeadDto: CreateLeadDto) {
    await this.referenceService.assertCompanyExists(companyId);

    if (createLeadDto.projectId) {
      await this.referenceService.assertProjectBelongsToCompany(
        companyId,
        createLeadDto.projectId,
      );
    }

    const lead: LeadRecord = await this.prisma.lead.create({
      data: {
        companyId,
        ...this.normalizeLeadInput({
          ...createLeadDto,
          status: createLeadDto.status ?? 'NEW',
        }),
      },
      include: {
        project: true,
      },
    });

    return this.mapLead(lead);
  }

  async updateLead(
    companyId: string,
    leadId: string,
    updateLeadDto: UpdateLeadDto,
  ) {
    await this.referenceService.assertCompanyExists(companyId);

    const existingLead = await this.getLeadRecord(companyId, leadId);
    const projectId =
      updateLeadDto.projectId === undefined
        ? existingLead.projectId
        : (updateLeadDto.projectId ?? null);

    if (projectId) {
      await this.referenceService.assertProjectBelongsToCompany(companyId, projectId);
    }

    const lead: LeadRecord = await this.prisma.lead.update({
      where: {
        id: existingLead.id,
      },
      data: this.normalizeLeadInput({
        projectId,
        fullName: updateLeadDto.fullName ?? existingLead.fullName,
        email:
          updateLeadDto.email === undefined
            ? existingLead.email
            : updateLeadDto.email,
        phone:
          updateLeadDto.phone === undefined
            ? existingLead.phone
            : updateLeadDto.phone,
        source:
          updateLeadDto.source === undefined
            ? existingLead.source
            : updateLeadDto.source,
        status: updateLeadDto.status ?? existingLead.status,
        notes:
          updateLeadDto.notes === undefined
            ? existingLead.notes
            : updateLeadDto.notes,
      }),
      include: {
        project: true,
      },
    });

    return this.mapLead(lead);
  }

  async setLeadActiveState(companyId: string, leadId: string, isActive: boolean) {
    await this.referenceService.assertCompanyExists(companyId);
    await this.getLeadRecord(companyId, leadId);

    const lead: LeadRecord = await this.prisma.lead.update({
      where: {
        id: leadId,
      },
      data: {
        isActive,
      },
      include: {
        project: true,
      },
    });

    return this.mapLead(lead);
  }

  private async getLeadRecord(companyId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        companyId,
      },
      include: {
        project: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found.');
    }

    return lead;
  }

  private normalizeLeadInput(input: {
    projectId?: string | null;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    source?: string | null;
    status?: string;
    notes?: string | null;
  }) {
    return {
      projectId: input.projectId ?? null,
      fullName: normalizeRequiredString(input.fullName),
      email: normalizeEmail(input.email) ?? null,
      phone: normalizePhone(input.phone) ?? null,
      source: normalizeOptionalString(input.source) ?? null,
      status: (input.status ?? 'NEW') as LeadStatus,
      notes: normalizeOptionalString(input.notes) ?? null,
    };
  }

  private mapLead(lead: LeadRecord): LeadDto {
    return {
      id: lead.id,
      companyId: lead.companyId,
      projectId: lead.projectId,
      projectCode: lead.project?.code ?? null,
      projectName: lead.project?.name ?? null,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status: lead.status,
      notes: lead.notes,
      isActive: lead.isActive,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }
}
