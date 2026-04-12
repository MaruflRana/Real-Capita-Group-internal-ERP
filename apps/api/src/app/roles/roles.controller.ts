import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { RequireAdminAccess } from '../auth/decorators/require-admin-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { RolesListQueryDto } from './dto/roles-list-query.dto';
import { RolesListResponseDto } from './dto/roles-list-response.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
@RequireAdminAccess()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({
    summary: 'List available role definitions.',
  })
  @ApiOkResponse({
    description: 'Role definitions were returned.',
    type: RolesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Admin access is required.',
    type: ApiErrorResponseDto,
  })
  listRoles(@Query() query: RolesListQueryDto) {
    return this.rolesService.listRoles(query);
  }
}
