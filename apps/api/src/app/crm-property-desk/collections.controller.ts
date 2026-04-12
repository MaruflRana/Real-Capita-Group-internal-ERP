import {
  Body,
  Controller,
  Get,
  Param,
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

import { RequireCompanySalesAccess } from '../auth/decorators/require-company-sales-access.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import {
  CollectionDto,
  CollectionsListQueryDto,
  CollectionsListResponseDto,
  CreateCollectionDto,
} from './dto/collections.dto';
import { CollectionsService } from './collections.service';

@ApiTags('collections')
@Controller('companies/:companyId/collections')
@RequireCompanySalesAccess()
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List collections for a company.',
  })
  @ApiOkResponse({
    description: 'Collections were returned.',
    type: CollectionsListResponseDto,
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
  listCollections(
    @Param('companyId') companyId: string,
    @Query() query: CollectionsListQueryDto,
  ) {
    return this.collectionsService.listCollections(companyId, query);
  }

  @Get(':collectionId')
  @ApiOperation({
    summary: 'Return collection detail.',
  })
  @ApiOkResponse({
    description: 'Collection detail was returned.',
    type: CollectionDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or collection was not found.',
    type: ApiErrorResponseDto,
  })
  getCollection(
    @Param('companyId') companyId: string,
    @Param('collectionId') collectionId: string,
  ) {
    return this.collectionsService.getCollectionDetail(companyId, collectionId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a collection linked to an existing accounting voucher.',
  })
  @ApiCreatedResponse({
    description: 'Collection was created.',
    type: CollectionDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed or the collection linkage does not match the referenced company-scoped entities.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The voucher is already linked to an existing collection.',
    type: ApiErrorResponseDto,
  })
  createCollection(
    @Param('companyId') companyId: string,
    @Body() createCollectionDto: CreateCollectionDto,
  ) {
    return this.collectionsService.createCollection(
      companyId,
      createCollectionDto,
    );
  }
}
