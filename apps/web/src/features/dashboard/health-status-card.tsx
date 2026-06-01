'use client';

import type { ComponentPropsWithoutRef } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@real-capita/ui';

import { fetchHealthStatus } from '../../lib/api/org-security';
import { formatDateTime } from '../../lib/format';

export const HealthStatusCard = ({
  ...restProps
}: ComponentPropsWithoutRef<typeof Card>) => {
  const healthQuery = useQuery({
    queryKey: ['dashboard-health'],
    queryFn: fetchHealthStatus,
    retry: false,
  });

  return (
    <Card className="h-full min-w-0 overflow-hidden border-brand-sky/40" {...restProps}>
      <CardHeader className="border-b border-brand-sky/40 bg-gradient-to-br from-brand-headerGradientStart via-card to-brand-headerGradientEnd/70">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          System status
        </p>
        <CardTitle>Application health</CardTitle>
        <CardDescription>
          Live service status for the current Real Capita ERP workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        {healthQuery.data ? (
          <div className="rounded-lg border border-status-success/25 bg-status-successSoft p-4 text-status-success">
            <p className="font-semibold">
              Service {healthQuery.data.status} on version {healthQuery.data.version}
            </p>
            <p className="mt-2">
              Reported at {formatDateTime(healthQuery.data.timestamp)}
            </p>
          </div>
        ) : null}
        {healthQuery.isPending ? (
          <div className="rounded-lg border border-brand-sky/35 bg-brand-skySoft/60 p-4">
            Checking application health.
          </div>
        ) : null}
        {healthQuery.isError ? (
          <div className="rounded-lg border border-status-danger/25 bg-status-dangerSoft p-4 text-status-danger">
            Unable to confirm application health.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
