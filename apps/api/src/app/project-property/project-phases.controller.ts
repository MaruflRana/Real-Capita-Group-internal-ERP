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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanyAdminAccess } from '../auth/decorators/require-company-admin-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CreateProjectPhaseDto,
  ProjectPhaseDto,
  ProjectPhasesListQueryDto,
  ProjectPhasesListResponseDto,
  UpdateProjectPhaseDto,
} from './dto/project-phases.dto';
import { ProjectHierarchyService } from './project-hierarchy.service';

@ApiTags('project-phases')
@Controller('companies/:companyId/project-phases')
@RequireCompanyAdminAccess()
export class ProjectPhasesController {
  constructor(private readonly projectHierarchyService: ProjectHierarchyService) {}

  @Get()
  @ApiOperation({
    summary: 'List project phases for a company.',
  })
  @ApiOkResponse({
    description: 'Project phases were returned.',
    type: ProjectPhasesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  listProjectPhases(
    @Param('companyId') companyId: string,
    @Query() query: ProjectPhasesListQueryDto,
  ) {
    return this.projectHierarchyService.listProjectPhases(companyId, query);
  }

  @Get(':projectPhaseId')
  @ApiOperation({
    summary: 'Return project phase detail.',
  })
  @ApiOkResponse({
    description: 'Project phase detail was returned.',
    type: ProjectPhaseDto,
  })
  getProjectPhase(
    @Param('companyId') companyId: string,
    @Param('projectPhaseId') projectPhaseId: string,
  ) {
    return this.projectHierarchyService.getProjectPhaseDetail(
      companyId,
      projectPhaseId,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a project phase.',
  })
  @ApiCreatedResponse({
    description: 'Project phase was created.',
    type: ProjectPhaseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the parent project is inactive.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The project phase code or name already exists in the project.',
    type: ApiErrorResponseDto,
  })
  createProjectPhase(
    @Param('companyId') companyId: string,
    @Body() createProjectPhaseDto: CreateProjectPhaseDto,
  ) {
    return this.projectHierarchyService.createProjectPhase(
      companyId,
      createProjectPhaseDto,
    );
  }

  @Patch(':projectPhaseId')
  @ApiOperation({
    summary: 'Update a project phase.',
  })
  @ApiOkResponse({
    description: 'Project phase was updated.',
    type: ProjectPhaseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The project phase code or name already exists in the project.',
    type: ApiErrorResponseDto,
  })
  updateProjectPhase(
    @Param('companyId') companyId: string,
    @Param('projectPhaseId') projectPhaseId: string,
    @Body() updateProjectPhaseDto: UpdateProjectPhaseDto,
  ) {
    return this.projectHierarchyService.updateProjectPhase(
      companyId,
      projectPhaseId,
      updateProjectPhaseDto,
    );
  }

  @Post(':projectPhaseId/activate')
  @ApiOperation({
    summary: 'Activate a project phase.',
  })
  @ApiOkResponse({
    description: 'Project phase was activated.',
    type: ProjectPhaseDto,
  })
  activateProjectPhase(
    @Param('companyId') companyId: string,
    @Param('projectPhaseId') projectPhaseId: string,
  ) {
    return this.projectHierarchyService.setProjectPhaseActiveState(
      companyId,
      projectPhaseId,
      true,
    );
  }

  @Post(':projectPhaseId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a project phase.',
  })
  @ApiOkResponse({
    description: 'Project phase was deactivated.',
    type: ProjectPhaseDto,
  })
  deactivateProjectPhase(
    @Param('companyId') companyId: string,
    @Param('projectPhaseId') projectPhaseId: string,
  ) {
    return this.projectHierarchyService.setProjectPhaseActiveState(
      companyId,
      projectPhaseId,
      false,
    );
  }
}
