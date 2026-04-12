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
  BlockDto,
  BlocksListQueryDto,
  BlocksListResponseDto,
  CreateBlockDto,
  UpdateBlockDto,
} from './dto/blocks.dto';
import { ProjectHierarchyService } from './project-hierarchy.service';

@ApiTags('blocks')
@Controller('companies/:companyId/blocks')
@RequireCompanyAdminAccess()
export class BlocksController {
  constructor(private readonly projectHierarchyService: ProjectHierarchyService) {}

  @Get()
  @ApiOperation({
    summary: 'List blocks for a company.',
  })
  @ApiOkResponse({
    description: 'Blocks were returned.',
    type: BlocksListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have admin access to the requested company.',
    type: ApiErrorResponseDto,
  })
  listBlocks(
    @Param('companyId') companyId: string,
    @Query() query: BlocksListQueryDto,
  ) {
    return this.projectHierarchyService.listBlocks(companyId, query);
  }

  @Get(':blockId')
  @ApiOperation({
    summary: 'Return block detail.',
  })
  @ApiOkResponse({
    description: 'Block detail was returned.',
    type: BlockDto,
  })
  getBlock(
    @Param('companyId') companyId: string,
    @Param('blockId') blockId: string,
  ) {
    return this.projectHierarchyService.getBlockDetail(companyId, blockId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a block.',
  })
  @ApiCreatedResponse({
    description: 'Block was created.',
    type: BlockDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the selected parent is inactive.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The block code or name already exists in the project.',
    type: ApiErrorResponseDto,
  })
  createBlock(
    @Param('companyId') companyId: string,
    @Body() createBlockDto: CreateBlockDto,
  ) {
    return this.projectHierarchyService.createBlock(companyId, createBlockDto);
  }

  @Patch(':blockId')
  @ApiOperation({
    summary: 'Update a block.',
  })
  @ApiOkResponse({
    description: 'Block was updated.',
    type: BlockDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the selected parent is inactive.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The block code or name already exists in the project.',
    type: ApiErrorResponseDto,
  })
  updateBlock(
    @Param('companyId') companyId: string,
    @Param('blockId') blockId: string,
    @Body() updateBlockDto: UpdateBlockDto,
  ) {
    return this.projectHierarchyService.updateBlock(
      companyId,
      blockId,
      updateBlockDto,
    );
  }

  @Post(':blockId/activate')
  @ApiOperation({
    summary: 'Activate a block.',
  })
  @ApiOkResponse({
    description: 'Block was activated.',
    type: BlockDto,
  })
  activateBlock(
    @Param('companyId') companyId: string,
    @Param('blockId') blockId: string,
  ) {
    return this.projectHierarchyService.setBlockActiveState(
      companyId,
      blockId,
      true,
    );
  }

  @Post(':blockId/deactivate')
  @ApiOperation({
    summary: 'Deactivate a block.',
  })
  @ApiOkResponse({
    description: 'Block was deactivated.',
    type: BlockDto,
  })
  deactivateBlock(
    @Param('companyId') companyId: string,
    @Param('blockId') blockId: string,
  ) {
    return this.projectHierarchyService.setBlockActiveState(
      companyId,
      blockId,
      false,
    );
  }
}
