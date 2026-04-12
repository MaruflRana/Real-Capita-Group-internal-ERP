'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Blocks,
  BookOpenText,
  Building2,
  CalendarCheck2,
  CalendarRange,
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
  MapPinned,
  Paperclip,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { Button, cn } from '@real-capita/ui';
import { useAuth } from '../../components/providers/auth-provider';
import { Badge } from '../../components/ui/badge';
import { formatDateTime } from '../../lib/format';
import { APP_ROUTES } from '../../lib/routes';

const navigation = [
  {
    title: 'Core',
    access: 'public',
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
    access: 'accounting',
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
    access: 'accounting',
    items: [
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
    access: 'documents',
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
        access: 'audit-events',
      },
    ],
  },
  {
    title: 'Payroll',
    access: 'payroll',
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
    access: 'project-property',
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
    access: 'crm-property-desk',
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
    access: 'hr',
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
    access: 'org-security',
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

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const {
    canAccessAccounting,
    canAccessAuditEvents,
    canAccessCrmPropertyDesk,
    canAccessDocuments,
    canAccessHr,
    canAccessOrgSecurity,
    canAccessPayroll,
    canAccessProjectProperty,
    signOut,
    user,
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-admin-canvas">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6">
        <aside className="w-full shrink-0 rounded-[2rem] border border-border/70 bg-card/95 p-5 shadow-shell lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-80 lg:overflow-y-auto">
          <div className="space-y-4 border-b border-border/70 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
                Real Capita ERP
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                Internal workspace
              </h1>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Active company
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {user.currentCompany.name}
              </p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {user.currentCompany.slug}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <nav className="mt-6 space-y-6">
            {navigation.map((section) => (
              <div key={section.title}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {section.title}
                </p>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    const isDisabled =
                      (section.access === 'documents' && !canAccessDocuments) ||
                      (section.access === 'org-security' &&
                        !canAccessOrgSecurity) ||
                      (section.access === 'accounting' &&
                        !canAccessAccounting) ||
                      (section.access === 'payroll' && !canAccessPayroll) ||
                      (section.access === 'crm-property-desk' &&
                        !canAccessCrmPropertyDesk) ||
                      (section.access === 'hr' && !canAccessHr) ||
                      ('access' in item &&
                        item.access === 'audit-events' &&
                        !canAccessAuditEvents) ||
                      (section.access === 'project-property' &&
                        !canAccessProjectProperty);
                    const Icon = item.icon;

                    return (
                      <Link
                        aria-disabled={isDisabled}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          isDisabled && 'pointer-events-none opacity-45',
                        )}
                        href={item.href}
                        key={item.href}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-border/70 bg-background/85 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Session context</p>
            <p className="mt-2 leading-6">
              Other company memberships are visible in the session menu. This
              phase keeps the browser session anchored to the login company
              context.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="sticky top-4 z-20 rounded-[2rem] border border-border/70 bg-card/95 px-5 py-4 shadow-shell backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Authenticated workspace
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Company-aware admin shell backed directly by the NestJS REST
                  API.
                </p>
              </div>

              <div className="relative">
                <button
                  className="flex min-w-[260px] items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background px-4 py-3 text-left shadow-sm transition hover:border-primary/40"
                  onClick={() => setMenuOpen((current) => !current)}
                  type="button"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {user.currentCompany.slug}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {user.assignments.length} companies
                  </Badge>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 mt-3 w-full min-w-[320px] rounded-3xl border border-border/70 bg-card p-4 shadow-shell">
                    <div className="space-y-3 border-b border-border/70 pb-4">
                      <p className="text-sm font-semibold text-foreground">
                        Signed in as {user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last login {formatDateTime(user.lastLoginAt)}
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Company memberships
                      </p>
                      <div className="max-h-56 space-y-2 overflow-y-auto">
                        {user.assignments.map((assignment) => (
                          <div
                            className="rounded-2xl border border-border/70 bg-background px-4 py-3"
                            key={assignment.company.id}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {assignment.company.name}
                                </p>
                                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                                  {assignment.company.slug}
                                </p>
                              </div>
                              {assignment.company.id ===
                              user.currentCompany.id ? (
                                <Badge variant="success">Current</Badge>
                              ) : null}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {assignment.roles.map((role) => (
                                <Badge
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
                    <div className="mt-4 flex justify-end border-t border-border/70 pt-4">
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

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};
