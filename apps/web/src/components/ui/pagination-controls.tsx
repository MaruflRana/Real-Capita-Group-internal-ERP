import { Button } from '@real-capita/ui';

import type { PaginationMeta } from '../../lib/api/types';

export const PaginationControls = ({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) => (
  <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <p className="min-w-0 break-words leading-6 [overflow-wrap:anywhere]">
      Page {meta.page} of {Math.max(meta.totalPages, 1)}. {meta.total} total
      record{meta.total === 1 ? '' : 's'}.
    </p>
    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
      <Button
        disabled={meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
        size="sm"
        variant="outline"
      >
        Previous
      </Button>
      <Button
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPageChange(meta.page + 1)}
        size="sm"
        variant="outline"
      >
        Next
      </Button>
    </div>
  </div>
);
