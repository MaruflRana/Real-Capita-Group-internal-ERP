import { defenseTraceRegistry } from './trace-registry';
import type { DefenseTraceApiActivity, DefenseTraceEntry } from './types';
import { DEFENSE_TRACE_ENABLED_STORAGE_KEY } from './workspace-root';

export const DEFENSE_TRACE_API_ACTIVITY_EVENT =
  'real-capita:defense-trace:api-activity';

const API_ACTIVITY_LIMIT = 20;

declare global {
  interface Window {
    __realCapitaDefenseTraceApiActivities?: DefenseTraceApiActivity[];
  }
}

const normalizeApiText = (value: string): string =>
  value.trim().toLowerCase().replace(/^\/+|\/+$/g, '');

const getApiPathSegments = (path: string): string[] => {
  const [pathOnly] = path.split('?');

  return normalizeApiText(pathOnly ?? '')
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment !== 'api' && segment !== 'v1');
};

const isDynamicApiSegment = (segment: string): boolean =>
  segment.startsWith(':') || (segment.startsWith('[') && segment.endsWith(']'));

const doesApiPatternMatch = (path: string, pattern: string): boolean => {
  const pathSegments = getApiPathSegments(path);
  const patternSegments = getApiPathSegments(pattern);

  if (patternSegments.length === 0) {
    return false;
  }

  for (
    let startIndex = 0;
    startIndex <= pathSegments.length - patternSegments.length;
    startIndex += 1
  ) {
    const candidate = pathSegments.slice(
      startIndex,
      startIndex + patternSegments.length,
    );

    const isMatch = patternSegments.every((segment, index) => {
      if (isDynamicApiSegment(segment)) {
        return true;
      }

      return segment === candidate[index];
    });

    if (isMatch) {
      return true;
    }
  }

  return normalizeApiText(path).includes(normalizeApiText(pattern));
};

export const matchDefenseTraceApiActivity = (
  path: string,
  entries: readonly DefenseTraceEntry[] = defenseTraceRegistry,
):
  | {
      entry: DefenseTraceEntry;
      pattern: string;
    }
  | null => {
  const matches = entries
    .flatMap((entry) =>
      (entry.apiPatterns ?? []).map((pattern) => ({
        entry,
        pattern,
        score:
          getApiPathSegments(pattern).length * 100 +
          normalizeApiText(pattern).length,
      })),
    )
    .filter((candidate) => doesApiPatternMatch(path, candidate.pattern))
    .sort((left, right) => right.score - left.score);

  const bestMatch = matches[0];

  return bestMatch
    ? {
        entry: bestMatch.entry,
        pattern: bestMatch.pattern,
      }
    : null;
};

export const limitDefenseTraceApiActivities = (
  activities: readonly DefenseTraceApiActivity[],
): readonly DefenseTraceApiActivity[] => activities.slice(0, API_ACTIVITY_LIMIT);

const addBufferedApiActivity = (activity: DefenseTraceApiActivity): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.__realCapitaDefenseTraceApiActivities = limitDefenseTraceApiActivities([
    activity,
    ...(window.__realCapitaDefenseTraceApiActivities ?? []),
  ]) as DefenseTraceApiActivity[];
};

export const readDefenseTraceBufferedApiActivities =
  (): readonly DefenseTraceApiActivity[] => {
    if (typeof window === 'undefined') {
      return [];
    }

    return window.__realCapitaDefenseTraceApiActivities ?? [];
  };

export const clearDefenseTraceBufferedApiActivities = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.__realCapitaDefenseTraceApiActivities = [];
};

const isApiCaptureEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const searchParams = new URLSearchParams(window.location.search);

    return (
      searchParams.get('trace') === '1' ||
      window.localStorage.getItem(DEFENSE_TRACE_ENABLED_STORAGE_KEY) === 'true'
    );
  } catch {
    return false;
  }
};

const getElapsedMs = (startedAtMs: number): number => {
  const now =
    typeof performance === 'undefined' ? Date.now() : performance.now();

  return Math.max(0, Math.round(now - startedAtMs));
};

const createActivityId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const sanitizeApiPath = (
  resourceOrUrl: string,
): {
  path: string;
  queryKeys: readonly string[];
} => {
  try {
    const url = new URL(resourceOrUrl, 'http://defense-trace.local');
    const queryKeys = Array.from(new Set(url.searchParams.keys()));
    const querySuffix =
      queryKeys.length > 0
        ? `?${queryKeys.map((key) => encodeURIComponent(key)).join('&')}`
        : '';

    return {
      path: `${url.pathname}${querySuffix}`,
      queryKeys,
    };
  } catch {
    const [pathOnly, queryString] = resourceOrUrl.split('?');
    const queryKeys = Array.from(
      new Set(new URLSearchParams(queryString ?? '').keys()),
    );
    const normalizedPath = pathOnly?.startsWith('/')
      ? pathOnly
      : `/${pathOnly ?? ''}`;
    const querySuffix =
      queryKeys.length > 0
        ? `?${queryKeys.map((key) => encodeURIComponent(key)).join('&')}`
        : '';

    return {
      path: `${normalizedPath}${querySuffix}`,
      queryKeys,
    };
  }
};

export const createDefenseTraceApiSearchCommand = (
  activity: Pick<DefenseTraceApiActivity, 'path' | 'matchedApiPattern'>,
): string => {
  const searchTerm =
    activity.matchedApiPattern ??
    getApiPathSegments(activity.path).find(
      (segment) =>
        segment !== 'companies' && !/^[0-9a-f-]{8,}$/i.test(segment),
    ) ??
    activity.path.split('?')[0] ??
    activity.path;

  return `rg "${searchTerm.replace(/"/g, '\\"')}" apps/web/src apps/api/src`;
};

export const createDefenseTraceMatchedTraceCommand = (
  activity: Pick<
    DefenseTraceApiActivity,
    'matchedTraceEntryId' | 'matchedTraceEntryLabel' | 'matchedApiPattern' | 'path'
  >,
): string => {
  const searchTerm =
    activity.matchedApiPattern ??
    activity.matchedTraceEntryId ??
    activity.matchedTraceEntryLabel ??
    activity.path.split('?')[0] ??
    activity.path;

  return `rg "${searchTerm.replace(/"/g, '\\"')}" apps/web/src apps/api/src`;
};

export const createDefenseTraceEntryApiFallbackCommand = (
  entry: DefenseTraceEntry | null,
): string => {
  const searchTerm =
    entry?.apiPatterns?.[0] ??
    entry?.searchCommands[0]?.command.match(/rg "([^"]+)"/)?.[1] ??
    entry?.label ??
    'apiRequest';

  return `rg "${searchTerm.replace(/"/g, '\\"')}" apps/web/src apps/api/src`;
};

export const emitDefenseTraceApiActivity = ({
  durationMs,
  failed,
  method,
  resourceOrUrl,
  statusCode,
}: {
  durationMs: number;
  failed: boolean;
  method: string;
  resourceOrUrl: string;
  statusCode?: number;
}): void => {
  if (!isApiCaptureEnabled() || typeof window === 'undefined') {
    return;
  }

  const sanitized = sanitizeApiPath(resourceOrUrl);
  const match = matchDefenseTraceApiActivity(sanitized.path);
  const detail: DefenseTraceApiActivity = {
    id: createActivityId(),
    method: method.toUpperCase(),
    path: sanitized.path,
    queryKeys: sanitized.queryKeys,
    ...(statusCode === undefined ? {} : { statusCode }),
    durationMs,
    timestampIso: new Date().toISOString(),
    failed,
    ...(match
      ? {
          matchedTraceEntryId: match.entry.id,
          matchedTraceEntryLabel: match.entry.label,
          matchedApiPattern: match.pattern,
        }
      : {}),
  };

  addBufferedApiActivity(detail);

  window.dispatchEvent(
    new CustomEvent<DefenseTraceApiActivity>(
      DEFENSE_TRACE_API_ACTIVITY_EVENT,
      {
        detail,
      },
    ),
  );
};

export const getDefenseTraceApiDurationMs = getElapsedMs;
