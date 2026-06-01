import { defenseTraceRegistry } from './trace-registry';
import type { DefenseTraceEntry } from './types';

export interface DefenseTraceRouteMatch {
  entry: DefenseTraceEntry;
  pattern: string;
  score: number;
}

interface PatternMatch {
  pattern: string;
  score: number;
  isGlobalFallback: boolean;
}

const normalizePathname = (pathname: string): string => {
  if (!pathname) {
    return '/';
  }

  const [pathOnly] = pathname.split(/[?#]/);
  const normalized = pathOnly?.startsWith('/') ? pathOnly : `/${pathOnly}`;

  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
};

const getPathSegments = (pathname: string): string[] =>
  normalizePathname(pathname).split('/').filter(Boolean);

const isDynamicSegment = (segment: string): boolean =>
  segment.startsWith('[') && segment.endsWith(']');

const matchPattern = (pathname: string, pattern: string): PatternMatch | null => {
  const currentPath = normalizePathname(pathname);
  const routePattern = normalizePathname(pattern);

  if (routePattern === '/*') {
    return {
      pattern,
      score: 1,
      isGlobalFallback: true,
    };
  }

  if (currentPath === routePattern) {
    return {
      pattern,
      score: 10000 + routePattern.length,
      isGlobalFallback: false,
    };
  }

  if (routePattern.endsWith('/*')) {
    const prefix = routePattern.slice(0, -2);

    if (currentPath === prefix || currentPath.startsWith(`${prefix}/`)) {
      return {
        pattern,
        score: 2000 + prefix.length,
        isGlobalFallback: false,
      };
    }

    return null;
  }

  const patternSegments = getPathSegments(routePattern);

  if (!patternSegments.some((segment) => isDynamicSegment(segment))) {
    return null;
  }

  const currentSegments = getPathSegments(currentPath);

  if (patternSegments.length !== currentSegments.length) {
    return null;
  }

  let score = 4000;

  for (const [index, segment] of patternSegments.entries()) {
    const currentSegment = currentSegments[index];

    if (isDynamicSegment(segment)) {
      score += 5;
      continue;
    }

    if (segment !== currentSegment) {
      return null;
    }

    score += segment.length * 20;
  }

  return {
    pattern,
    score,
    isGlobalFallback: false,
  };
};

export const matchDefenseTraceEntry = (
  pathname: string,
  entries: readonly DefenseTraceEntry[] = defenseTraceRegistry,
): DefenseTraceRouteMatch | null => {
  const matches = entries
    .flatMap((entry) =>
      entry.routePatterns.map((pattern) => ({
        entry,
        patternMatch: matchPattern(pathname, pattern),
      })),
    )
    .filter(
      (
        match,
      ): match is {
        entry: DefenseTraceEntry;
        patternMatch: PatternMatch;
      } => match.patternMatch !== null && !match.patternMatch.isGlobalFallback,
    )
    .sort((left, right) => right.patternMatch.score - left.patternMatch.score);

  const bestMatch = matches[0];

  if (!bestMatch) {
    return null;
  }

  return {
    entry: bestMatch.entry,
    pattern: bestMatch.patternMatch.pattern,
    score: bestMatch.patternMatch.score,
  };
};

const normalizeSearchValue = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const getEntrySearchText = (entry: DefenseTraceEntry): string =>
  [
    entry.label,
    entry.category,
    ...entry.routePatterns,
    ...(entry.apiPatterns ?? []),
    ...entry.uiTexts,
    ...entry.prismaModels,
    ...entry.searchCommands.flatMap((command) => [
      command.label,
      command.command,
      command.scope ?? '',
    ]),
    entry.presenterSummary,
    entry.stackContext,
  ]
    .join(' ')
    .toLowerCase();

export const searchDefenseTraceEntries = (
  query: string,
  entries: readonly DefenseTraceEntry[] = defenseTraceRegistry,
): readonly DefenseTraceEntry[] => {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return entries;
  }

  const terms = normalizedQuery.split(' ').filter(Boolean);

  return entries.filter((entry) => {
    const searchText = getEntrySearchText(entry);

    return terms.every((term) => searchText.includes(term));
  });
};
