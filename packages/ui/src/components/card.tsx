import type { HTMLAttributes } from 'react';

import { cn } from '../lib/utils';

export const Card = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'rounded-3xl border border-border/70 bg-card/80 shadow-shell backdrop-blur',
      className,
    )}
    {...props}
  />
);

export const CardHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 p-6', className)} {...props} />
);

export const CardTitle = ({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn('text-lg font-semibold tracking-tight', className)}
    {...props}
  />
);

export const CardDescription = ({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
);

export const CardContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 pb-6', className)} {...props} />
);
