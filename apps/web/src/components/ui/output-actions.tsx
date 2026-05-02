import { Download, Printer } from 'lucide-react';

import { Button, cn } from '@real-capita/ui';

export const OutputActionGroup = ({
  className,
  exportDisabled = false,
  exportLabel = 'Export CSV',
  isExporting = false,
  onExport,
  onPrint,
  printDisabled = false,
  printLabel = 'Print',
}: {
  className?: string;
  exportDisabled?: boolean;
  exportLabel?: string;
  isExporting?: boolean;
  onExport?: (() => void) | null;
  onPrint?: (() => void) | null;
  printDisabled?: boolean;
  printLabel?: string;
}) => (
  <div
    aria-busy={isExporting || undefined}
    className={cn(
      'screen-only flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto',
      className,
    )}
  >
    {onExport ? (
      <Button
        className="min-w-0"
        disabled={exportDisabled || isExporting}
        onClick={onExport}
        size="sm"
        variant="outline"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span className="truncate">
          {isExporting ? 'Preparing CSV...' : exportLabel}
        </span>
      </Button>
    ) : null}
    {onPrint ? (
      <Button
        className="min-w-0"
        disabled={printDisabled}
        onClick={onPrint}
        size="sm"
        variant="outline"
      >
        <Printer className="h-4 w-4 shrink-0" />
        <span className="truncate">{printLabel}</span>
      </Button>
    ) : null}
  </div>
);
