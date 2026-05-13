'use client';

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

export const HealthStatusCard = () => {
  const healthQuery = useQuery({
    queryKey: ['dashboard-health'],
    queryFn: fetchHealthStatus,
    retry: false,
  });

  return (
    <Card>
      <CardHeader>
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
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <p className="font-semibold">
              Service {healthQuery.data.status} on version {healthQuery.data.version}
            </p>
            <p className="mt-2">
              Reported at {formatDateTime(healthQuery.data.timestamp)}
            </p>
          </div>
        ) : null}
        {healthQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            Checking application health.
          </div>
        ) : null}
        {healthQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            Unable to confirm application health.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
