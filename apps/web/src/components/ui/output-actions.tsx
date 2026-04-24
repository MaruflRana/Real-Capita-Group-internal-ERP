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
  <div className={cn('screen-only flex flex-wrap gap-2', className)}>
    {onExport ? (
      <Button
        disabled={exportDisabled || isExporting}
        onClick={onExport}
        size="sm"
        variant="outline"
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'Preparing CSV...' : exportLabel}
      </Button>
    ) : null}
    {onPrint ? (
      <Button
        disabled={printDisabled}
        onClick={onPrint}
        size="sm"
        variant="outline"
      >
        <Printer className="h-4 w-4" />
        {printLabel}
      </Button>
    ) : null}
  </div>
);
