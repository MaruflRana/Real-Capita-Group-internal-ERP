import type { HTMLAttributes } from 'react';

import { cn } from '@real-capita/ui';

const badgeVariants = {
  default: 'bg-secondary text-secondary-foreground',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-900',
  danger: 'bg-rose-100 text-rose-800',
  outline: 'border border-border bg-background text-foreground',
} as const;

export const Badge = ({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof badgeVariants;
}) => {
  const variant =
    'variant' in props && props.variant ? props.variant : 'default';
  const { variant: _variant, ...rest } = props;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
        badgeVariants[variant],
        className,
      )}
      {...rest}
    />
  );
};
