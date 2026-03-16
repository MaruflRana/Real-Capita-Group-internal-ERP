import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@real-capita/ui';

export const HealthStatusCard = () => {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          API status
        </p>
        <CardTitle>Backend auth core is wired</CardTitle>
        <CardDescription>
          The frontend stays intentionally thin in Prompt 4. Auth and health
          verification now live on the NestJS API boundary and in the handoff
          commands.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="font-semibold text-foreground">Verify in the API layer:</p>
          <p className="mt-3">
            <span className="font-mono text-foreground">
              /api/v1/health
            </span>{' '}
            for liveness and readiness.
          </p>
          <p className="mt-2">
            <span className="font-mono text-foreground">
              /api/v1/auth/login
            </span>{' '}
            and{' '}
            <span className="font-mono text-foreground">
              /api/v1/auth/me
            </span>{' '}
            for auth-core verification.
          </p>
        </div>
        <p>
          This shell remains a frontend-only consumer. Prompt 4 intentionally
          leaves auth UI implementation out of scope.
        </p>
      </CardContent>
    </Card>
  );
};
