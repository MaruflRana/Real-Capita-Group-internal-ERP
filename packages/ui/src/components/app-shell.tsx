import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

export interface AppShellNavItem {
  href: string;
  label: string;
  current?: boolean;
  disabled?: boolean;
}

export interface AppShellStat {
  label: string;
  value: string;
}

export interface AppShellProps {
  eyebrow: string;
  title: string;
  description: string;
  navItems: AppShellNavItem[];
  stats: AppShellStat[];
  children: ReactNode;
  actions?: ReactNode;
}

export const AppShell = ({
  actions,
  children,
  description,
  eyebrow,
  navItems,
  stats,
  title,
}: AppShellProps) => (
  <div className="relative min-h-screen bg-page-glow">
    <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:px-8">
      <aside className="flex w-full shrink-0 flex-col rounded-lg border border-border bg-surface-sidebar p-5 text-primary-foreground shadow-shell lg:w-72">
        <div className="space-y-3 border-b border-border/60 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/80">
            {eyebrow}
          </p>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-normal text-primary-foreground">
              {title}
            </h1>
            <p className="text-sm leading-6 text-primary-foreground/75">
              {description}
            </p>
          </div>
        </div>
        <nav className="mt-5 flex flex-col gap-2">
          {navItems.map((item) => (
            <a
              aria-disabled={item.disabled}
              className={cn(
                'rounded-2xl px-4 py-3 text-sm transition-colors',
                item.current
                  ? 'bg-primary-foreground text-slate-950 shadow-sm'
                  : 'text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                item.disabled && 'pointer-events-none opacity-45',
              )}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto grid gap-3 pt-6">
          {stats.map((stat) => (
            <div
              className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3"
              key={stat.label}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
                {stat.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-primary-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-lg border border-border bg-card px-6 py-5 shadow-card lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Internal ERP platform
            </p>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              This shell is intentionally generic. Domain modules, workflows,
              and permissions layers can be introduced without rewiring the app
              frame.
            </p>
          </div>
          {actions ? (
            <div className="flex items-center gap-3">{actions}</div>
          ) : null}
        </header>
        {children}
      </main>
    </div>
  </div>
);
