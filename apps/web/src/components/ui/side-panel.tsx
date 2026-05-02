'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

import { Button, cn } from '@real-capita/ui';

export const SidePanel = ({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  size?: 'md' | 'lg';
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="screen-only fixed inset-0 z-50">
      <button
        aria-label="Close panel"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div
        aria-modal="true"
        className={cn(
          'absolute right-0 top-0 flex h-full w-full flex-col border-l border-border bg-card shadow-2xl',
          size === 'lg' ? 'max-w-3xl' : 'max-w-xl',
        )}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-raised px-6 py-5">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button
            aria-label="Close panel"
            className="h-10 w-10 rounded-full p-0"
            onClick={onClose}
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {actions ? (
          <div className="border-t border-border bg-surface-raised px-6 py-4">{actions}</div>
        ) : null}
      </div>
    </div>
  );
};
