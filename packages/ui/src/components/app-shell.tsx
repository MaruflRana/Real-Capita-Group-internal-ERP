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
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.09),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.12),transparent_38%)]" />
    <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-6 lg:flex-row lg:px-8">
      <aside className="flex w-full shrink-0 flex-col rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-shell backdrop-blur lg:w-72">
        <div className="space-y-3 border-b border-border/60 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
            {eyebrow}
          </p>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
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
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
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
              className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3"
              key={stat.label}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-border/60 bg-card/80 px-6 py-5 shadow-shell backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
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
