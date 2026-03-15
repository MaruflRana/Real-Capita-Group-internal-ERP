import {
  AppShell,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  buttonVariants,
  cn,
} from '@real-capita/ui';

import { HealthStatusCard } from '../features/dashboard/health-status-card';

const navItems = [
  { href: '#workspace', label: 'Workspace', current: true },
  { href: '#architecture', label: 'Architecture' },
  { href: '#delivery', label: 'Delivery' },
  { href: '#auth', label: 'Auth (later)', disabled: true },
];

const stats = [
  { label: 'Stack', value: 'Nx + Next + Nest + Prisma' },
  { label: 'Boundary', value: 'REST-only' },
  { label: 'Ready for', value: 'Module-by-module rollout' },
];

export default function Page() {
  return (
    <AppShell
      actions={
        <a
          className={cn(buttonVariants(), 'w-full sm:w-auto')}
          href="#workspace"
        >
          Review foundation
        </a>
      }
      description="A strict monorepo baseline for the internal ERP, with the frontend consuming the backend exclusively over REST."
      eyebrow="Real Capita Group"
      navItems={navItems}
      stats={stats}
      title="ERP workspace foundation"
    >
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              Workspace posture
            </p>
            <CardTitle>Built for disciplined expansion</CardTitle>
            <CardDescription>
              The repo is intentionally free of business modules, sample data,
              and placeholder CRUD. The next prompts can add bounded modules
              without reworking the foundation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                apps/web
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                App Router shell, Tailwind, shadcn/ui primitives, and TanStack
                Query wired for API consumption only.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                apps/api
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                Versioned REST API with Swagger bootstrap, global validation
                defaults, and a health module ready for future domains.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                packages/*
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                Shared config, contracts, UI primitives, and tooling packages
                with Nx tags enforcing clean boundaries.
              </p>
            </div>
          </CardContent>
        </Card>
        <HealthStatusCard />
      </section>

      <section className="grid gap-6 lg:grid-cols-2" id="workspace">
        <Card id="architecture">
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              Boundary rules
            </p>
            <CardTitle>REST boundary enforced</CardTitle>
            <CardDescription>
              The web app is linted against server actions and backend imports.
              All business operations are expected to cross the NestJS REST
              boundary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Shared contracts live in{' '}
              <span className="font-mono text-foreground">
                @real-capita/types
              </span>
              .
            </p>
            <p>
              Shared UI primitives live in{' '}
              <span className="font-mono text-foreground">@real-capita/ui</span>
              .
            </p>
            <p>
              Environment and route helpers live in{' '}
              <span className="font-mono text-foreground">
                @real-capita/config
              </span>
              .
            </p>
          </CardContent>
        </Card>

        <Card id="delivery">
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              Delivery baseline
            </p>
            <CardTitle>Operational scaffolding in place</CardTitle>
            <CardDescription>
              Playwright, GitHub Actions, Prisma initialization, Docker Compose
              targets, and environment examples are all prepared for Prompt 2.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              PostgreSQL 15 and S3-compatible storage are configured as
              infrastructure targets only.
            </p>
            <p>
              No domain entities, tables, SQL migrations, or business modules
              have been introduced.
            </p>
            <p>
              Both applications remain independently runnable in development.
            </p>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
