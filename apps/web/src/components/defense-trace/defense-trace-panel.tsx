'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  ChevronDown,
  Code2,
  Database,
  FileCode2,
  Minimize2,
  Route,
  Search,
  Settings,
  X,
} from 'lucide-react';

import {
  createDefenseTraceEntryApiFallbackCommand,
  createDefenseTraceApiSearchCommand,
  createDefenseTraceMatchedTraceCommand,
} from '../../lib/defense-trace/api-trace';
import {
  searchDefenseTraceEntries,
  type DefenseTraceRouteMatch,
} from '../../lib/defense-trace/match-trace';
import type { DefenseTracePanelPosition } from '../../lib/defense-trace/preferences';
import type {
  DefenseTraceApiActivity,
  DefenseTraceEntry,
  DefenseTraceFileReference,
  DefenseTraceSearchCommand,
} from '../../lib/defense-trace/types';
import {
  DefenseTraceCopyCommandButton,
  DefenseTraceFileActions,
} from './defense-trace-actions';

const formatCategory = (category: string): string =>
  category
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const getPanelPositionClassName = (
  panelPosition: DefenseTracePanelPosition,
): string => {
  if (panelPosition === 'left') {
    return 'left-4 top-4 max-h-[calc(100vh-2rem)] w-[min(440px,calc(100vw-2rem))]';
  }

  if (panelPosition === 'bottom') {
    return 'bottom-4 left-1/2 max-h-[min(78vh,680px)] w-[min(760px,calc(100vw-2rem))] -translate-x-1/2';
  }

  return 'right-4 top-4 max-h-[calc(100vh-2rem)] w-[min(440px,calc(100vw-2rem))]';
};

const getMinimizedPositionClassName = (
  panelPosition: DefenseTracePanelPosition,
): string => {
  if (panelPosition === 'left') {
    return 'bottom-4 left-4';
  }

  if (panelPosition === 'bottom') {
    return 'bottom-4 left-1/2 -translate-x-1/2';
  }

  return 'bottom-4 right-4';
};

const PathGroup = ({
  defaultOpen = false,
  files,
  title,
  workspaceRoot,
}: {
  defaultOpen?: boolean;
  files: readonly DefenseTraceFileReference[];
  title: string;
  workspaceRoot: string;
}) => (
  <details
    className="group rounded-lg border border-border bg-card/80"
    open={defaultOpen}
  >
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-foreground">
      <span>
        {title}{' '}
        <span className="text-xs font-normal text-muted-foreground">
          ({files.length})
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
    </summary>
    <div className="space-y-2 border-t border-border p-2">
      {files.length > 0 ? (
        files.map((file) => (
          <DefenseTraceFileActions
            file={file}
            key={`${title}-${file.relativePath}-${file.line ?? 'root'}`}
            workspaceRoot={workspaceRoot}
          />
        ))
      ) : (
        <p className="rounded-md bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
          No verified path registered for this group. Use the search commands
          below to confirm ownership before editing.
        </p>
      )}
    </div>
  </details>
);

const SearchCommandList = ({
  commands,
}: {
  commands: readonly DefenseTraceSearchCommand[];
}) => (
  <div className="space-y-2">
    {commands.map((command) => (
      <div
        className="rounded-lg border border-border bg-muted/30 p-2"
        key={`${command.label}-${command.command}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              {command.label}
            </p>
            {command.scope ? (
              <p className="text-[11px] text-muted-foreground">
                Scope: {command.scope}
              </p>
            ) : null}
          </div>
          <DefenseTraceCopyCommandButton command={command.command} label="Copy" />
        </div>
        <code className="mt-2 block break-all rounded bg-background/80 px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground">
          {command.command}
        </code>
      </div>
    ))}
  </div>
);

const RecentApiActivity = ({
  activities,
  onClear,
  onSelectedEntryIdChange,
  selectedEntry,
}: {
  activities: readonly DefenseTraceApiActivity[];
  onClear: () => void;
  onSelectedEntryIdChange: (entryId: string) => void;
  selectedEntry: DefenseTraceEntry | null;
}) => (
  <details className="group rounded-xl border border-border bg-card">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-foreground">
      <span className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-brand-green" />
        Recent API Activity
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {activities.length}
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
    </summary>
    <div className="space-y-3 border-t border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="inline-flex rounded-full border border-brand-green/30 bg-brand-greenSoft px-2 py-1 text-[11px] font-semibold text-brand-navy">
            Trace capture active
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Metadata-only request trace. It shows method, request path, status,
            duration, and matched topic when available.
          </p>
        </div>
        <button
          className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm transition hover:border-brand-sky/60 hover:bg-brand-skySoft/60 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={activities.length === 0}
          onClick={onClear}
          type="button"
        >
          Clear activity
        </button>
      </div>
      {activities.length > 0 ? (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {activities.map((activity) => {
            const backendSearchCommand =
              createDefenseTraceApiSearchCommand(activity);
            const traceCommand =
              createDefenseTraceMatchedTraceCommand(activity);

            return (
              <div
                className="space-y-2 rounded-lg border border-border bg-muted/25 p-2"
                key={activity.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-brand-navy px-2 py-1 font-mono text-[11px] font-semibold text-white">
                    {activity.method}
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-[11px] font-semibold ${
                      activity.failed
                        ? 'bg-status-warningSoft text-status-warning'
                        : 'bg-brand-greenSoft text-brand-navy'
                    }`}
                  >
                    {activity.statusCode ?? 'No status'}
                  </span>
                  <span className="rounded bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                    {activity.durationMs} ms
                  </span>
                  <time
                    className="text-[11px] text-muted-foreground"
                    dateTime={activity.timestampIso}
                  >
                    {new Date(activity.timestampIso).toLocaleTimeString()}
                  </time>
                </div>
                <code className="block break-all rounded bg-background/80 px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground">
                  {activity.path}
                </code>
                {activity.queryKeys.length > 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    Query keys:{' '}
                    <span className="font-mono">
                      {activity.queryKeys.join(', ')}
                    </span>
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Matched topic:
                  </span>
                  {activity.matchedTraceEntryId &&
                  activity.matchedTraceEntryLabel ? (
                    <button
                      className="rounded-full border border-brand-sky/40 bg-brand-skySoft/60 px-2 py-1 text-[11px] font-semibold text-brand-navy transition hover:bg-brand-skySoft"
                      onClick={() =>
                        onSelectedEntryIdChange(activity.matchedTraceEntryId!)
                      }
                      type="button"
                    >
                      {activity.matchedTraceEntryLabel}
                    </button>
                  ) : (
                    <span className="rounded-full border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                      Not matched
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <DefenseTraceCopyCommandButton
                    command={activity.path}
                    label="Copy API path"
                  />
                  <DefenseTraceCopyCommandButton
                    command={backendSearchCommand}
                    label="Copy backend search"
                  />
                  {activity.matchedTraceEntryId ? (
                    <DefenseTraceCopyCommandButton
                      command={traceCommand}
                      label="Trace command"
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/25 px-3 py-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            No API calls captured yet. Refresh this page or open a data page
            such as Dashboard, Customers, Vouchers, or Trial Balance.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Fallback command:
            </span>
            <DefenseTraceCopyCommandButton
              command={createDefenseTraceEntryApiFallbackCommand(selectedEntry)}
              label="Copy backend search"
            />
          </div>
        </div>
      )}
    </div>
  </details>
);

const TraceLayerLadder = ({ entry }: { entry: DefenseTraceEntry }) => {
  const layers = [
    {
      key: 'ui',
      label: 'UI',
      isPresent: entry.routePatterns.length > 0 || entry.uiTexts.length > 0,
      description: 'What the user sees/clicks.',
    },
    {
      key: 'frontend',
      label: 'Frontend',
      isPresent:
        entry.frontendRouteFiles.length > 0 ||
        entry.frontendFeatureFiles.length > 0,
      description: 'React/Next.js screen code.',
    },
    {
      key: 'api',
      label: 'API',
      isPresent: entry.frontendApiFiles.length > 0,
      description: 'REST helper/request boundary.',
    },
    {
      key: 'backend',
      label: 'Backend',
      isPresent: entry.backendFiles.length > 0,
      description: 'NestJS controller/service business logic.',
    },
    {
      key: 'data-model',
      label: 'Data Model',
      isPresent: entry.prismaModels.length > 0,
      description: 'Prisma/PostgreSQL structure.',
    },
  ];

  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Code2 className="h-4 w-4 text-brand-green" />
        Trace ladder
      </h3>
      <div className="grid gap-2 sm:grid-cols-5">
        {layers.map((layer, index) => (
          <div
            className={`rounded-lg border p-2 ${
              layer.isPresent
                ? 'border-brand-sky/45 bg-brand-skySoft/50'
                : 'border-border bg-muted/30 opacity-70'
            }`}
            key={layer.key}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground">
                {layer.label}
              </span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  layer.isPresent ? 'bg-brand-green' : 'bg-muted-foreground/40'
                }`}
              />
            </div>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              {layer.description}
            </p>
            {index < layers.length - 1 ? (
              <p className="mt-1 hidden text-center text-[10px] font-semibold text-brand-sky sm:block">
                to
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
};

const TraceEntryDetails = ({
  entry,
  workspaceRoot,
}: {
  entry: DefenseTraceEntry;
  workspaceRoot: string;
}) => (
  <div className="space-y-3">
    <section className="rounded-xl border border-brand-sky/30 bg-brand-skySoft/50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-navy px-2.5 py-1 text-xs font-semibold text-white">
          {formatCategory(entry.category)}
        </span>
        <span className="rounded-full border border-brand-sky/40 bg-background/80 px-2.5 py-1 text-xs font-semibold text-brand-navy">
          Presenter-safe
        </span>
      </div>
      <h2 className="mt-2 text-base font-semibold text-foreground">
        {entry.label}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-foreground">
        {entry.presenterSummary}
      </p>
    </section>

    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Route className="h-4 w-4 text-brand-sky" />
        Route patterns
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {entry.routePatterns.length > 0 ? (
          entry.routePatterns.map((pattern) => (
            <code
              className="rounded-full border border-border bg-muted/50 px-2 py-1 font-mono text-[11px] text-foreground"
              key={pattern}
            >
              {pattern}
            </code>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">
            No route pattern. This is a cross-cutting reference entry.
          </span>
        )}
      </div>
    </section>

    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Code2 className="h-4 w-4 text-brand-green" />
        Stack context
      </h3>
      <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
        {entry.stackContext}
      </p>
    </section>

    <TraceLayerLadder entry={entry} />

    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <FileCode2 className="h-4 w-4 text-brand-sky" />
        Source paths
      </h3>
      <PathGroup
        defaultOpen
        files={entry.frontendRouteFiles}
        title="Frontend route files"
        workspaceRoot={workspaceRoot}
      />
      <PathGroup
        defaultOpen={entry.frontendFeatureFiles.length <= 5}
        files={entry.frontendFeatureFiles}
        title="Frontend feature files"
        workspaceRoot={workspaceRoot}
      />
      <PathGroup
        defaultOpen={entry.frontendApiFiles.length <= 4}
        files={entry.frontendApiFiles}
        title="Frontend API files"
        workspaceRoot={workspaceRoot}
      />
      <PathGroup
        defaultOpen={entry.backendFiles.length > 0 && entry.backendFiles.length <= 5}
        files={entry.backendFiles}
        title="Backend files"
        workspaceRoot={workspaceRoot}
      />
    </section>

    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Database className="h-4 w-4 text-brand-green" />
        Prisma models
      </h3>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-muted/30 p-2">
        {entry.prismaModels.length > 0 ? (
          entry.prismaModels.map((model) => (
            <span
              className="rounded-full border border-border bg-background px-2 py-1 font-mono text-[11px] font-semibold text-foreground"
              key={model}
            >
              {model}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">
            No Prisma model is directly tied to this trace entry.
          </span>
        )}
      </div>
    </section>

    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Search className="h-4 w-4 text-brand-sky" />
        Search commands
      </h3>
      <SearchCommandList commands={entry.searchCommands} />
    </section>

    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Edit impact</h3>
      <ul className="space-y-1 rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
        {entry.editImpact.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>

    <details className="group rounded-xl border border-border bg-card/90">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-foreground">
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand-navy dark:text-brand-sky" />
          Study Notes
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-border p-3 text-sm leading-relaxed text-foreground">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Beginner explanation
          </h4>
          <p className="mt-1">{entry.beginnerExplanation}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Implementation notes
          </h4>
          <ul className="mt-1 space-y-1">
            {entry.implementationNotes.map((note) => (
              <li className="flex gap-2" key={note}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-sky" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Study notes
          </h4>
          <ul className="mt-1 space-y-1">
            {entry.studyNotes.map((note) => (
              <li className="flex gap-2" key={note}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Risk notes
          </h4>
          <ul className="mt-1 space-y-1">
            {entry.riskNotes.map((note) => (
              <li className="flex gap-2" key={note}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-status-warning" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  </div>
);

export const DefenseTracePanel = ({
  apiActivities,
  currentPathname,
  entries,
  isManualSelection,
  minimized,
  onClose,
  onCurrentRouteSelect,
  onApiActivitiesClear,
  onMinimizedChange,
  onPanelPositionChange,
  onSelectedEntryIdChange,
  onWorkspaceRootChange,
  panelPosition,
  routeMatch,
  selectedEntry,
  selectedEntryId,
  workspaceRoot,
}: {
  apiActivities: readonly DefenseTraceApiActivity[];
  currentPathname: string;
  entries: readonly DefenseTraceEntry[];
  isManualSelection: boolean;
  minimized: boolean;
  onClose: () => void;
  onCurrentRouteSelect: () => void;
  onApiActivitiesClear: () => void;
  onMinimizedChange: (minimized: boolean) => void;
  onPanelPositionChange: (panelPosition: DefenseTracePanelPosition) => void;
  onSelectedEntryIdChange: (entryId: string) => void;
  onWorkspaceRootChange: (workspaceRoot: string) => void;
  panelPosition: DefenseTracePanelPosition;
  routeMatch: DefenseTraceRouteMatch | null;
  selectedEntry: DefenseTraceEntry | null;
  selectedEntryId: string;
  workspaceRoot: string;
}) => {
  const [topicSearch, setTopicSearch] = useState('');
  const filteredEntries = useMemo(
    () => searchDefenseTraceEntries(topicSearch, entries),
    [entries, topicSearch],
  );

  if (minimized) {
    return (
      <div
        className={`fixed z-[90] w-[min(360px,calc(100vw-2rem))] rounded-xl border border-brand-sky/40 bg-card p-3 text-card-foreground shadow-2xl shadow-black/20 ${getMinimizedPositionClassName(panelPosition)}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Defense Trace
            </p>
            <p className="truncate text-sm font-semibold">
              {routeMatch?.entry.label ?? 'No route match'}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold hover:bg-muted"
              onClick={() => onMinimizedChange(false)}
              type="button"
            >
              Expand
            </button>
            <button
              aria-label="Close Defense Trace"
              className="rounded-md border border-border bg-background p-1.5 hover:bg-muted"
              onClick={onClose}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside
      className={`fixed z-[90] flex flex-col overflow-hidden rounded-2xl border border-brand-sky/40 bg-card text-card-foreground shadow-2xl shadow-black/20 ${getPanelPositionClassName(panelPosition)}`}
    >
      <header className="border-b border-border bg-gradient-to-r from-brand-navy via-brand-blue to-brand-green p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
              Professional trace overlay
            </p>
            <h1 className="mt-1 text-lg font-semibold">Defense Trace</h1>
            <p className="mt-1 text-sm text-white/85">
              Read-only route-to-source guide for the current ERP screen.
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              aria-label="Minimize Defense Trace"
              className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
              onClick={() => onMinimizedChange(true)}
              type="button"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              aria-label="Close Defense Trace"
              className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <section className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Route className="h-4 w-4 text-brand-sky" />
            Current route
          </div>
          <code className="block break-all rounded bg-background/80 px-2 py-1 font-mono text-xs text-foreground">
            {currentPathname}
          </code>
          {routeMatch ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Matched{' '}
                <span className="font-semibold text-foreground">
                  {routeMatch.entry.label}
                </span>{' '}
                through pattern{' '}
                <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">
                  {routeMatch.pattern}
                </code>
                .
              </p>
              {isManualSelection ? (
                <button
                  className="rounded-md border border-brand-sky/40 bg-brand-skySoft/60 px-2.5 py-1 text-xs font-semibold text-brand-navy transition hover:bg-brand-skySoft"
                  onClick={onCurrentRouteSelect}
                  type="button"
                >
                  Back to current route
                </button>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No route-specific trace entry matched this page. Use visible page
              text with repository search, or use the browser Network tab to
              identify the API helper path.
            </p>
          )}
        </section>

        <RecentApiActivity
          activities={apiActivities}
          onClear={onApiActivitiesClear}
          onSelectedEntryIdChange={onSelectedEntryIdChange}
          selectedEntry={selectedEntry}
        />

        <section className="space-y-3 rounded-xl border border-border bg-card p-3">
          <label
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
            htmlFor="defense-trace-search"
          >
            <Search className="h-4 w-4 text-brand-green" />
            Topic search
          </label>
          <input
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/25"
            id="defense-trace-search"
            onChange={(event) => setTopicSearch(event.target.value)}
            placeholder="Search dashboard, voucher, prisma, role..."
            type="search"
            value={topicSearch}
          />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {filteredEntries.length} trace topic
              {filteredEntries.length === 1 ? '' : 's'} available.
            </p>
            <div className="max-h-44 space-y-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const isSelected = entry.id === selectedEntryId;

                  return (
                    <button
                      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? 'border-brand-green/50 bg-brand-greenSoft/70 text-foreground'
                          : 'border-border bg-muted/25 text-foreground hover:border-brand-sky/50 hover:bg-brand-skySoft/45'
                      }`}
                      key={entry.id}
                      onClick={() => onSelectedEntryIdChange(entry.id)}
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {entry.label}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {formatCategory(entry.category)}
                        </span>
                      </span>
                      {isSelected ? (
                        <span className="shrink-0 rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Active
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <p className="rounded-lg border border-dashed border-border bg-muted/25 px-3 py-3 text-sm text-muted-foreground">
                  No matching trace topic. Try a route label, visible screen
                  text, API term, or Prisma model name.
                </p>
              )}
            </div>
          </div>
        </section>

        <details className="group rounded-xl border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-brand-sky" />
              Workspace settings
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <div className="space-y-2 border-t border-border p-3">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor="defense-trace-panel-position"
              >
                Panel position
              </label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/25"
                id="defense-trace-panel-position"
                onChange={(event) =>
                  onPanelPositionChange(
                    event.target.value as DefenseTracePanelPosition,
                  )
                }
                value={panelPosition}
              >
                <option value="right">Right</option>
                <option value="left">Left</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
            <label
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              htmlFor="defense-trace-workspace-root"
            >
              Workspace root
            </label>
            <input
              className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/25"
              id="defense-trace-workspace-root"
              onChange={(event) => onWorkspaceRootChange(event.target.value)}
              placeholder="Set repository root for this machine"
              type="text"
              value={workspaceRoot}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Set this once per machine. Example: your local repository root.
              The value is stored only in this browser's localStorage.
            </p>
          </div>
        </details>

        {selectedEntry ? (
          <TraceEntryDetails entry={selectedEntry} workspaceRoot={workspaceRoot} />
        ) : (
          <section className="rounded-xl border border-dashed border-brand-sky/40 bg-brand-skySoft/40 p-4 text-sm leading-relaxed text-foreground">
            <p className="font-semibold">No trace entry selected.</p>
            <p className="mt-1 text-muted-foreground">
              Search by visible page text in the repository, or use the browser
              Network tab to identify which API helper is active for this
              screen.
            </p>
          </section>
        )}
      </div>

      <footer className="border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        Press Ctrl + Alt + T to toggle Defense Trace. If a browser or system
        shortcut conflicts, open the page with `?trace=1`. This overlay is
        local, read-only, and hidden during normal demos unless enabled.
      </footer>
    </aside>
  );
};
