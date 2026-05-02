import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

import { cn } from '@real-capita/ui';
import { TableShell } from './erp-primitives';

export const Table = ({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) => (
  <TableShell>
    <table
      className={cn(
        'min-w-full border-separate border-spacing-0 text-sm',
        className,
      )}
      {...props}
    />
  </TableShell>
);

export const TableHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('bg-surface-muted', className)} {...props} />
);

export const TableBody = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('bg-card', className)} {...props} />
);

export const TableRow = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      'transition-colors hover:bg-surface-raised/70 [&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-border',
      className,
    )}
    {...props}
  />
);

export const TableHead = ({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold leading-5 text-foreground',
      className,
    )}
    {...props}
  />
);

export const TableCell = ({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn('px-4 py-3 align-top text-sm leading-6 text-foreground', className)}
    {...props}
  />
);
