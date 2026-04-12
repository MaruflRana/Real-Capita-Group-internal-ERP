import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireCompanyAdminAccess } from '../auth/decorators/require-company-admin-access.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { RequestId } from '../common/decorators/request-id.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { RoleAssignmentDto } from './dto/role-assignment.dto';
import { RoleAssignmentsListQueryDto } from './dto/role-assignments-list-query.dto';
import { RoleAssignmentsListResponseDto } from './dto/role-assignments-list-response.dto';
import { RoleAssignmentsService } from './role-assignments.service';

@ApiTags('role-assignments')
@Controller('companies/:companyId/users/:userId/roles')
@RequireCompanyAdminAccess()
export class RoleAssignmentsController {
  constructor(
    private readonly roleAssignmentsService: RoleAssignmentsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List company-scoped role assignments for a user.',
  })
  @ApiOkResponse({
    description: 'Role assignments were returned.',
    type: RoleAssignmentsListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or user was not found.',
    type: ApiErrorResponseDto,
  })
  listRoleAssignments(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Query() query: RoleAssignmentsListQueryDto,
  ) {
    return this.roleAssignmentsService.listUserRoleAssignments(
      companyId,
      userId,
      query,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Assign or reactivate a company-scoped role for a user.',
  })
  @ApiOkResponse({
    description: 'Role assignment was created or reactivated.',
    type: RoleAssignmentDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the target user identity is inactive.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, user, or role was not found.',
    type: ApiErrorResponseDto,
  })
  assignRole(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.roleAssignmentsService.assignRole(
      companyId,
      userId,
      authenticatedUser.id,
      requestId,
      assignRoleDto,
    );
  }

  @Delete(':roleCode')
  @ApiOperation({
    summary: 'Deactivate a company-scoped role assignment for a user.',
  })
  @ApiOkResponse({
    description: 'Role assignment was deactivated.',
    type: RoleAssignmentDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, role, or role assignment was not found.',
    type: ApiErrorResponseDto,
  })
  removeRole(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Param('roleCode') roleCode: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.roleAssignmentsService.removeRole(
      companyId,
      userId,
      roleCode,
      authenticatedUser.id,
      requestId,
    );
  }
}
