import type { LabelHTMLAttributes } from 'react';

import { cn } from '@real-capita/ui';

export const Label = ({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn('text-sm font-semibold leading-5 text-foreground', className)}
    {...props}
  />
);
