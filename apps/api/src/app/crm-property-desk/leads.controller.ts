import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanySalesAccess } from '../auth/decorators/require-company-sales-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CreateLeadDto,
  LeadDto,
  LeadsListQueryDto,
  LeadsListResponseDto,
  UpdateLeadDto,
} from './dto/leads.dto';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@Controller('companies/:companyId/leads')
@RequireCompanySalesAccess()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({
    summary: 'List leads for a company.',
  })
  @ApiOkResponse({
    description: 'Leads were returned.',
    type: LeadsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company sales or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listLeads(
    @Param('companyId') companyId: string,
    @Query() query: LeadsListQueryDto,
  ) {
    return this.leadsService.listLeads(companyId, query);
  }

  @Get(':leadId')
  @ApiOperation({
    summary: 'Return lead detail.',
  })
  @ApiOkResponse({
    description: 'Lead detail was returned.',
    type: LeadDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or lead was not found.',
    type: ApiErrorResponseDto,
  })
  getLead(
    @Param('companyId') companyId: string,
    @Param('leadId') leadId: string,
  ) {
    return this.leadsService.getLeadDetail(companyId, leadId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a lead for a company.',
  })
  @ApiCreatedResponse({
    description: 'Lead was created.',
    type: LeadDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  createLead(
    @Param('companyId') companyId: string,
    @Body() createLeadDto: CreateLeadDto,
  ) {
    return this.leadsService.createLead(companyId, createLeadDto);
  }

  @Patch(':leadId')
  @ApiOperation({
    summary: 'Update a lead.',
  })
  @ApiOkResponse({
    description: 'Lead was updated.',
    type: LeadDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, lead, or project was not found.',
    type: ApiErrorResponseDto,
  })
  updateLead(
    @Param('companyId') companyId: string,
    @Param('leadId') leadId: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.updateLead(companyId, leadId, updateLeadDto);
  }

  @Post(':leadId/activate')
  @ApiOperation({
    summary: 'Activate a lead.',
  })
  @ApiOkResponse({
    description: 'Lead was activated.',
    type: LeadDto,
  })
  activateLead(
    @Param('companyId') companyId: string,
    @Param('leadId') leadId: string,
  ) {
    return this.leadsService.setLeadActiveState(companyId, leadId, true);
  }

  @Post(':leadId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a lead.',
  })
  @ApiOkResponse({
    description: 'Lead was deactivated.',
    type: LeadDto,
  })
  deactivateLead(
    @Param('companyId') companyId: string,
    @Param('leadId') leadId: string,
  ) {
    return this.leadsService.setLeadActiveState(companyId, leadId, false);
  }
}
