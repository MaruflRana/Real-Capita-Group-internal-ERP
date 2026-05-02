import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@real-capita/ui';

export const StateScreen = ({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) => (
  <div className="flex min-h-[40vh] items-center justify-center p-4 sm:p-6">
    <Card className="w-full max-w-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="break-words [overflow-wrap:anywhere]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p className="break-words leading-6 [overflow-wrap:anywhere]">
          {description}
        </p>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  </div>
);
