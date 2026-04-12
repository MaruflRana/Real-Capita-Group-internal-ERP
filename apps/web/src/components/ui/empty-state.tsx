import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@real-capita/ui';

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
      <p>{description}</p>
      {action}
    </CardContent>
  </Card>
);
