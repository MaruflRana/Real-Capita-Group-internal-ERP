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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireCompanyDocumentAccess } from '../auth/decorators/require-company-document-access.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { RequestId } from '../common/decorators/request-id.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { AttachmentsService } from './attachments.service';
import {
  AttachmentDetailDto,
  AttachmentDownloadAccessDto,
  AttachmentUploadIntentResponseDto,
  AttachmentsListQueryDto,
  AttachmentsListResponseDto,
  CreateAttachmentLinkDto,
  CreateAttachmentUploadIntentDto,
} from './dto/attachments.dto';

@ApiTags('attachments')
@Controller('companies/:companyId/attachments')
@RequireCompanyDocumentAccess()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List attachment metadata for a company or a specific linked entity.',
  })
  @ApiOkResponse({
    description: 'Attachment metadata was returned.',
    type: AttachmentsListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The attachment list filters are invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The caller does not have access to the requested attachment scope.',
    type: ApiErrorResponseDto,
  })
  listAttachments(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Query() query: AttachmentsListQueryDto,
  ) {
    return this.attachmentsService.listAttachments(
      companyId,
      authenticatedUser,
      query,
    );
  }

  @Post('uploads')
  @ApiOperation({
    summary:
      'Create attachment metadata and return signed direct-upload instructions for S3-compatible storage.',
  })
  @ApiCreatedResponse({
    description: 'Attachment metadata and upload instructions were created.',
    type: AttachmentUploadIntentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Attachment metadata validation failed.',
    type: ApiErrorResponseDto,
  })
  createAttachmentUploadIntent(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() createAttachmentUploadIntentDto: CreateAttachmentUploadIntentDto,
  ) {
    return this.attachmentsService.createAttachmentUploadIntent(
      companyId,
      authenticatedUser,
      requestId,
      createAttachmentUploadIntentDto,
    );
  }

  @Post(':attachmentId/finalize')
  @ApiOperation({
    summary: 'Finalize a direct-uploaded attachment after the object reaches storage.',
  })
  @ApiOkResponse({
    description: 'Attachment upload was finalized.',
    type: AttachmentDetailDto,
  })
  @ApiBadRequestResponse({
    description:
      'Attachment finalization failed because the storage object is invalid or missing.',
    type: ApiErrorResponseDto,
  })
  finalizeAttachmentUpload(
    @Param('companyId') companyId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.attachmentsService.finalizeAttachmentUpload(
      companyId,
      attachmentId,
      authenticatedUser,
      requestId,
    );
  }

  @Get(':attachmentId')
  @ApiOperation({
    summary: 'Return attachment metadata detail.',
  })
  @ApiOkResponse({
    description: 'Attachment detail was returned.',
    type: AttachmentDetailDto,
  })
  @ApiNotFoundResponse({
    description: 'Company or attachment was not found.',
    type: ApiErrorResponseDto,
  })
  getAttachmentDetail(
    @Param('companyId') companyId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ) {
    return this.attachmentsService.getAttachmentDetail(
      companyId,
      attachmentId,
      authenticatedUser,
    );
  }

  @Post(':attachmentId/links')
  @ApiOperation({
    summary: 'Link a finalized attachment to a supported business entity.',
  })
  @ApiOkResponse({
    description: 'Attachment link was created or reactivated.',
    type: AttachmentDetailDto,
  })
  @ApiBadRequestResponse({
    description: 'The attachment or entity link is invalid.',
    type: ApiErrorResponseDto,
  })
  createAttachmentLink(
    @Param('companyId') companyId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
    @Body() createAttachmentLinkDto: CreateAttachmentLinkDto,
  ) {
    return this.attachmentsService.createAttachmentLink(
      companyId,
      attachmentId,
      authenticatedUser,
      requestId,
      createAttachmentLinkDto,
    );
  }

  @Post(':attachmentId/links/:attachmentLinkId/archive')
  @ApiOperation({
    summary: 'Deactivate an attachment link without deleting attachment metadata.',
  })
  @ApiOkResponse({
    description: 'Attachment link was deactivated.',
    type: AttachmentDetailDto,
  })
  @ApiBadRequestResponse({
    description: 'The attachment link is already inactive or cannot be changed.',
    type: ApiErrorResponseDto,
  })
  removeAttachmentLink(
    @Param('companyId') companyId: string,
    @Param('attachmentId') attachmentId: string,
    @Param('attachmentLinkId') attachmentLinkId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.attachmentsService.removeAttachmentLink(
      companyId,
      attachmentId,
      attachmentLinkId,
      authenticatedUser,
      requestId,
    );
  }

  @Post(':attachmentId/archive')
  @ApiOperation({
    summary: 'Archive attachment metadata without deleting the storage object.',
  })
  @ApiOkResponse({
    description: 'Attachment was archived.',
    type: AttachmentDetailDto,
  })
  archiveAttachment(
    @Param('companyId') companyId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @RequestId() requestId: string | undefined,
  ) {
    return this.attachmentsService.archiveAttachment(
      companyId,
      attachmentId,
      authenticatedUser,
      requestId,
    );
  }

  @Post(':attachmentId/download-url')
  @ApiOperation({
    summary: 'Generate a short-lived secure download URL for an authorized attachment.',
  })
  @ApiOkResponse({
    description: 'A secure download URL was returned.',
    type: AttachmentDownloadAccessDto,
  })
  createAttachmentDownloadAccess(
    @Param('companyId') companyId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ) {
    return this.attachmentsService.createAttachmentDownloadAccess(
      companyId,
      attachmentId,
      authenticatedUser,
    );
  }
}
