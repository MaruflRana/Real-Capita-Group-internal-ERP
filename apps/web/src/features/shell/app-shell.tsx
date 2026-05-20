'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Blocks,
  BookOpenText,
  Building2,
  CalendarCheck2,
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
  Search,
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

const normalizeNavigationSearch = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const getNavigationKeywords = ({
  href,
  label,
  sectionTitle,
}: {
  href: string;
  label: string;
  sectionTitle: string;
}) => {
  const terms = [label, sectionTitle, href];

  if (sectionTitle === 'Financial Reports') {
    terms.push('report reports financial statement print export csv');
  }

  if (label.toLowerCase().includes('collection')) {
    terms.push('collection collections receipt payment');
  }

  if (label.toLowerCase().includes('attendance')) {
    terms.push('attendance device log biometric');
  }

  if (label.toLowerCase().includes('voucher')) {
    terms.push('voucher vouchers posting accounting');
  }

  return terms.join(' ');
};

const getNavigationSearchScore = (
  {
    href,
    keywords,
    label,
    sectionTitle,
  }: {
    href: string;
    keywords: string;
    label: string;
    sectionTitle: string;
  },
  query: string,
) => {
  const normalizedLabel = normalizeNavigationSearch(label);
  const normalizedSection = normalizeNavigationSearch(sectionTitle);
  const normalizedHref = normalizeNavigationSearch(href);
  const normalizedKeywords = normalizeNavigationSearch(keywords);

  if (normalizedLabel === query) {
    return 0;
  }

  if (normalizedLabel.startsWith(query)) {
    return 1;
  }

  if (normalizedSection === query) {
    return 2;
  }

  if (normalizedLabel.includes(query)) {
    return 3;
  }

  if (normalizedSection.includes(query)) {
    return 4;
  }

  if (normalizedKeywords.includes(query)) {
    return 5;
  }

  if (normalizedHref.includes(query)) {
    return 6;
  }

  return null;
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { access, signOut, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [navigationSearchQuery, setNavigationSearchQuery] = useState('');
  const [navigationSearchHighlight, setNavigationSearchHighlight] = useState(0);

  useEffect(() => {
    setMenuOpen(false);
    setNavigationOpen(false);
    setNavigationSearchQuery('');
    setNavigationSearchHighlight(0);
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
  const navigationSearchResults = useMemo(() => {
    const query = normalizeNavigationSearch(navigationSearchQuery);

    if (!query) {
      return [];
    }

    return visibleNavigation
      .flatMap((section) =>
        section.items.map((item, itemIndex) => {
          const keywords = getNavigationKeywords({
            href: item.href,
            label: item.label,
            sectionTitle: section.title,
          });
          const score = getNavigationSearchScore(
            {
              href: item.href,
              keywords,
              label: item.label,
              sectionTitle: section.title,
            },
            query,
          );

          return {
            href: item.href,
            label: item.label,
            order: itemIndex,
            score,
            sectionTitle: section.title,
          };
        }),
      )
      .filter((item): item is typeof item & { score: number } => item.score !== null)
      .sort((first, second) => {
        if (first.score !== second.score) {
          return first.score - second.score;
        }

        return first.order - second.order;
      })
      .slice(0, 8);
  }, [navigationSearchQuery, visibleNavigation]);
  const hasNavigationSearchQuery = navigationSearchQuery.trim().length > 0;
  const navigationSearchListId = 'sidebar-navigation-search-results';

  useEffect(() => {
    setNavigationSearchHighlight(0);
  }, [navigationSearchQuery]);

  const navigateToHighlightedSearchResult = () => {
    const selectedResult =
      navigationSearchResults[navigationSearchHighlight] ??
      navigationSearchResults[0];

    if (!selectedResult) {
      return;
    }

    router.push(selectedResult.href);
    setNavigationSearchQuery('');
    setNavigationSearchHighlight(0);
  };

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
            'app-shell-sidebar sidebar-gradient-bg sidebar-brand-accent-bar fixed inset-y-0 left-0 z-50 flex w-[min(20.5rem,calc(100vw-1.5rem))] -translate-x-full flex-col border-l-[3px] border-l-transparent border-r border-r-brand-green/25 text-primary-foreground shadow-shell transition-transform duration-200 ease-out lg:sticky lg:inset-auto lg:top-0 lg:z-auto lg:h-screen lg:w-[17.5rem] lg:translate-x-0 lg:shadow-none',
            navigationOpen && 'translate-x-0',
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="sidebar-top-accent border-b border-brand-green/30 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-sky">
                    Real Capita<span className="text-primary-foreground/60"> ERP</span>
                  </p>
                  <h1 className="mt-1 truncate text-lg font-semibold tracking-normal text-primary-foreground/80">
                    Internal workspace
                  </h1>
                  <div className="mt-2 h-[3px] w-24 rounded-full sidebar-brand-accent-line" />
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

              <div className="mt-4 rounded-lg border border-brand-blue/45 sidebar-company-card-bg p-3 shadow-[0_1px_4px_rgba(0,111,183,0.12)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-sky/85">
                  Active company
                </p>
                <p
                  className="mt-1.5 truncate text-sm font-semibold text-primary-foreground"
                  title={user.currentCompany.name}
                >
                  {user.currentCompany.name}
                </p>
                <p
                  className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.08em] text-primary-foreground/65"
                  title={user.currentCompany.slug}
                >
                  {user.currentCompany.slug}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {getRoleLabels(user.roles).map((role) => (
                    <Badge
                      className="border-brand-green/55 bg-brand-green/20 px-2 py-0.5 text-[10px] leading-4 text-brand-greenSoft"
                      key={role}
                      variant="outline"
                    >
                      <span className="max-w-[11rem] truncate">{role}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-b border-brand-green/20 px-3 py-3">
              <div className="relative">
                <label className="sr-only" htmlFor="sidebar-navigation-search">
                  Find navigation page
                </label>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sky/70"
                />
                <input
                  aria-activedescendant={
                    hasNavigationSearchQuery &&
                    navigationSearchResults[navigationSearchHighlight]
                      ? `sidebar-navigation-search-result-${navigationSearchHighlight}`
                      : undefined
                  }
                  aria-controls={navigationSearchListId}
                  aria-expanded={hasNavigationSearchQuery}
                  aria-label="Find navigation page"
                  className="sidebar-search-input-field h-10 w-full rounded-lg border border-brand-sky/30 px-9 text-sm font-medium text-primary-foreground placeholder:text-primary-foreground/55"
                  id="sidebar-navigation-search"
                  onChange={(event) =>
                    setNavigationSearchQuery(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      if (hasNavigationSearchQuery) {
                        event.preventDefault();
                        setNavigationSearchQuery('');
                        setNavigationSearchHighlight(0);
                      }

                      return;
                    }

                    if (!hasNavigationSearchQuery) {
                      return;
                    }

                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setNavigationSearchHighlight((current) =>
                        navigationSearchResults.length === 0
                          ? 0
                          : (current + 1) % navigationSearchResults.length,
                      );
                      return;
                    }

                    if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      setNavigationSearchHighlight((current) =>
                        navigationSearchResults.length === 0
                          ? 0
                          : (current - 1 + navigationSearchResults.length) %
                            navigationSearchResults.length,
                      );
                      return;
                    }

                    if (event.key === 'Enter') {
                      event.preventDefault();
                      navigateToHighlightedSearchResult();
                    }
                  }}
                  placeholder="Search modules, reports, pages…"
                  type="search"
                  value={navigationSearchQuery}
                />
                {hasNavigationSearchQuery ? (
                  <button
                    aria-label="Clear navigation search"
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-primary-foreground/60 outline-none transition hover:bg-brand-sky/20 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-brand-sky/55"
                    onClick={() => {
                      setNavigationSearchQuery('');
                      setNavigationSearchHighlight(0);
                    }}
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {hasNavigationSearchQuery ? (
                <div
                  aria-label="Navigation search results"
                  className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-brand-sky/35 bg-gradient-to-b from-brand-navy/80 to-brand-green/25 p-1 shadow-sm [scrollbar-gutter:stable]"
                  id={navigationSearchListId}
                  role="listbox"
                >
                  {navigationSearchResults.length > 0 ? (
                    navigationSearchResults.map((item, index) => {
                      const isHighlighted =
                        index === navigationSearchHighlight;

                      return (
                        <Link
                          aria-selected={isHighlighted}
                          className={cn(
                            'block rounded-md border px-2.5 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-primary-foreground/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sidebar',
                            isHighlighted
                              ? 'border-brand-green/45 bg-primary-foreground text-brand-navy shadow-sm ring-1 ring-brand-sky/45'
                              : 'border-transparent text-primary-foreground/82 hover:border-brand-sky/25 hover:bg-brand-sky/18 hover:text-primary-foreground',
                          )}
                          href={item.href}
                          id={`sidebar-navigation-search-result-${index}`}
                          key={item.href}
                          onClick={() => {
                            setNavigationSearchQuery('');
                            setNavigationSearchHighlight(0);
                          }}
                          onMouseEnter={() =>
                            setNavigationSearchHighlight(index)
                          }
                          role="option"
                        >
                          <span className="flex min-w-0 items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold">
                              {item.label}
                            </span>
                            {isHighlighted ? (
                              <span className="shrink-0 rounded border border-slate-950/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]">
                                Selected
                              </span>
                            ) : null}
                          </span>
                          <span
                            className={cn(
                              'mt-1 block truncate text-[11px] font-semibold uppercase tracking-[0.08em]',
                              isHighlighted
                                ? 'text-brand-navy/75'
                                : 'text-primary-foreground/52',
                            )}
                          >
                            {item.sectionTitle}
                          </span>
                          <span
                            className={cn(
                              'mt-0.5 block truncate font-mono text-[11px]',
                              isHighlighted
                                ? 'text-brand-navy/75'
                                : 'text-primary-foreground/45',
                            )}
                          >
                            {item.href}
                          </span>
                        </Link>
                      );
                    })
                  ) : (
                    <p className="px-2.5 py-3 text-sm font-medium text-primary-foreground/70">
                      No matching page found
                    </p>
                  )}
                </div>
              ) : null}
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
                        'pb-1 border-b px-2 text-[11px] font-semibold uppercase tracking-[0.12em]',
                        sectionActive
                          ? 'border-brand-green/30 text-brand-sky before:inline-block before:h-[3px] before:w-2.5 before:rounded-full before:bg-gradient-to-r before:from-brand-green/75 before:to-brand-sky/55 before:mr-2 before:align-middle'
                          : 'border-brand-sky/15 text-primary-foreground/52',
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
                                ? 'sidebar-active-nav-bg border-y border-brand-sky/40 border-l-[3px] border-l-brand-green/50 text-primary-foreground shadow-[0_1px_3px_rgba(0,111,183,0.14)]'
                                : 'text-primary-foreground/76 hover:bg-brand-sky/12 hover:text-primary-foreground',
                            )}
                            href={item.href}
                            key={item.href}
                          >
                            <span
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition',
                                isActive
                                  ? 'sidebar-active-icon-bg border-brand-green/50 text-brand-sky'
                                  : 'border-brand-blue/15 bg-brand-blue/[0.06] text-primary-foreground/70 group-hover:border-brand-sky/35 group-hover:text-primary-foreground',
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

            <div className="border-t border-brand-green/35 sidebar-footer-bg px-4 py-3 text-xs leading-5 text-primary-foreground/70">
              <p className="font-semibold">
                <span className="text-brand-sky/80">Session</span> <span className="text-brand-green/70">context</span>
              </p>
              <p className="mt-1.5 text-primary-foreground/65">
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
                    Company-aware workspace for Real Capita ERP operations.
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
