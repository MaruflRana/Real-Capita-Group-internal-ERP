'use client';

import { useQuery } from '@tanstack/react-query';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@real-capita/ui';

import { fetchHealthStatus } from '../../lib/api/client';

export const HealthStatusCard = () => {
  const healthQuery = useQuery({
    queryKey: ['api-health'],
    queryFn: fetchHealthStatus,
  });

  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          API status
        </p>
        <CardTitle>Health endpoint smoke check</CardTitle>
        <CardDescription>
          The dashboard is already wired as a REST consumer. If the API is
          offline, the shell degrades gracefully instead of hiding the boundary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthQuery.isPending ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
            Waiting for{' '}
            <span className="font-mono text-foreground">/api/v1/health</span>.
          </div>
        ) : null}

        {healthQuery.isError ? (
          <div className="space-y-4 rounded-2xl border border-amber-300/80 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">API unreachable from the web app.</p>
            <p className="leading-6">
              This is acceptable while running the frontend alone. Start the
              NestJS app to verify the end-to-end baseline.
            </p>
            <Button
              variant="outline"
              onClick={() => void healthQuery.refetch()}
            >
              Retry check
            </Button>
          </div>
        ) : null}

        {healthQuery.data ? (
          <div className="space-y-4 rounded-2xl border border-emerald-300/80 bg-emerald-50 p-4 text-sm text-emerald-950">
            <p className="font-semibold">API connection confirmed.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-800/70">
                  status
                </p>
                <p className="mt-2 font-medium">{healthQuery.data.status}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-800/70">
                  service
                </p>
                <p className="mt-2 font-medium">{healthQuery.data.service}</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-800/70">
                  version
                </p>
                <p className="mt-2 font-medium">{healthQuery.data.version}</p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
