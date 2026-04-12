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
  <div className="flex min-h-[40vh] items-center justify-center p-6">
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>{description}</p>
        {actions}
      </CardContent>
    </Card>
  </div>
);
