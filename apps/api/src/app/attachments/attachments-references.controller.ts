import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireCompanyDocumentAccess } from '../auth/decorators/require-company-document-access.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/auth.types';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { CompanyUsersListQueryDto } from '../users/dto/company-users-list-query.dto';
import { CompanyUsersListResponseDto } from '../users/dto/company-users-list-response.dto';
import {
  AttachmentEntityReferencesListQueryDto,
  AttachmentEntityReferencesListResponseDto,
  AttachmentEntityTypesListResponseDto,
} from './dto/attachment-references.dto';
import { AttachmentsReferencesService } from './attachments-references.service';

@ApiTags('attachment-references')
@Controller('companies/:companyId/attachments/references')
@RequireCompanyDocumentAccess()
export class AttachmentsReferencesController {
  constructor(
    private readonly attachmentsReferencesService: AttachmentsReferencesService,
  ) {}

  @Get('entity-types')
  @ApiOperation({
    summary:
      'List supported attachment entity types accessible in the active company scope.',
  })
  @ApiOkResponse({
    description: 'Attachment entity types were returned.',
    type: AttachmentEntityTypesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company document access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listEntityTypes(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ) {
    return this.attachmentsReferencesService.listEntityTypes(
      companyId,
      authenticatedUser,
    );
  }

  @Get('entities')
  @ApiOperation({
    summary:
      'List supported attachment entity references for normalized document-link selectors.',
  })
  @ApiOkResponse({
    description: 'Attachment entity references were returned.',
    type: AttachmentEntityReferencesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company document access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listEntityReferences(
    @Param('companyId') companyId: string,
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Query() query: AttachmentEntityReferencesListQueryDto,
  ) {
    return this.attachmentsReferencesService.listEntityReferences(
      companyId,
      authenticatedUser,
      query,
    );
  }

  @Get('uploaders')
  @ApiOperation({
    summary:
      'List company-scoped user references for attachment uploader and audit actor selectors.',
  })
  @ApiOkResponse({
    description: 'Uploader references were returned.',
    type: CompanyUsersListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token verification failed.',
    type: ApiErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Company document access is required for the requested company.',
    type: ApiErrorResponseDto,
  })
  listUploaders(
    @Param('companyId') companyId: string,
    @Query() query: CompanyUsersListQueryDto,
  ) {
    return this.attachmentsReferencesService.listUploaderReferences(
      companyId,
      query,
    );
  }
}
