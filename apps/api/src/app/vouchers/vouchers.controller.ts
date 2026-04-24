import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
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
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireCompanyAccountingAccess } from '../auth/decorators/require-company-accounting-access.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { RequestId } from '../common/decorators/request-id.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { VouchersService } from './vouchers.service';
import { buildVoucherDetailCsv } from './voucher-exports';
import {
  CreateVoucherDraftDto,
  CreateVoucherLineDto,
  UpdateVoucherDraftDto,
  UpdateVoucherLineDto,
  VoucherDetailDto,
  VouchersListQueryDto,
  VouchersListResponseDto,
} from './dto/vouchers.dto';

@ApiTags('vouchers')
@Controller('companies/:companyId/accounting/vouchers')
@RequireCompanyAccountingAccess()
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  @ApiOperation({
    summary: 'List vouchers for a company.',
  })
  @ApiOkResponse({
    description: 'Vouchers were returned.',
    type: VouchersListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company accounting or company admin access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listVouchers(
    @Param('companyId') companyId: string,
    @Query() query: VouchersListQueryDto,
  ) {
    return this.vouchersService.listVouchers(companyId, query);
  }

  @Get(':voucherId/export')
  @ApiOperation({
    summary: 'Return voucher detail as a read-only CSV export.',
  })
  @ApiOkResponse({
    description: 'Voucher detail CSV export was returned.',
  })
  async exportVoucher(
    @Param('companyId') companyId: string,
    @Param('voucherId') voucherId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const voucher = await this.vouchersService.getVoucherDetail(
      companyId,
      voucherId,
    );

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');

    return buildVoucherDetailCsv(voucher);
  }

  @Get(':voucherId')
  @ApiOperation({
    summary: 'Return voucher detail including voucher lines.',
  })
  @ApiOkResponse({
    description: 'Voucher detail was returned.',
    type: VoucherDetailDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or voucher was not found.',
    type: ApiErrorResponseDto,
  })
  getVoucher(
    @Param('companyId') companyId: string,
    @Param('voucherId') voucherId: string,
  ) {
    return this.vouchersService.getVoucherDetail(companyId, voucherId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a voucher draft.',
  })
  @ApiCreatedResponse({
    description: 'Voucher draft was created.',
    type: VoucherDetailDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: ApiErrorResponseDto,
  })
  createVoucherDraft(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() createVoucherDraftDto: CreateVoucherDraftDto,
  ) {
    return this.vouchersService.createVoucherDraft(
      companyId,
      authenticatedUser,
      createVoucherDraftDto,
    );
  }

  @Patch(':voucherId')
  @ApiOperation({
    summary: 'Update a voucher draft header.',
  })
  @ApiOkResponse({
    description: 'Voucher draft was updated.',
    type: VoucherDetailDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the voucher is already posted.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or voucher was not found.',
    type: ApiErrorResponseDto,
  })
  updateVoucherDraft(
    @Param('companyId') companyId: string,
    @Param('voucherId') voucherId: string,
    @Body() updateVoucherDraftDto: UpdateVoucherDraftDto,
  ) {
    return this.vouchersService.updateVoucherDraft(
      companyId,
      voucherId,
      updateVoucherDraftDto,
    );
  }

  @Post(':voucherId/lines')
  @ApiOperation({
    summary: 'Add a voucher line to a draft voucher.',
  })
  @ApiOkResponse({
    description: 'Voucher line was added.',
    type: VoucherDetailDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, the voucher is posted, or the posting account is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The voucher line change caused a uniqueness conflict.',
    type: ApiErrorResponseDto,
  })
  addVoucherLine(
    @Param('companyId') companyId: string,
    @Param('voucherId') voucherId: string,
    @Body() createVoucherLineDto: CreateVoucherLineDto,
  ) {
    return this.vouchersService.addVoucherLine(
      companyId,
      voucherId,
      createVoucherLineDto,
    );
  }

  @Patch(':voucherId/lines/:voucherLineId')
  @ApiOperation({
    summary: 'Update a voucher line on a draft voucher.',
  })
  @ApiOkResponse({
    description: 'Voucher line was updated.',
    type: VoucherDetailDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, the voucher is posted, or the posting account is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, voucher, or voucher line was not found.',
    type: ApiErrorResponseDto,
  })
  updateVoucherLine(
    @Param('companyId') companyId: string,
    @Param('voucherId') voucherId: string,
    @Param('voucherLineId') voucherLineId: string,
    @Body() updateVoucherLineDto: UpdateVoucherLineDto,
  ) {
    return this.vouchersService.updateVoucherLine(
      companyId,
      voucherId,
      voucherLineId,
      updateVoucherLineDto,
    );
  }

  @Delete(':voucherId/lines/:voucherLineId')
  @ApiOperation({
    summary: 'Remove a voucher line from a draft voucher.',
  })
  @ApiOkResponse({
    description: 'Voucher line was removed.',
    type: VoucherDetailDto,
  })
  @ApiBadRequestResponse({
    description: 'The voucher is posted and cannot be changed.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company, voucher, or voucher line was not found.',
    type: ApiErrorResponseDto,
  })
  removeVoucherLine(
    @Param('companyId') companyId: string,
    @Param('voucherId') voucherId: string,
    @Param('voucherLineId') voucherLineId: string,
  ) {
    return this.vouchersService.removeVoucherLine(
      companyId,
      voucherId,
      voucherLineId,
    );
  }

  @Post(':voucherId/post')
  @ApiOperation({
    summary: 'Post a draft voucher explicitly.',
  })
  @ApiOkResponse({
    description: 'Voucher was posted.',
    type: VoucherDetailDto,
  })
  @ApiBadRequestResponse({
    description:
      'Posting failed because the voucher is not draft, has no lines, is unbalanced, or uses invalid posting accounts.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or voucher was not found.',
    type: ApiErrorResponseDto,
  })
  postVoucher(
    @Param('companyId') companyId: string,
    @Param('voucherId') voucherId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.vouchersService.postVoucher(
      companyId,
      voucherId,
      authenticatedUser,
      requestId,
    );
  }
}
