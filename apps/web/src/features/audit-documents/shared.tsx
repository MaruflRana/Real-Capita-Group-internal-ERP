'use client';

import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@real-capita/ui';

import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import type {
  AttachmentLinkRecord,
  AttachmentRecord,
  AttachmentStatus,
  AuditEventCategory,
} from '../../lib/api/types';
import {
  formatAttachmentEntityTypeLabel,
  formatAttachmentLinkLabel,
  formatAttachmentStatusLabel,
  formatAuditEventCategoryLabel,
  stringifyMetadataValue,
} from './utils';

const getAttachmentStatusVariant = (status: AttachmentStatus) => {
  switch (status) {
    case 'AVAILABLE':
      return 'success';
    case 'PENDING_UPLOAD':
      return 'outline';
    case 'ARCHIVED':
      return 'warning';
  }
};

const getAuditCategoryVariant = (category: AuditEventCategory) => {
  switch (category) {
    case 'AUTH':
      return 'outline';
    case 'ADMIN':
      return 'default';
    case 'ACCOUNTING':
      return 'outline';
    case 'CRM_PROPERTY_DESK':
      return 'outline';
    case 'PAYROLL':
      return 'outline';
    case 'ATTACHMENT':
      return 'success';
  }
};

export const AuditDocumentsPageHeader = ({
  title,
  description,
  scopeName,
  scopeSlug,
  actions,
}: {
  title: string;
  description: string;
  scopeName?: string;
  scopeSlug?: string;
  actions?: ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-col gap-4 border-b border-border/70 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          Audit &amp; Documents
        </p>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-6">
            {description}
          </CardDescription>
        </div>
        {scopeName ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{scopeName}</Badge>
            {scopeSlug ? <Badge variant="outline">{scopeSlug}</Badge> : null}
          </div>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </CardHeader>
  </Card>
);

export const AuditDocumentsSection = ({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-col gap-4 border-b border-border/70 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-4xl leading-6">
          {description}
        </CardDescription>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </CardHeader>
    <CardContent className="space-y-5 pt-6">{children}</CardContent>
  </Card>
);

export const AuditDocumentsFilterCard = ({
  children,
}: {
  children: ReactNode;
}) => (
  <Card>
    <CardContent className="grid gap-4 pt-6 xl:grid-cols-4">
      {children}
    </CardContent>
  </Card>
);

export const AuditDocumentsQueryErrorBanner = ({
  message,
}: {
  message: string;
}) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
    {message}
  </div>
);

export const AuditDocumentsReadOnlyNotice = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
    <p className="font-semibold">{title}</p>
    <p className="mt-1">{description}</p>
  </div>
);

export const AttachmentActionSurface = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-col gap-4 border-b border-border/70 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="leading-6">{description}</CardDescription>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </CardHeader>
    {children ? <CardContent className="pt-6">{children}</CardContent> : null}
  </Card>
);

export const DocumentsAccessRequiredState = () => (
  <EmptyState
    title="Document access required"
    description="The active session does not currently include company_admin, company_accountant, company_hr, company_payroll, or company_sales access in this company scope."
  />
);

export const AuditAccessRequiredState = () => (
  <EmptyState
    title="Company admin access required"
    description="Audit trail browsing is limited to company_admin access in the active company scope."
  />
);

export const AttachmentStatusBadge = ({
  status,
}: {
  status: AttachmentStatus;
}) => (
  <Badge variant={getAttachmentStatusVariant(status)}>
    {formatAttachmentStatusLabel(status)}
  </Badge>
);

export const AuditCategoryBadge = ({
  category,
}: {
  category: AuditEventCategory;
}) => (
  <Badge variant={getAuditCategoryVariant(category)}>
    {formatAuditEventCategoryLabel(category)}
  </Badge>
);

export const RelationBadgeRow = ({
  items,
}: {
  items: Array<string | null | undefined>;
}) => {
  const values = items.filter((item): item is string => Boolean(item));

  if (values.length === 0) {
    return <span className="text-sm text-muted-foreground">No linked records</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <Badge key={item} variant="outline">
          {item}
        </Badge>
      ))}
    </div>
  );
};

export const AttachmentLinkBadgeRow = ({
  links,
  emptyLabel = 'No linked entities',
}: {
  links: AttachmentLinkRecord[];
  emptyLabel?: string;
}) => {
  const activeLinks = links.filter((link) => link.isActive);

  if (activeLinks.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeLinks.map((link) => (
        <Badge key={link.id} variant="outline">
          {formatAttachmentLinkLabel(link)}
        </Badge>
      ))}
    </div>
  );
};

export const KeyValueList = ({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
  }>;
}) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => (
      <div
        className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
        key={item.label}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {item.label}
        </p>
        <div className="mt-2 text-sm text-foreground">{item.value}</div>
      </div>
    ))}
  </div>
);

export const MetadataPreviewCard = ({
  metadata,
}: {
  metadata: Record<string, unknown> | null;
}) => {
  const entries = metadata ? Object.entries(metadata) : [];

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
        No metadata was recorded for this event.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
      {entries.map(([key, value]) => (
        <div key={key}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {key}
          </p>
          <p className="mt-1 break-words text-sm text-foreground">
            {stringifyMetadataValue(value)}
          </p>
        </div>
      ))}
    </div>
  );
};

export const AttachmentEntityAttachmentsWidget = ({
  title,
  description,
  attachments,
}: {
  title: string;
  description: string;
  attachments: AttachmentRecord[];
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {attachments.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          No attachments match the current linked-entity context.
        </div>
      ) : (
        attachments.map((attachment) => (
          <div
            className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3"
            key={attachment.id}
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {attachment.originalFileName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {attachment.mimeType}
                </p>
              </div>
              <AttachmentStatusBadge status={attachment.status} />
            </div>
            <div className="mt-3">
              <AttachmentLinkBadgeRow links={attachment.links} />
            </div>
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

export const ActiveLinkSummary = ({
  links,
}: {
  links: AttachmentLinkRecord[];
}) => {
  const activeLinks = links.filter((link) => link.isActive);

  if (activeLinks.length === 0) {
    return <span className="text-sm text-muted-foreground">No active links</span>;
  }

  return (
    <div className="space-y-2">
      {activeLinks.map((link) => (
        <div
          className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
          key={link.id}
        >
          <p className="font-medium text-foreground">
            {formatAttachmentEntityTypeLabel(link.entityType)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{link.entityId}</p>
        </div>
      ))}
    </div>
  );
};

export const FormErrorText = ({
  message,
}: {
  message: string | undefined;
}) =>
  message ? <p className="text-sm text-rose-700">{message}</p> : null;
