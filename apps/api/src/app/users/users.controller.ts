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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireCompanyAdminAccess } from '../auth/decorators/require-company-admin-access.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { RequestId } from '../common/decorators/request-id.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { CompanyUserDto } from './dto/company-user.dto';
import { CompanyUsersListQueryDto } from './dto/company-users-list-query.dto';
import { CompanyUsersListResponseDto } from './dto/company-users-list-response.dto';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('companies/:companyId/users')
@RequireCompanyAdminAccess()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users visible within a company scope.',
  })
  @ApiOkResponse({
    description: 'Users were returned.',
    type: CompanyUsersListResponseDto,
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
    description: 'Company was not found.',
    type: ApiErrorResponseDto,
  })
  listUsers(
    @Param('companyId') companyId: string,
    @Query() query: CompanyUsersListQueryDto,
  ) {
    return this.usersService.listUsers(companyId, query);
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Return company-scoped user detail.',
  })
  @ApiOkResponse({
    description: 'User detail was returned.',
    type: CompanyUserDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or user was not found.',
    type: ApiErrorResponseDto,
  })
  getUser(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ) {
    return this.usersService.getUserDetail(companyId, userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a global user identity and attach initial company-scoped role assignments.',
  })
  @ApiCreatedResponse({
    description: 'User was created.',
    type: CompanyUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The user email already exists.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or requested role was not found.',
    type: ApiErrorResponseDto,
  })
  createUser(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() createCompanyUserDto: CreateCompanyUserDto,
  ) {
    return this.usersService.createUser(
      companyId,
      authenticatedUser.id,
      requestId,
      createCompanyUserDto,
    );
  }

  @Patch(':userId')
  @ApiOperation({
    summary: 'Update basic non-sensitive user profile fields.',
  })
  @ApiOkResponse({
    description: 'User profile fields were updated.',
    type: CompanyUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or user was not found.',
    type: ApiErrorResponseDto,
  })
  updateUser(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() updateCompanyUserDto: UpdateCompanyUserDto,
  ) {
    return this.usersService.updateUser(
      companyId,
      userId,
      authenticatedUser.id,
      requestId,
      updateCompanyUserDto,
    );
  }

  @Post(':userId/activate')
  @ApiOperation({
    summary:
      'Activate the user’s company-scoped access by re-enabling all role assignments in the company.',
  })
  @ApiOkResponse({
    description: 'User company access was activated.',
    type: CompanyUserDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or user was not found.',
    type: ApiErrorResponseDto,
  })
  activateUser(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.usersService.setUserCompanyAccessState(
      companyId,
      userId,
      authenticatedUser.id,
      requestId,
      true,
    );
  }

  @Post(':userId/deactivate')
  @ApiOperation({
    summary:
      'Deactivate the user’s company-scoped access by disabling all role assignments in the company.',
  })
  @ApiOkResponse({
    description: 'User company access was deactivated.',
    type: CompanyUserDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or user was not found.',
    type: ApiErrorResponseDto,
  })
  deactivateUser(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.usersService.setUserCompanyAccessState(
      companyId,
      userId,
      authenticatedUser.id,
      requestId,
      false,
    );
  }
}
