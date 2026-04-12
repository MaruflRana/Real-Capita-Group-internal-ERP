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
import { CreateLocationDto } from './dto/create-location.dto';
import { LocationDto } from './dto/location.dto';
import { LocationsListQueryDto } from './dto/locations-list-query.dto';
import { LocationsListResponseDto } from './dto/locations-list-response.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller('companies/:companyId/locations')
@RequireCompanyAdminAccess()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List locations for a company.',
  })
  @ApiOkResponse({
    description: 'Locations were returned.',
    type: LocationsListResponseDto,
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
  listLocations(
    @Param('companyId') companyId: string,
    @Query() query: LocationsListQueryDto,
  ) {
    return this.locationsService.listLocations(companyId, query);
  }

  @Get(':locationId')
  @ApiOperation({
    summary: 'Return location detail.',
  })
  @ApiOkResponse({
    description: 'Location detail was returned.',
    type: LocationDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or location was not found.',
    type: ApiErrorResponseDto,
  })
  getLocation(
    @Param('companyId') companyId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.locationsService.getLocationDetail(companyId, locationId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a location for a company.',
  })
  @ApiCreatedResponse({
    description: 'Location was created.',
    type: LocationDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The location code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  createLocation(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() createLocationDto: CreateLocationDto,
  ) {
    return this.locationsService.createLocation(
      companyId,
      authenticatedUser.id,
      requestId,
      createLocationDto,
    );
  }

  @Patch(':locationId')
  @ApiOperation({
    summary: 'Update a location.',
  })
  @ApiOkResponse({
    description: 'Location was updated.',
    type: LocationDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The location code or name already exists in the company.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or location was not found.',
    type: ApiErrorResponseDto,
  })
  updateLocation(
    @Param('companyId') companyId: string,
    @Param('locationId') locationId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.updateLocation(
      companyId,
      locationId,
      authenticatedUser.id,
      requestId,
      updateLocationDto,
    );
  }

  @Post(':locationId/activate')
  @ApiOperation({
    summary: 'Activate a location.',
  })
  @ApiOkResponse({
    description: 'Location was activated.',
    type: LocationDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or location was not found.',
    type: ApiErrorResponseDto,
  })
  activateLocation(
    @Param('companyId') companyId: string,
    @Param('locationId') locationId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.locationsService.setLocationActiveState(
      companyId,
      locationId,
      authenticatedUser.id,
      requestId,
      true,
    );
  }

  @Post(':locationId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a location.',
  })
  @ApiOkResponse({
    description: 'Location was deactivated.',
    type: LocationDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or location was not found.',
    type: ApiErrorResponseDto,
  })
  deactivateLocation(
    @Param('companyId') companyId: string,
    @Param('locationId') locationId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.locationsService.setLocationActiveState(
      companyId,
      locationId,
      authenticatedUser.id,
      requestId,
      false,
    );
  }
}
