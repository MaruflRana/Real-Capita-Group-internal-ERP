import { Button } from '@real-capita/ui';

import type { PaginationMeta } from '../../lib/api/types';

export const PaginationControls = ({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) => (
  <div className="flex flex-col gap-3 border-t border-border/70 px-6 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
    <p>
      Page {meta.page} of {Math.max(meta.totalPages, 1)}. {meta.total} total
      record{meta.total === 1 ? '' : 's'}.
    </p>
    <div className="flex items-center gap-2">
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
