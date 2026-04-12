'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@real-capita/ui';

import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { isApiError } from '../../lib/api/client';
import { applyApiFormErrors } from '../../lib/forms';
import type {
  AttachmentDetailRecord,
  AttachmentEntityType,
  AttachmentEntityTypeOptionRecord,
  CreateAttachmentLinkPayload,
} from '../../lib/api/types';
import {
  useAttachmentEntityReferences,
  useCreateAttachmentUploadIntent,
  useFinalizeAttachmentUpload,
} from './hooks';
import {
  AuditDocumentsQueryErrorBanner,
  AuditDocumentsReadOnlyNotice,
  FormErrorText,
  KeyValueList,
} from './shared';
import {
  buildAttachmentUploadSummary,
  getReferenceOptionLabel,
  getReferenceSummary,
  OPTION_PAGE_SIZE,
  uploadFileToPresignedUrl,
} from './utils';

const attachmentLinkFormSchema = z.object({
  entityType: z.string().min(1, 'Entity type is required.'),
  entityId: z.string().min(1, 'Linked entity is required.'),
});

type AttachmentLinkFormValues = z.infer<typeof attachmentLinkFormSchema>;

export const AttachmentUploadPanel = ({
  companyId,
  onClose,
  onUploaded,
}: {
  companyId: string;
  onClose: () => void;
  onUploaded: (attachment: AttachmentDetailRecord) => void;
}) => {
  const createIntentMutation = useCreateAttachmentUploadIntent(companyId);
  const finalizeMutation = useFinalizeAttachmentUpload(companyId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [pendingAttachmentId, setPendingAttachmentId] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);

  const isBusy =
    createIntentMutation.isPending ||
    finalizeMutation.isPending ||
    uploadProgress !== null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setFileError('Select a file before starting the secure upload flow.');
      return;
    }

    setFileError(null);
    setSubmitError(null);
    setUploadProgress(null);
    setPendingAttachmentId(null);

    try {
      const uploadIntent = await createIntentMutation.mutateAsync({
        originalFileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        sizeBytes: String(selectedFile.size),
      });
      setPendingAttachmentId(uploadIntent.attachment.id);
      setUploadSummary(buildAttachmentUploadSummary(uploadIntent));
      setUploadProgress(0);

      await uploadFileToPresignedUrl({
        file: selectedFile,
        uploadIntent,
        onProgress: setUploadProgress,
      });

      const finalizedAttachment = await finalizeMutation.mutateAsync(
        uploadIntent.attachment.id,
      );
      setUploadProgress(null);
      onUploaded(finalizedAttachment);
    } catch (error) {
      setUploadProgress(null);

      if (isApiError(error)) {
        setSubmitError(error.apiError.message);
        return;
      }

      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to complete the secure upload flow.',
      );
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <AuditDocumentsQueryErrorBanner message={submitError} /> : null}
      <AuditDocumentsReadOnlyNotice
        title="Direct upload flow"
        description="This browser uploads file bytes directly to the storage URL returned by the NestJS API, then finalizes the attachment metadata through the REST contract."
      />
      <div className="space-y-2">
        <Label htmlFor="attachment-upload-file">File</Label>
        <Input
          id="attachment-upload-file"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setSelectedFile(nextFile);
            setFileError(null);
          }}
          type="file"
        />
        <FormErrorText message={fileError ?? undefined} />
      </div>
      {selectedFile ? (
        <KeyValueList
          items={[
            {
              label: 'Selected file',
              value: selectedFile.name,
            },
            {
              label: 'Mime type',
              value: selectedFile.type || 'application/octet-stream',
            },
            {
              label: 'Size bytes',
              value: String(selectedFile.size),
            },
          ]}
        />
      ) : null}
      {uploadSummary ? (
        <KeyValueList
          items={[
            {
              label: 'Upload intent',
              value: uploadSummary,
            },
            {
              label: 'Attachment id',
              value: pendingAttachmentId ?? 'Pending',
            },
            {
              label: 'Upload progress',
              value:
                uploadProgress === null
                  ? 'Not started'
                  : `${uploadProgress}% uploaded`,
            },
          ]}
        />
      ) : null}
      {pendingAttachmentId && submitError ? (
        <AuditDocumentsReadOnlyNotice
          title="Attachment record created"
          description={`Attachment ${pendingAttachmentId} was created before the flow stopped. Open the attachment detail if you need to retry finalization or review the pending upload state.`}
        />
      ) : null}
      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isBusy} type="submit">
          {isBusy ? 'Uploading...' : 'Start secure upload'}
        </Button>
      </div>
    </form>
  );
};

export const AttachmentLinkFormPanel = ({
  companyId,
  entityTypeOptions,
  defaultEntityType,
  isPending,
  onClose,
  onSubmit,
}: {
  companyId: string;
  entityTypeOptions: AttachmentEntityTypeOptionRecord[];
  defaultEntityType?: AttachmentEntityType;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAttachmentLinkPayload) => Promise<unknown>;
}) => {
  const form = useForm<AttachmentLinkFormValues>({
    resolver: zodResolver(attachmentLinkFormSchema),
    defaultValues: {
      entityType: defaultEntityType ?? entityTypeOptions[0]?.entityType ?? '',
      entityId: '',
    },
  });
  const [referenceSearch, setReferenceSearch] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const deferredReferenceSearch = useDeferredValue(referenceSearch);
  const selectedEntityType = form.watch('entityType') as AttachmentEntityType | '';

  const referencesQuery = useAttachmentEntityReferences(
    companyId,
    {
      entityType: selectedEntityType as AttachmentEntityType,
      page: 1,
      pageSize: OPTION_PAGE_SIZE,
      sortOrder: 'asc',
      isActive: true,
      ...(deferredReferenceSearch ? { search: deferredReferenceSearch } : {}),
    },
    selectedEntityType.length > 0,
  );

  useEffect(() => {
    form.setValue('entityId', '');
    setReferenceSearch('');
    setSubmitError(null);
  }, [form, selectedEntityType]);

  const selectedReference = useMemo(
    () =>
      referencesQuery.data?.items.find(
        (reference) => reference.id === form.watch('entityId'),
      ) ?? null,
    [form, referencesQuery.data?.items],
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    form.clearErrors();

    try {
      await onSubmit({
        entityType: values.entityType as AttachmentEntityType,
        entityId: values.entityId,
      });
    } catch (error) {
      if (applyApiFormErrors(form.setError, error)) {
        return;
      }

      if (isApiError(error)) {
        setSubmitError(error.apiError.message);
        return;
      }

      setSubmitError('Unable to create the attachment link.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <AuditDocumentsQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="attachment-link-entity-type">Entity type</Label>
        <Select id="attachment-link-entity-type" {...form.register('entityType')}>
          <option value="">Select entity type</option>
          {entityTypeOptions.map((option) => (
            <option key={option.entityType} value={option.entityType}>
              {option.label}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.entityType?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="attachment-link-reference-search">Entity search</Label>
        <Input
          id="attachment-link-reference-search"
          onChange={(event) => setReferenceSearch(event.target.value)}
          placeholder="Search the selected entity scope"
          value={referenceSearch}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="attachment-link-entity-id">Linked entity</Label>
        <Select id="attachment-link-entity-id" {...form.register('entityId')}>
          <option value="">
            {referencesQuery.isPending ? 'Loading references...' : 'Select linked entity'}
          </option>
          {referencesQuery.data?.items.map((reference) => (
            <option key={reference.id} value={reference.id}>
              {getReferenceOptionLabel(reference)}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.entityId?.message} />
      </div>
      {referencesQuery.isError && isApiError(referencesQuery.error) ? (
        <AuditDocumentsQueryErrorBanner
          message={referencesQuery.error.apiError.message}
        />
      ) : null}
      {selectedReference ? (
        <KeyValueList
          items={[
            {
              label: 'Selected entity',
              value: getReferenceSummary(selectedReference),
            },
            {
              label: 'Reference id',
              value: selectedReference.id,
            },
            {
              label: 'Entity state',
              value:
                selectedReference.isActive === null
                  ? 'Not state-scoped'
                  : selectedReference.isActive
                    ? 'Active'
                    : 'Inactive',
            },
          ]}
        />
      ) : null}
      <div className="flex items-center justify-end gap-3">
        <Button onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending ? 'Saving...' : 'Create link'}
        </Button>
      </div>
    </form>
  );
};
