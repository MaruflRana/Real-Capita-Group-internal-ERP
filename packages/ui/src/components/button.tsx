import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        outline:
          'border border-border bg-background/40 text-foreground hover:bg-accent hover:text-accent-foreground',
        ghost:
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-4',
        lg: 'h-11 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({
  className,
  size,
  type = 'button',
  variant,
  ...props
}: ButtonProps) => (
  <button
    className={cn(buttonVariants({ size, variant }), className)}
    type={type}
    {...props}
  />
);

export { buttonVariants };
