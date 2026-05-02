import type { ReactNode } from 'react';

import { EmptyStateBlock } from './erp-primitives';

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <EmptyStateBlock action={action} description={description} title={title} />
);
