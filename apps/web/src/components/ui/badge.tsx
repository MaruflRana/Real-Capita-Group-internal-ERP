import type { HTMLAttributes } from 'react';

import { cn } from '@real-capita/ui';

const badgeVariants = {
  default: 'border border-status-info/25 bg-status-infoSoft text-status-info',
  success:
    'border border-status-success/25 bg-status-successSoft text-status-success',
  warning:
    'border border-status-warning/30 bg-status-warningSoft text-status-warning',
  danger: 'border border-status-danger/25 bg-status-dangerSoft text-status-danger',
  outline: 'border border-border bg-surface-raised text-foreground',
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
        'inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-4',
        badgeVariants[variant],
        className,
      )}
      {...rest}
    />
  );
};
