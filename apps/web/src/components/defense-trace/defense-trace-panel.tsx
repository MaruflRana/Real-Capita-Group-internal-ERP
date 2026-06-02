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
import { resolveRouteSource, type RouteSourceResolverResult } from '../../lib/defense-trace/route-source-resolver';
import type {
  DefenseTraceApiActivity,
  DefenseTraceEntry,
  DefenseTraceFileReference,
  DefenseTraceQuestionAngle,
  DefenseTraceSearchCommand,
  DefenseTraceSelectedTarget,
} from '../../lib/defense-trace/types';
import { buildAbsolutePath } from '../../lib/defense-trace/workspace-root';
import {
  DefenseTraceCopyCommandButton,
  DefenseTraceFileActions,
  DefenseTraceOpenFirstFile,
} from './defense-trace-actions';

const formatCategory = (category: string): string =>
  category
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const formatSelectionSource = (source: string): string => {
  if (source === 'anchor') return 'anchor';
  if (source === 'auto') return 'auto';
  if (source === 'route') return 'route';
  if (source === 'search') return 'search';
  if (source === 'api') return 'API';
  return source;
};

const formatMatchReason = (reason?: string): string => {
  if (reason === 'href-path') return 'link route';
  if (reason === 'route-fallback') return 'current route fallback';
  if (reason === 'trace-category') return 'trace category';
  if (reason === 'trace-label') return 'trace label';
  if (reason === 'ui-text') return 'UI text';
  if (reason === 'anchor') return 'trace anchor';
  return 'not matched';
};

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

const CollapsedSection = ({
  children,
  count,
  defaultOpen = false,
  title,
}: {
  children: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  title: string;
}) => (
  <details
    className="group rounded-lg border border-border bg-card/80"
    open={defaultOpen}
  >
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-foreground">
      <span>
        {title}
        {count !== undefined ? (
          <span className="text-xs font-normal text-muted-foreground">
            {' '}({count})
          </span>
        ) : null}
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
    </summary>
    <div className="space-y-2 border-t border-border p-2">
      {children}
    </div>
  </details>
);

const PathList = ({
  files,
  workspaceRoot,
}: {
  files: readonly DefenseTraceFileReference[];
  workspaceRoot: string;
}) => (
  <div className="space-y-2">
    {files.length > 0 ? (
      files.map((file) => (
        <DefenseTraceFileActions
          file={file}
          key={`${file.relativePath}-${file.line ?? 'root'}`}
          workspaceRoot={workspaceRoot}
        />
      ))
    ) : (
      <p className="rounded-md bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
        No registered files for this group.
      </p>
    )}
  </div>
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

const QUESTION_ANGLES: readonly {
  id: DefenseTraceQuestionAngle;
  label: string;
}[] = [
  { id: 'ui-frontend', label: 'UI code' },
  { id: 'api-call', label: 'Data/API' },
  { id: 'backend-logic', label: 'Backend logic' },
  { id: 'database-model', label: 'Database model' },
  { id: 'full-flow', label: 'Full flow' },
];

const getAngleTitle = (angle: DefenseTraceQuestionAngle): string => {
  if (angle === 'api-call') return 'Open Data/API code';
  if (angle === 'backend-logic') return 'Backend logic';
  if (angle === 'database-model') return 'Database models';
  if (angle === 'full-flow') return 'Full code flow';
  return 'Open UI code';
};

const getAngleExplanation = (
  angle: DefenseTraceQuestionAngle,
  entry: DefenseTraceEntry,
): string => {
  if (angle === 'api-call') {
    return 'Start at the frontend API helper, then use recent captured paths or search commands to connect the screen to REST requests.';
  }

  if (angle === 'backend-logic') {
    return entry.backendFiles.length > 0
      ? 'Start at the NestJS controller or service registered for this topic.'
      : 'No exact backend file is registered yet, so use the backend search command as the safe next step.';
  }

  if (angle === 'database-model') {
    return entry.prismaModels.length > 0
      ? 'Start with the Prisma model names and schema search so the data structure is easy to explain.'
      : 'This topic has no Prisma model registered yet; explain it as frontend or API focused unless a backend search finds a model.';
  }

  if (angle === 'full-flow') {
    return 'Open the chain in order: UI file, API helper, backend logic if registered, then Prisma model search.';
  }

  return 'Start with the React/Next.js screen file that renders the selected UI.';
};

const createPrismaSchemaFile = (
  entry: DefenseTraceEntry,
): DefenseTraceFileReference | null => {
  if (entry.prismaModels.length === 0) {
    return null;
  }

  const primaryModel = entry.prismaModels[0];

  return {
    relativePath: 'prisma/schema.prisma',
    ...(primaryModel ? { symbolName: primaryModel } : {}),
    rolePurpose: 'Database schema/model',
    openStrategy: 'vscode-file-uri',
    copyStrategy: ['relative-path', 'absolute-path', 'vscode-cli', 'ripgrep'],
  };
};

const dedupeFiles = (
  files: readonly (DefenseTraceFileReference | null | undefined)[],
): DefenseTraceFileReference[] => {
  const seen = new Set<string>();

  return files.filter((file): file is DefenseTraceFileReference => {
    if (!file) {
      return false;
    }

    const key = `${file.relativePath}:${file.line ?? ''}:${file.symbolName ?? ''}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const getQuestionAngleFiles = (
  entry: DefenseTraceEntry,
  angle: DefenseTraceQuestionAngle,
): DefenseTraceFileReference[] => {
  const frontendFiles = dedupeFiles([
    entry.primaryFrontendFile,
    ...entry.frontendRouteFiles,
    ...entry.frontendFeatureFiles,
  ]);
  const prismaSchemaFile = createPrismaSchemaFile(entry);

  if (angle === 'api-call') {
    return dedupeFiles(entry.frontendApiFiles);
  }

  if (angle === 'backend-logic') {
    return dedupeFiles(entry.backendFiles);
  }

  if (angle === 'database-model') {
    return dedupeFiles([prismaSchemaFile]);
  }

  if (angle === 'full-flow') {
    return dedupeFiles([
      frontendFiles[0],
      ...entry.frontendApiFiles,
      ...entry.backendFiles,
      prismaSchemaFile,
    ]);
  }

  return frontendFiles;
};

const escapeDoubleQuotes = (value: string): string => value.replace(/"/g, '\\"');

const normalizeRoutePath = (pathname: string): string => {
  const [pathOnly] = pathname.split(/[?#]/);
  const normalized = pathOnly?.startsWith('/') ? pathOnly : `/${pathOnly ?? ''}`;

  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
};

const getTargetRoutePath = (
  currentPathname: string,
  selectedTarget: DefenseTraceSelectedTarget | null,
): string => {
  const href = selectedTarget?.href;

  if (href?.startsWith('/')) {
    return normalizeRoutePath(href);
  }

  return normalizeRoutePath(currentPathname);
};

const createLikelyFrontendRouteFile = (routePath: string): string => {
  const normalizedPath = normalizeRoutePath(routePath);
  const appGroup = normalizedPath === '/login' ? '(public)' : '(app)';

  if (normalizedPath === '/') {
    return `apps/web/src/app/${appGroup}/page.tsx`;
  }

  return `apps/web/src/app/${appGroup}${normalizedPath}/page.tsx`;
};

const getRouteSearchSegment = (routePath: string): string => {
  const segments = normalizeRoutePath(routePath).split('/').filter(Boolean);

  return segments.at(-1) ?? segments.at(0) ?? 'dashboard';
};

const createFallbackClickedTextCommand = (
  selectedTarget: DefenseTraceSelectedTarget,
): string => {
  const searchTerm =
    selectedTarget.clickedText ||
    selectedTarget.selectedLabel ||
    selectedTarget.nearestHeading ||
    selectedTarget.currentRoute;

  return `git grep -n "${escapeDoubleQuotes(searchTerm)}" -- apps/web/src apps/api/src prisma`;
};

const createFallbackRouteSearchCommand = (routePath: string): string =>
  `git grep -n "${escapeDoubleQuotes(getRouteSearchSegment(routePath))}" -- apps/web/src apps/api/src prisma`;

const createOpenAllCommand = (
  files: readonly DefenseTraceFileReference[],
  workspaceRoot: string,
): string | null => {
  const targets = files
    .map((file) => {
      const absolutePath = buildAbsolutePath(workspaceRoot, file.relativePath);

      if (!absolutePath) {
        return null;
      }

      return file.line ? `${absolutePath}:${file.line}` : absolutePath;
    })
    .filter((target): target is string => Boolean(target));

  if (targets.length === 0) {
    return null;
  }

  return `code -g ${targets
    .map((target) => `"${escapeDoubleQuotes(target)}"`)
    .join(' ')}`;
};

const createAngleSearchCommand = ({
  angle,
  clickedLabel,
  entry,
}: {
  angle: DefenseTraceQuestionAngle;
  clickedLabel: string;
  entry: DefenseTraceEntry;
}): string => {
  const labelTerm =
    clickedLabel || entry.uiTexts[0] || entry.label || entry.id;
  const escapedLabel = escapeDoubleQuotes(labelTerm);

  if (angle === 'api-call') {
    const apiTerm = entry.apiPatterns?.[0] ?? entry.id;

    return `git grep -n "${escapeDoubleQuotes(apiTerm)}" -- apps/web/src/lib/api apps/web/src/features apps/api/src`;
  }

  if (angle === 'backend-logic') {
    return `git grep -n "${escapeDoubleQuotes(entry.id)}" -- apps/api/src apps/web/src/lib/api`;
  }

  if (angle === 'database-model') {
    const model = entry.prismaModels[0] ?? entry.label;

    return `git grep -n "model ${escapeDoubleQuotes(model)}" -- prisma`;
  }

  if (angle === 'full-flow') {
    return `git grep -n "${escapeDoubleQuotes(entry.id)}" -- apps/web/src apps/api/src prisma`;
  }

  return `git grep -n "${escapedLabel}" -- apps/web/src apps/api/src prisma`;
};

const getMatchingApiActivities = (
  entry: DefenseTraceEntry,
  activities: readonly DefenseTraceApiActivity[],
): DefenseTraceApiActivity[] =>
  activities
    .filter(
      (activity) =>
        activity.matchedTraceEntryId === entry.id ||
        entry.apiPatterns?.some((pattern) =>
          activity.path.toLowerCase().includes(pattern.toLowerCase()),
        ),
    )
    .slice(0, 3);

const QuestionAngleSelector = ({
  questionAngle,
  onQuestionAngleChange,
}: {
  questionAngle: DefenseTraceQuestionAngle;
  onQuestionAngleChange: (questionAngle: DefenseTraceQuestionAngle) => void;
}) => (
  <section className="rounded-xl border border-border bg-card/90 p-3">
    <p className="text-sm font-semibold text-foreground">
      Trace focus
    </p>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {QUESTION_ANGLES.map((angle) => {
        const isActive = questionAngle === angle.id;

        return (
          <button
            className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
              isActive
                ? 'border-brand-green/60 bg-brand-greenSoft text-brand-navy'
                : 'border-border bg-muted/25 text-foreground hover:border-brand-sky/50 hover:bg-brand-skySoft/45'
            }`}
            key={angle.id}
            onClick={() => onQuestionAngleChange(angle.id)}
            type="button"
          >
            {angle.label}
          </button>
        );
      })}
    </div>
  </section>
);

const FlowStep = ({
  files,
  label,
  models,
  workspaceRoot,
}: {
  files?: readonly DefenseTraceFileReference[];
  label: string;
  models?: readonly string[];
  workspaceRoot: string;
}) => (
  <div className="rounded-lg border border-border bg-muted/25 p-2">
    <p className="text-xs font-semibold text-foreground">{label}</p>
    {files && files.length > 0 ? (
      <div className="mt-2 space-y-2">
        {files.slice(0, 2).map((file) => (
          <DefenseTraceFileActions
            file={file}
            key={`${label}-${file.relativePath}-${file.line ?? 'root'}`}
            workspaceRoot={workspaceRoot}
          />
        ))}
      </div>
    ) : models && models.length > 0 ? (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {models.map((model) => (
          <span
            className="rounded-full border border-border bg-background px-2 py-1 font-mono text-[11px] font-semibold text-foreground"
            key={model}
          >
            {model}
          </span>
        ))}
      </div>
    ) : (
      <p className="mt-1 text-[11px] text-muted-foreground">
        No registered item for this layer.
      </p>
    )}
  </div>
);

const ApiActivityPreview = ({
  activities,
}: {
  activities: readonly DefenseTraceApiActivity[];
}) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold text-foreground">
      Recent matching API calls
    </p>
    {activities.length > 0 ? (
      <div className="space-y-1.5">
        {activities.map((activity) => (
          <div
            className="rounded-lg border border-border bg-background/70 p-2"
            key={activity.id}
          >
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded bg-brand-navy px-1.5 py-0.5 font-mono font-semibold text-white">
                {activity.method}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground">
                {activity.statusCode ?? 'No status'}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground">
                {activity.durationMs} ms
              </span>
            </div>
            <code className="mt-1 block break-all font-mono text-[11px] text-foreground">
              {activity.path}
            </code>
          </div>
        ))}
      </div>
    ) : (
      <p className="rounded-lg border border-dashed border-border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
        No matching API calls captured yet. Refresh this page or open the related data page.
      </p>
    )}
  </div>
);

const QuestionAngleAnswerCard = ({
  apiActivities,
  clickedLabel,
  entry,
  onWorkspaceRootChange,
  questionAngle,
  workspaceRoot,
}: {
  apiActivities: readonly DefenseTraceApiActivity[];
  clickedLabel: string;
  entry: DefenseTraceEntry;
  onWorkspaceRootChange: (workspaceRoot: string) => void;
  questionAngle: DefenseTraceQuestionAngle;
  workspaceRoot: string;
}) => {
  const angleFiles = getQuestionAngleFiles(entry, questionAngle);
  const primaryFile = angleFiles[0] ?? null;
  const openAllCommand =
    angleFiles.length > 1 ? createOpenAllCommand(angleFiles, workspaceRoot) : null;
  const searchCommand = createAngleSearchCommand({
    angle: questionAngle,
    clickedLabel,
    entry,
  });
  const matchingApiActivities = getMatchingApiActivities(entry, apiActivities);

  return (
    <section className="space-y-3 rounded-xl border border-brand-green/30 bg-brand-greenSoft/40 p-3">
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileCode2 className="h-4 w-4 text-brand-green" />
          {getAngleTitle(questionAngle)}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {getAngleExplanation(questionAngle, entry)}
        </p>
      </div>

      {primaryFile ? (
        <DefenseTraceOpenFirstFile
          file={primaryFile}
          onWorkspaceRootChange={onWorkspaceRootChange}
          primaryActionLabel="Open primary"
          workspaceRoot={workspaceRoot}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/25 px-3 py-3 text-sm text-muted-foreground">
          No primary file is registered for this angle. Use the search command below.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <DefenseTraceCopyCommandButton
          command={searchCommand}
          label="Copy search"
        />
        {angleFiles.length > 1 && openAllCommand ? (
          <DefenseTraceCopyCommandButton
            command={openAllCommand}
            label="Copy Open all command"
          />
        ) : angleFiles.length > 1 ? (
          <span className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            Set project root to copy Open all relevant files command.
          </span>
        ) : null}
      </div>

      {questionAngle === 'database-model' && entry.prismaModels.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">
            Prisma models
          </p>
          <div className="flex flex-wrap gap-1.5">
            {entry.prismaModels.map((model) => (
              <span
                className="rounded-full border border-border bg-background px-2 py-1 font-mono text-[11px] font-semibold text-foreground"
                key={model}
              >
                {model}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {questionAngle === 'api-call' ? (
        <ApiActivityPreview activities={matchingApiActivities} />
      ) : null}

      {questionAngle === 'full-flow' ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">
            Ordered code flow
          </p>
          <div className="space-y-2">
            <FlowStep
              files={dedupeFiles([entry.primaryFrontendFile])}
              label="UI file"
              workspaceRoot={workspaceRoot}
            />
            <FlowStep
              files={entry.frontendApiFiles}
              label="API helper"
              workspaceRoot={workspaceRoot}
            />
            <FlowStep
              files={entry.backendFiles}
              label="Backend controller/service"
              workspaceRoot={workspaceRoot}
            />
            <FlowStep
              label="Database model"
              models={entry.prismaModels}
              workspaceRoot={workspaceRoot}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
};

const AutoFallbackTraceCard = ({
  currentPathname,
  selectedTarget,
}: {
  currentPathname: string;
  selectedTarget: DefenseTraceSelectedTarget;
}) => {
  const routePath = getTargetRoutePath(currentPathname, selectedTarget);
  const routeSourceResult = resolveRouteSource(
    routePath,
    selectedTarget.clickedText ?? selectedTarget.selectedLabel,
  );
  const clickedTextCommand = createFallbackClickedTextCommand(selectedTarget);
  const routeSearchCommand = createFallbackRouteSearchCommand(routePath);

  if (routeSourceResult) {
    return (
      <section className="space-y-3 rounded-xl border border-brand-sky/40 bg-brand-skySoft/30 p-3">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Search className="h-4 w-4 text-brand-sky" />
            Inferred source guide
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            No exact trace topic matched. Source locations inferred from current route.
          </p>
        </div>

        <div className="grid gap-2 text-xs text-muted-foreground">
          <div>
            Selected UI label:{' '}
            <span className="font-semibold text-foreground">
              {selectedTarget.selectedLabel}
            </span>
          </div>
          <div>
            Current route:{' '}
            <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-foreground">
              {currentPathname}
            </code>
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-background/70 p-2">
            <p className="text-xs font-semibold text-foreground">
              Likely UI route
            </p>
            <code className="mt-1 block break-all rounded bg-muted/40 px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground">
              {routeSourceResult.likelyRouteFile}
            </code>
          </div>

          <div className="rounded-lg border border-border bg-background/70 p-2">
            <p className="text-xs font-semibold text-foreground">
              Likely feature area
            </p>
            <code className="mt-1 block break-all rounded bg-muted/40 px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground">
              {routeSourceResult.likelyFeatureFolder}
            </code>
          </div>

          <div className="rounded-lg border border-border bg-background/70 p-2">
            <p className="text-xs font-semibold text-foreground">
              Likely API helper
            </p>
            <code className="mt-1 block break-all rounded bg-muted/40 px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground">
              {routeSourceResult.likelyApiHelper}
            </code>
          </div>

          {routeSourceResult.backendCandidates.length > 0 ? (
            <div className="rounded-lg border border-border bg-background/70 p-2">
              <p className="text-xs font-semibold text-foreground">
                Backend search
              </p>
              <div className="mt-1 space-y-1">
                {routeSourceResult.backendCandidates.map((candidate) => (
                  <code
                    className="block break-all rounded bg-muted/40 px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground"
                    key={candidate}
                  >
                    {candidate}
                  </code>
                ))}
              </div>
            </div>
          ) : null}

          {routeSourceResult.prismaModels.length > 0 ? (
            <div className="rounded-lg border border-border bg-background/70 p-2">
              <p className="text-xs font-semibold text-foreground">
                Data models
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {routeSourceResult.prismaModels.map((model) => (
                  <span
                    className="rounded-full border border-border bg-background px-2 py-1 font-mono text-[11px] font-semibold text-foreground"
                    key={model}
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          {routeSourceResult.gitGrepCommands.map((grepCommand) => (
            <div
              className="rounded-lg border border-border bg-background/70 p-2"
              key={`${grepCommand.label}-${grepCommand.command}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                  {grepCommand.label}
                </p>
                <DefenseTraceCopyCommandButton
                  command={grepCommand.command}
                  label="Copy"
                />
              </div>
              <code className="mt-2 block break-all rounded bg-muted/40 px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground">
                {grepCommand.command}
              </code>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-status-warning/40 bg-status-warning/10 p-3">
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Search className="h-4 w-4 text-status-warning" />
          Start from selected UI
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          No exact trace topic matched. Start with UI text search or current route file.
        </p>
      </div>

      <div className="grid gap-2 text-xs text-muted-foreground">
        <div>
          Selected UI label:{' '}
          <span className="font-semibold text-foreground">
            {selectedTarget.selectedLabel}
          </span>
        </div>
        <div>
          Current route:{' '}
          <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-foreground">
            {currentPathname}
          </code>
        </div>
        <div>
          Likely frontend route file:{' '}
          <code className="break-all rounded bg-background/80 px-1.5 py-0.5 font-mono text-foreground">
            {createLikelyFrontendRouteFile(routePath)}
          </code>
        </div>
      </div>

      <div className="space-y-2">
        <div className="rounded-lg border border-border bg-background/70 p-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">
              Search clicked text
            </p>
            <DefenseTraceCopyCommandButton
              command={clickedTextCommand}
              label="Copy"
            />
          </div>
          <code className="mt-2 block break-all rounded bg-muted/40 px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground">
            {clickedTextCommand}
          </code>
        </div>

        <div className="rounded-lg border border-border bg-background/70 p-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">
              Search route segment
            </p>
            <DefenseTraceCopyCommandButton
              command={routeSearchCommand}
              label="Copy"
            />
          </div>
          <code className="mt-2 block break-all rounded bg-muted/40 px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground">
            {routeSearchCommand}
          </code>
        </div>
      </div>
    </section>
  );
};

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
  <CollapsedSection count={activities.length} title="Recent API Activity">
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="inline-flex rounded-full border border-brand-green/30 bg-brand-greenSoft px-2 py-1 text-[11px] font-semibold text-brand-navy">
            Trace capture active
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Metadata-only request trace. Method, path, status, duration, and matched topic.
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
  </CollapsedSection>
);

const TraceLayerLadder = ({ entry }: { entry: DefenseTraceEntry }) => {
  const layers = [
    {
      key: 'ui',
      label: 'UI',
      isPresent: entry.routePatterns.length > 0 || entry.uiTexts.length > 0,
      description: 'What the user sees or clicks.',
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
      description: 'NestJS business logic.',
    },
    {
      key: 'data-model',
      label: 'Database',
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

export const DefenseTracePanel = ({
  apiActivities,
  clickedKind,
  clickedLabel,
  currentPathname,
  entries,
  isManualSelection,
  minimized,
  inspectorMode,
  onClose,
  onClosePanelKeepEnabled,
  onCurrentRouteSelect,
  onApiActivitiesClear,
  onInspectorModeChange,
  onMinimizedChange,
  onPanelPositionChange,
  onQuestionAngleChange,
  onSelectedEntryIdChange,
  onWorkspaceRootChange,
  panelPosition,
  questionAngle,
  routeMatch,
  selectedEntry,
  selectedEntryId,
  selectedTarget,
  selectionSource,
  workspaceRoot,
}: {
  apiActivities: readonly DefenseTraceApiActivity[];
  clickedKind: string;
  clickedLabel: string;
  currentPathname: string;
  entries: readonly DefenseTraceEntry[];
  isManualSelection: boolean;
  minimized: boolean;
  inspectorMode: boolean;
  onClose: () => void;
  onClosePanelKeepEnabled: () => void;
  onCurrentRouteSelect: () => void;
  onApiActivitiesClear: () => void;
  onInspectorModeChange: (inspectorMode: boolean) => void;
  onMinimizedChange: (minimized: boolean) => void;
  onPanelPositionChange: (panelPosition: DefenseTracePanelPosition) => void;
  onQuestionAngleChange: (questionAngle: DefenseTraceQuestionAngle) => void;
  onSelectedEntryIdChange: (entryId: string) => void;
  onWorkspaceRootChange: (workspaceRoot: string) => void;
  panelPosition: DefenseTracePanelPosition;
  questionAngle: DefenseTraceQuestionAngle;
  routeMatch: DefenseTraceRouteMatch | null;
  selectedEntry: DefenseTraceEntry | null;
  selectedEntryId: string;
  selectedTarget: DefenseTraceSelectedTarget | null;
  selectionSource: string;
  workspaceRoot: string;
}) => {
  const [topicSearch, setTopicSearch] = useState('');
  const filteredEntries = useMemo(
    () => searchDefenseTraceEntries(topicSearch, entries),
    [entries, topicSearch],
  );
  const selectedUiLabel =
    selectedTarget?.selectedLabel ||
    clickedLabel ||
    selectedEntry?.label ||
    routeMatch?.entry.label ||
    'No selection';
  const selectedUiKind =
    selectedTarget?.selectedKind || clickedKind || 'trace topic';
  const shouldShowFallbackCard =
    Boolean(selectedTarget) && selectedTarget?.hasExactTraceMatch === false;

  if (minimized) {
    return (
      <div
        className={`fixed z-[90] w-[min(360px,calc(100vw-2rem))] rounded-xl border border-brand-sky/40 bg-card p-3 text-card-foreground shadow-2xl shadow-black/20 ${getMinimizedPositionClassName(panelPosition)}`}
        data-defense-trace-panel="true"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Defense Trace
            </p>
            <p className="truncate text-sm font-semibold">
              {selectedUiLabel}
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
      data-defense-trace-panel="true"
    >
      <header className="border-b border-border bg-gradient-to-r from-brand-navy via-brand-blue to-brand-green p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
              Defense Trace
            </p>
            <h1 className="mt-1 text-lg font-semibold">Code Inspector</h1>
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

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {/* A. Inspector instruction */}
        {inspectorMode ? (
          <div className="rounded-xl border border-brand-sky/30 bg-brand-skySoft/50 px-3 py-2.5 text-sm text-foreground">
            <p className="font-semibold">Click any UI part to trace its code.</p>
            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                checked={inspectorMode}
                className="h-3.5 w-3.5 accent-brand-sky"
                onChange={(event) => onInspectorModeChange(event.target.checked)}
                type="checkbox"
              />
              Inspector Mode ON - click-to-trace is active
            </label>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                checked={inspectorMode}
                className="h-3.5 w-3.5 accent-brand-sky"
                onChange={(event) => onInspectorModeChange(event.target.checked)}
                type="checkbox"
              />
              Inspector Mode OFF - turn on to inspect visible UI parts
            </label>
          </div>
        )}

        <section className="rounded-xl border border-brand-sky/30 bg-brand-skySoft/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-brand-sky" />
            <span className="text-sm font-semibold text-foreground">Selected UI</span>
          </div>
          {selectedEntry || selectedTarget ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {selectedEntry ? (
                  <span className="rounded-full bg-brand-navy px-2.5 py-1 text-xs font-semibold text-white">
                    {formatCategory(selectedEntry.category)}
                  </span>
                ) : null}
                <span className="text-sm font-semibold text-foreground">
                  {selectedUiLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Selected UI: <span className="font-semibold text-foreground">{selectedUiLabel}</span>
                </span>
                <span>
                  Kind: <span className="font-semibold text-foreground">{selectedUiKind}</span>
                </span>
                <span>
                  Matched by: <span className="font-semibold text-foreground">{formatSelectionSource(selectionSource)}</span>
                </span>
                {selectedTarget ? (
                  <span>
                    Match: <span className="font-semibold text-foreground">{formatMatchReason(selectedTarget.matchReason)}</span>
                  </span>
                ) : null}
                {selectedTarget?.traceEntryId ? (
                  <span>
                    Trace id: <span className="font-mono font-semibold text-foreground">{selectedTarget.traceEntryId}</span>
                  </span>
                ) : null}
                {selectedTarget?.clickedText ? (
                  <span>
                    Clicked text: <span className="font-semibold text-foreground">{selectedTarget.clickedText}</span>
                  </span>
                ) : null}
                <span>
                  Trace topic: <span className="font-semibold text-foreground">{selectedEntry?.label ?? 'No exact topic'}</span>
                </span>
              </div>
              {selectedTarget?.nearestHeading ? (
                <p className="text-xs text-muted-foreground">
                  Nearest heading:{' '}
                  <span className="font-semibold text-foreground">
                    {selectedTarget.nearestHeading}
                  </span>
                </p>
              ) : null}
              {selectedEntry ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedEntry.routePatterns.map((pattern) => (
                    <code
                      className="rounded-full border border-brand-sky/35 bg-background px-2 py-0.5 font-mono text-[11px] text-foreground"
                      key={pattern}
                    >
                      {pattern}
                    </code>
                  ))}
                </div>
              ) : null}
              <code className="block break-all rounded bg-background/80 px-2 py-1 font-mono text-[11px] text-foreground">
                {currentPathname}
              </code>
              {selectedTarget?.href ? (
                <code className="block break-all rounded bg-background/80 px-2 py-1 font-mono text-[11px] text-foreground">
                  Link target: {selectedTarget.href}
                </code>
              ) : null}
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
            <div className="space-y-1">
              <code className="block break-all rounded bg-background/80 px-2 py-1 font-mono text-[11px] text-foreground">
                {currentPathname}
              </code>
              <p className="text-sm text-muted-foreground">
                No route-specific trace entry matched this page. Use topic search below or enable Inspector Mode to click UI parts.
              </p>
            </div>
          )}
        </section>

        {selectedEntry || selectedTarget ? (
          <QuestionAngleSelector
            onQuestionAngleChange={onQuestionAngleChange}
            questionAngle={questionAngle}
          />
        ) : null}

        {selectedTarget && shouldShowFallbackCard ? (
          <AutoFallbackTraceCard
            currentPathname={currentPathname}
            selectedTarget={selectedTarget}
          />
        ) : selectedEntry ? (
          <QuestionAngleAnswerCard
            apiActivities={apiActivities}
            clickedLabel={selectedTarget?.selectedLabel ?? clickedLabel}
            entry={selectedEntry}
            onWorkspaceRootChange={onWorkspaceRootChange}
            questionAngle={questionAngle}
            workspaceRoot={workspaceRoot}
          />
        ) : null}

        {/* D. Trace ladder */}
        {selectedEntry ? (
          <TraceLayerLadder entry={selectedEntry} />
        ) : null}

        {/* E. Collapsed sections */}
        {selectedEntry ? (
          <>
            <CollapsedSection
              count={
                dedupeFiles([
                  ...selectedEntry.frontendRouteFiles,
                  ...selectedEntry.frontendFeatureFiles,
                ]).length
              }
              defaultOpen={false}
              title="More frontend files"
            >
              <PathList
                files={dedupeFiles([
                  ...selectedEntry.frontendRouteFiles,
                  ...selectedEntry.frontendFeatureFiles,
                ])}
                workspaceRoot={workspaceRoot}
              />
            </CollapsedSection>

            {selectedEntry.frontendApiFiles.length > 0 ? (
              <CollapsedSection count={selectedEntry.frontendApiFiles.length} defaultOpen={false} title="API helper files">
                <PathList files={selectedEntry.frontendApiFiles} workspaceRoot={workspaceRoot} />
              </CollapsedSection>
            ) : null}

            {selectedEntry.backendFiles.length > 0 ? (
              <CollapsedSection count={selectedEntry.backendFiles.length} defaultOpen={false} title="Backend files">
                <PathList files={selectedEntry.backendFiles} workspaceRoot={workspaceRoot} />
              </CollapsedSection>
            ) : null}

            {selectedEntry.prismaModels.length > 0 ? (
              <CollapsedSection defaultOpen={false} title="Database models">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 p-1">
                    {selectedEntry.prismaModels.map((model) => (
                      <span
                        className="rounded-full border border-border bg-background px-2 py-1 font-mono text-[11px] font-semibold text-foreground"
                        key={model}
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                  <DefenseTraceCopyCommandButton
                    command={createAngleSearchCommand({
                      angle: 'database-model',
                      clickedLabel,
                      entry: selectedEntry,
                    })}
                    label="Copy search"
                  />
                </div>
              </CollapsedSection>
            ) : null}

            <RecentApiActivity
              activities={apiActivities}
              onClear={onApiActivitiesClear}
              onSelectedEntryIdChange={onSelectedEntryIdChange}
              selectedEntry={selectedEntry}
            />

            <CollapsedSection count={filteredEntries.length} defaultOpen={false} title="Topic search">
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/25"
                  id="defense-trace-search"
                  onChange={(event) => setTopicSearch(event.target.value)}
                  placeholder="Search dashboard, voucher, prisma, role..."
                  type="search"
                  value={topicSearch}
                />
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
                      No matching trace topic.
                    </p>
                  )}
                </div>
              </div>
            </CollapsedSection>

            <CollapsedSection defaultOpen={false} title="Study Notes / Implementation Notes">
              <div className="space-y-3 p-1 text-sm leading-relaxed text-foreground">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Presenter summary
                  </h4>
                  <p className="mt-1 rounded-lg border border-border bg-muted/30 p-3">{selectedEntry.presenterSummary}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Stack context
                  </h4>
                  <p className="mt-1 rounded-lg border border-border bg-muted/30 p-3">{selectedEntry.stackContext}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Beginner explanation
                  </h4>
                  <p className="mt-1">{selectedEntry.beginnerExplanation}</p>
                </div>

                {selectedEntry.searchCommands.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Search commands
                    </h4>
                    <SearchCommandList commands={selectedEntry.searchCommands} />
                  </div>
                ) : null}

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Edit impact
                  </h4>
                  <ul className="space-y-1 mt-1 rounded-lg border border-border bg-muted/30 p-3">
                    {selectedEntry.editImpact.map((item) => (
                      <li className="flex gap-2" key={item}>
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedEntry.implementationNotes.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Implementation Notes
                    </h4>
                    <ul className="mt-1 space-y-1">
                      {selectedEntry.implementationNotes.map((note) => (
                        <li className="flex gap-2" key={note}>
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-sky" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {selectedEntry.studyNotes.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Study notes
                    </h4>
                    <ul className="mt-1 space-y-1">
                      {selectedEntry.studyNotes.map((note) => (
                        <li className="flex gap-2" key={note}>
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {selectedEntry.riskNotes.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Risk notes
                    </h4>
                    <ul className="mt-1 space-y-1">
                      {selectedEntry.riskNotes.map((note) => (
                        <li className="flex gap-2" key={note}>
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-status-warning" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </CollapsedSection>
          </>
        ) : (
          <>
            <RecentApiActivity
              activities={apiActivities}
              onClear={onApiActivitiesClear}
              onSelectedEntryIdChange={onSelectedEntryIdChange}
              selectedEntry={selectedEntry}
            />

            <CollapsedSection count={filteredEntries.length} defaultOpen={true} title="Topic search">
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/25"
                  id="defense-trace-search"
                  onChange={(event) => setTopicSearch(event.target.value)}
                  placeholder="Search dashboard, voucher, prisma, role..."
                  type="search"
                  value={topicSearch}
                />
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
                      No matching trace topic.
                    </p>
                  )}
                </div>
              </div>
            </CollapsedSection>
          </>
        )}

        <details className="group rounded-xl border border-border bg-card/90">
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
              Set this once per machine. The value is stored only in this browser localStorage.
            </p>
          </div>
        </details>
      </div>

      <footer className="border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        Press Ctrl + Alt + T to toggle. This overlay is local, read-only, and hidden during normal use unless enabled.
      </footer>
    </aside>
  );
};
