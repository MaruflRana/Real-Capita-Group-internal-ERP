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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireCompanyAdminAccess } from '../auth/decorators/require-company-admin-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CreateProjectDto,
  ProjectDto,
  ProjectsListQueryDto,
  ProjectsListResponseDto,
  UpdateProjectDto,
} from './dto/projects.dto';
import { ProjectMastersService } from './projects.service';

@ApiTags('projects')
@Controller('companies/:companyId/projects')
@RequireCompanyAdminAccess()
export class ProjectsController {
  constructor(private readonly projectMastersService: ProjectMastersService) {}

  @Get()
  @ApiOperation({
    summary: 'List projects for a company.',
  })
  @ApiOkResponse({
    description: 'Projects were returned.',
    type: ProjectsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  listProjects(
    @Param('companyId') companyId: string,
    @Query() query: ProjectsListQueryDto,
  ) {
    return this.projectMastersService.listProjects(companyId, query);
  }

  @Get(':projectId')
  @ApiOperation({
    summary: 'Return project detail.',
  })
  @ApiOkResponse({
    description: 'Project detail was returned.',
    type: ProjectDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or project was not found.',
    type: ApiErrorResponseDto,
  })
  getProject(
    @Param('companyId') companyId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectMastersService.getProjectDetail(companyId, projectId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a project for a company.',
  })
  @ApiCreatedResponse({
    description: 'Project was created.',
    type: ProjectDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The project code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createProject(
    @Param('companyId') companyId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectMastersService.createProject(companyId, createProjectDto);
  }

  @Patch(':projectId')
  @ApiOperation({
    summary: 'Update a project.',
  })
  @ApiOkResponse({
    description: 'Project was updated.',
    type: ProjectDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The project code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, project, or location was not found.',
    type: ApiErrorResponseDto,
  })
  updateProject(
    @Param('companyId') companyId: string,
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectMastersService.updateProject(
      companyId,
      projectId,
      updateProjectDto,
    );
  }

  @Post(':projectId/activate')
  @ApiOperation({
    summary: 'Activate a project.',
  })
  @ApiOkResponse({
    description: 'Project was activated.',
    type: ProjectDto,
  })
  activateProject(
    @Param('companyId') companyId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectMastersService.setProjectActiveState(
      companyId,
      projectId,
      true,
    );
  }

  @Post(':projectId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a project.',
  })
  @ApiOkResponse({
    description: 'Project was deactivated.',
    type: ProjectDto,
  })
  deactivateProject(
    @Param('companyId') companyId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectMastersService.setProjectActiveState(
      companyId,
      projectId,
      false,
    );
  }
}
