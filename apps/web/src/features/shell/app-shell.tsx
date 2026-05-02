'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Blocks,
  BookOpenText,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ClipboardList,
  Fingerprint,
  History,
  FileCheck2,
  HandCoins,
  HardDrive,
  Handshake,
  IdCard,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MapPinned,
  Paperclip,
  ReceiptText,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import type { Phase1ModuleKey } from '@real-capita/config';

import { Button, cn } from '@real-capita/ui';
import { useAuth } from '../../components/providers/auth-provider';
import { Badge } from '../../components/ui/badge';
import { formatDateTime } from '../../lib/format';
import { getRoleLabels } from '../../lib/access';
import { APP_ROUTES } from '../../lib/routes';
import { RouteAccessBoundary } from './route-access-boundary';

const navigation = [
  {
    title: 'Core',
    moduleKey: 'dashboard',
    items: [
      {
        href: APP_ROUTES.dashboard,
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Accounting',
    moduleKey: 'accounting',
    items: [
      {
        href: APP_ROUTES.accountingChartOfAccounts,
        label: 'Chart of Accounts',
        icon: BookOpenText,
      },
      {
        href: APP_ROUTES.accountingVouchers,
        label: 'Vouchers',
        icon: ReceiptText,
      },
    ],
  },
  {
    title: 'Financial Reports',
    moduleKey: 'financialReports',
    items: [
      {
        href: APP_ROUTES.accountingReportsBusinessOverview,
        label: 'Business Overview',
        icon: BarChart3,
      },
      {
        href: APP_ROUTES.accountingReportsDaily,
        label: 'Daily Report',
        icon: CalendarDays,
      },
      {
        href: APP_ROUTES.accountingReportsWeekly,
        label: 'Weekly Report',
        icon: CalendarRange,
      },
      {
        href: APP_ROUTES.accountingReportsMonthly,
        label: 'Monthly Report',
        icon: CalendarRange,
      },
      {
        href: APP_ROUTES.accountingReportsYearly,
        label: 'Yearly Report',
        icon: CalendarRange,
      },
      {
        href: APP_ROUTES.accountingReportsTrialBalance,
        label: 'Trial Balance',
        icon: BookOpenText,
      },
      {
        href: APP_ROUTES.accountingReportsGeneralLedger,
        label: 'General Ledger',
        icon: ClipboardList,
      },
      {
        href: APP_ROUTES.accountingReportsProfitLoss,
        label: 'Profit & Loss',
        icon: HandCoins,
      },
      {
        href: APP_ROUTES.accountingReportsBalanceSheet,
        label: 'Balance Sheet',
        icon: Building2,
      },
    ],
  },
  {
    title: 'Audit & Documents',
    moduleKey: 'auditDocuments',
    items: [
      {
        href: APP_ROUTES.auditDocumentsAttachments,
        label: 'Attachments',
        icon: Paperclip,
      },
      {
        href: APP_ROUTES.auditDocumentsAuditEvents,
        label: 'Audit Events',
        icon: History,
        moduleKey: 'auditEvents',
      },
    ],
  },
  {
    title: 'Payroll',
    moduleKey: 'payroll',
    items: [
      {
        href: APP_ROUTES.payrollSalaryStructures,
        label: 'Salary Structures',
        icon: BookOpenText,
      },
      {
        href: APP_ROUTES.payrollRuns,
        label: 'Payroll Runs',
        icon: ClipboardList,
      },
      {
        href: APP_ROUTES.payrollPosting,
        label: 'Payroll Posting',
        icon: ReceiptText,
      },
    ],
  },
  {
    title: 'Project & Property Master',
    moduleKey: 'projectProperty',
    items: [
      {
        href: APP_ROUTES.projectPropertyProjects,
        label: 'Projects',
        icon: Building2,
      },
      {
        href: APP_ROUTES.projectPropertyCostCenters,
        label: 'Cost Centers',
        icon: Blocks,
      },
      {
        href: APP_ROUTES.projectPropertyPhases,
        label: 'Phases',
        icon: MapPinned,
      },
      {
        href: APP_ROUTES.projectPropertyBlocks,
        label: 'Blocks',
        icon: Blocks,
      },
      {
        href: APP_ROUTES.projectPropertyZones,
        label: 'Zones',
        icon: MapPinned,
      },
      {
        href: APP_ROUTES.projectPropertyUnitTypes,
        label: 'Unit Types',
        icon: BookOpenText,
      },
      {
        href: APP_ROUTES.projectPropertyUnitStatuses,
        label: 'Unit Statuses',
        icon: ShieldCheck,
      },
      {
        href: APP_ROUTES.projectPropertyUnits,
        label: 'Units',
        icon: Users,
      },
    ],
  },
  {
    title: 'CRM & Property Desk',
    moduleKey: 'crmPropertyDesk',
    items: [
      {
        href: APP_ROUTES.crmPropertyDeskCustomers,
        label: 'Customers',
        icon: Users,
      },
      {
        href: APP_ROUTES.crmPropertyDeskLeads,
        label: 'Leads',
        icon: Handshake,
      },
      {
        href: APP_ROUTES.crmPropertyDeskBookings,
        label: 'Bookings',
        icon: ClipboardList,
      },
      {
        href: APP_ROUTES.crmPropertyDeskSaleContracts,
        label: 'Sale Contracts',
        icon: FileCheck2,
      },
      {
        href: APP_ROUTES.crmPropertyDeskInstallmentSchedules,
        label: 'Installment Schedules',
        icon: CalendarRange,
      },
      {
        href: APP_ROUTES.crmPropertyDeskCollections,
        label: 'Collections',
        icon: HandCoins,
      },
    ],
  },
  {
    title: 'HR',
    moduleKey: 'hr',
    items: [
      {
        href: APP_ROUTES.hrEmployees,
        label: 'Employees',
        icon: IdCard,
      },
      {
        href: APP_ROUTES.hrAttendanceDevices,
        label: 'Attendance Devices',
        icon: HardDrive,
      },
      {
        href: APP_ROUTES.hrDeviceMappings,
        label: 'Device Mappings',
        icon: Link2,
      },
      {
        href: APP_ROUTES.hrAttendanceLogs,
        label: 'Attendance Logs',
        icon: Fingerprint,
      },
      {
        href: APP_ROUTES.hrLeaveTypes,
        label: 'Leave Types',
        icon: CalendarRange,
      },
      {
        href: APP_ROUTES.hrLeaveRequests,
        label: 'Leave Requests',
        icon: CalendarCheck2,
      },
    ],
  },
  {
    title: 'Org & Security',
    moduleKey: 'orgSecurity',
    items: [
      {
        href: APP_ROUTES.orgSecurityCompanies,
        label: 'Companies',
        icon: Building2,
      },
      {
        href: APP_ROUTES.orgSecurityLocations,
        label: 'Locations',
        icon: MapPinned,
      },
      {
        href: APP_ROUTES.orgSecurityDepartments,
        label: 'Departments',
        icon: Blocks,
      },
      {
        href: APP_ROUTES.orgSecurityUsers,
        label: 'Users',
        icon: Users,
      },
      {
        href: APP_ROUTES.orgSecurityRoleAssignments,
        label: 'Roles / Assignments',
        icon: ShieldCheck,
      },
    ],
  },
] as const;

const hasModuleAccess = (
  access: Record<Phase1ModuleKey, boolean>,
  moduleKey: Phase1ModuleKey,
) => access[moduleKey];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { access, signOut, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setNavigationOpen(false);
  }, [pathname]);

  if (!user) {
    return null;
  }

  const visibleNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        hasModuleAccess(
          access,
          'moduleKey' in item && item.moduleKey
            ? item.moduleKey
            : section.moduleKey,
        ),
      ),
    }))
    .filter(
      (section) =>
        hasModuleAccess(access, section.moduleKey) && section.items.length > 0,
    );

  return (
    <div className="app-shell min-h-screen bg-admin-canvas text-foreground">
      {navigationOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setNavigationOpen(false)}
          type="button"
        />
      ) : null}

      <div className="mx-auto grid min-h-screen w-full max-w-[1840px] lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <aside
          className={cn(
            'app-shell-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(20.5rem,calc(100vw-1.5rem))] -translate-x-full flex-col border-r border-slate-950/35 bg-surface-sidebar text-primary-foreground shadow-shell transition-transform duration-200 ease-out lg:sticky lg:inset-auto lg:top-0 lg:z-auto lg:h-screen lg:w-[17.5rem] lg:translate-x-0 lg:shadow-none',
            navigationOpen && 'translate-x-0',
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-primary-foreground/15 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
                    Real Capita ERP
                  </p>
                  <h1 className="mt-1.5 truncate text-lg font-semibold tracking-normal text-primary-foreground">
                    Internal workspace
                  </h1>
                </div>
                <Button
                  aria-label="Close navigation"
                  className="h-9 w-9 shrink-0 rounded-lg border-primary-foreground/20 bg-primary-foreground/10 p-0 text-primary-foreground hover:bg-primary-foreground/15 lg:hidden"
                  onClick={() => setNavigationOpen(false)}
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 rounded-lg border border-primary-foreground/15 bg-primary-foreground/[0.07] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground/65">
                  Active company
                </p>
                <p
                  className="mt-1.5 truncate text-sm font-semibold text-primary-foreground"
                  title={user.currentCompany.name}
                >
                  {user.currentCompany.name}
                </p>
                <p
                  className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-primary-foreground/60"
                  title={user.currentCompany.slug}
                >
                  {user.currentCompany.slug}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {getRoleLabels(user.roles).map((role) => (
                    <Badge
                      className="border-primary-foreground/20 bg-primary-foreground/10 px-2 py-0.5 text-[10px] leading-4 text-primary-foreground"
                      key={role}
                      variant="outline"
                    >
                      <span className="max-w-[11rem] truncate">{role}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <nav
              aria-label="Primary navigation"
              className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 [scrollbar-gutter:stable]"
            >
              {visibleNavigation.map((section) => {
                const sectionActive = section.items.some(
                  (item) =>
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`),
                );

                return (
                  <div key={section.title}>
                    <p
                      className={cn(
                        'mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.12em]',
                        sectionActive
                          ? 'text-primary-foreground'
                          : 'text-primary-foreground/52',
                      )}
                    >
                      {section.title}
                    </p>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                          <Link
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                              'group flex min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sidebar',
                              isActive
                                ? 'bg-primary-foreground text-slate-950 shadow-sm'
                                : 'text-primary-foreground/76 hover:bg-primary-foreground/10 hover:text-primary-foreground',
                            )}
                            href={item.href}
                            key={item.href}
                          >
                            <span
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition',
                                isActive
                                  ? 'border-slate-950/10 bg-slate-950/5 text-primary'
                                  : 'border-primary-foreground/10 bg-primary-foreground/[0.04] text-primary-foreground/70 group-hover:border-primary-foreground/20 group-hover:text-primary-foreground',
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-primary-foreground/15 px-4 py-3 text-xs leading-5 text-primary-foreground/66">
              <p className="font-semibold text-primary-foreground">
                Session context
              </p>
              <p className="mt-1.5">
                Company switching remains in the workspace menu; this session
                stays anchored to the login company.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="app-shell-header sticky top-0 z-30 border-b border-border/80 bg-surface/95 px-4 py-3 shadow-sm backdrop-blur lg:px-6">
            <div className="mx-auto flex max-w-[1380px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  aria-label="Open navigation"
                  className="h-10 w-10 shrink-0 p-0 lg:hidden"
                  onClick={() => setNavigationOpen(true)}
                  variant="outline"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                    Authenticated workspace
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    Company-aware shell backed by the NestJS REST API.
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-auto">
                <button
                  aria-expanded={menuOpen}
                  className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-left shadow-sm outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto sm:min-w-[18rem] sm:max-w-[28rem]"
                  onClick={() => setMenuOpen((current) => !current)}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user.email}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      {user.currentCompany.slug}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      className="px-2 py-0.5 text-[10px]"
                      variant="outline"
                    >
                      {user.assignments.length} companies
                    </Badge>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition',
                        menuOpen && 'rotate-180',
                      )}
                    />
                  </div>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 z-40 mt-2 w-[min(calc(100vw-2rem),24rem)] rounded-lg border border-border bg-card p-3 shadow-shell">
                    <div className="space-y-2 border-b border-border pb-3">
                      <p className="truncate text-sm font-semibold text-foreground">
                        Signed in as {user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last login {formatDateTime(user.lastLoginAt)}
                      </p>
                    </div>
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Company memberships
                      </p>
                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {user.assignments.map((assignment) => (
                          <div
                            className="rounded-lg border border-border bg-surface-raised px-3 py-3"
                            key={assignment.company.id}
                          >
                            <div className="flex min-w-0 items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p
                                  className="truncate text-sm font-semibold text-foreground"
                                  title={assignment.company.name}
                                >
                                  {assignment.company.name}
                                </p>
                                <p
                                  className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground"
                                  title={assignment.company.slug}
                                >
                                  {assignment.company.slug}
                                </p>
                              </div>
                              {assignment.company.id ===
                              user.currentCompany.id ? (
                                <Badge className="shrink-0" variant="success">
                                  Current
                                </Badge>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {getRoleLabels(assignment.roles).map((role) => (
                                <Badge
                                  className="px-2 py-0.5 text-[10px]"
                                  key={`${assignment.company.id}-${role}`}
                                  variant="outline"
                                >
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end border-t border-border pt-3">
                      <Button
                        className="gap-2"
                        onClick={() => void signOut()}
                        variant="outline"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="app-shell-main min-w-0 flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
            <div className="app-page-frame mx-auto min-w-0 max-w-[1380px]">
              <RouteAccessBoundary>{children}</RouteAccessBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
