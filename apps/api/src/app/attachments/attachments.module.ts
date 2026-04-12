import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';
import { AttachmentEntityReferenceService } from './attachment-entity-reference.service';
import { AttachmentsReferencesController } from './attachments-references.controller';
import { AttachmentsReferencesService } from './attachments-references.service';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

@Module({
  imports: [AuthModule, DatabaseModule, StorageModule],
  controllers: [AttachmentsController, AttachmentsReferencesController],
  providers: [
    AttachmentsService,
    AttachmentsReferencesService,
    AttachmentEntityReferenceService,
  ],
})
export class AttachmentsModule {}
