import { defenseTraceRegistry } from './trace-registry';
import type {
  DefenseTraceEntry,
  DefenseTraceSelectedTarget,
  DefenseTraceTargetMatchReason,
} from './types';

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

const normalizePathValue = (value: string): string => {
  if (!value) {
    return '/';
  }

  const [pathOnly] = value.split(/[?#]/);
  const normalized = pathOnly?.startsWith('/') ? pathOnly : `/${pathOnly}`;

  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
};

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

interface DefenseTraceTargetMatchCandidate {
  entry: DefenseTraceEntry;
  exact: boolean;
  reason: DefenseTraceTargetMatchReason;
  score: number;
}

export interface DefenseTraceTargetMatch {
  entry: DefenseTraceEntry;
  exact: boolean;
  reason: DefenseTraceTargetMatchReason;
}

const scoreEntryTextMatch = (
  entry: DefenseTraceEntry,
  text: string,
): DefenseTraceTargetMatchCandidate | null => {
  const normalizedText = normalizeSearchValue(text);

  if (!normalizedText || normalizedText.length < 2) {
    return null;
  }

  const uiTextScore = entry.uiTexts.reduce<number>((bestScore, uiText) => {
    const normalizedUiText = normalizeSearchValue(uiText);

    if (!normalizedUiText) {
      return bestScore;
    }

    if (normalizedUiText === normalizedText) {
      return Math.max(bestScore, 7000 + normalizedUiText.length);
    }

    if (
      normalizedUiText.includes(normalizedText) ||
      normalizedText.includes(normalizedUiText)
    ) {
      return Math.max(bestScore, 6000 + normalizedUiText.length);
    }

    return bestScore;
  }, 0);

  if (uiTextScore > 0) {
    return {
      entry,
      exact: true,
      reason: 'ui-text',
      score: uiTextScore,
    };
  }

  const normalizedLabel = normalizeSearchValue(entry.label);

  if (normalizedLabel === normalizedText) {
    return {
      entry,
      exact: true,
      reason: 'trace-label',
      score: 5600 + normalizedLabel.length,
    };
  }

  if (
    normalizedLabel.includes(normalizedText) ||
    normalizedText.includes(normalizedLabel)
  ) {
    return {
      entry,
      exact: true,
      reason: 'trace-label',
      score: 5000 + normalizedLabel.length,
    };
  }

  const normalizedCategory = normalizeSearchValue(entry.category);

  if (normalizedCategory === normalizedText) {
    return {
      entry,
      exact: true,
      reason: 'trace-category',
      score: 4200 + normalizedCategory.length,
    };
  }

  return null;
};

export const matchDefenseTraceSelectedTarget = (
  target: DefenseTraceSelectedTarget,
  entries: readonly DefenseTraceEntry[] = defenseTraceRegistry,
): DefenseTraceTargetMatch | null => {
  if (target.traceEntryId) {
    const anchorEntry = entries.find((entry) => entry.id === target.traceEntryId);

    if (anchorEntry) {
      return {
        entry: anchorEntry,
        exact: true,
        reason: 'anchor',
      };
    }
  }

  const href = target.href ? normalizePathValue(target.href) : '';

  if (href) {
    const hrefMatch = matchDefenseTraceEntry(href, entries);

    if (hrefMatch) {
      return {
        entry: hrefMatch.entry,
        exact: true,
        reason: 'href-path',
      };
    }
  }

  const textCandidates = Array.from(
    new Set(
      [
        target.clickedText,
        target.selectedLabel,
        target.nearestHeading ?? '',
        target.nearestSection ?? '',
      ]
        .map(normalizeSearchValue)
        .filter(Boolean),
    ),
  );

  const textMatches = entries
    .flatMap((entry) =>
      textCandidates
        .map((candidate) => scoreEntryTextMatch(entry, candidate))
        .filter(
          (
            match,
          ): match is DefenseTraceTargetMatchCandidate => match !== null,
        ),
    )
    .sort((left, right) => right.score - left.score);

  const bestTextMatch = textMatches[0];

  if (bestTextMatch) {
    return {
      entry: bestTextMatch.entry,
      exact: bestTextMatch.exact,
      reason: bestTextMatch.reason,
    };
  }

  const currentRouteMatch = matchDefenseTraceEntry(target.currentRoute, entries);

  if (currentRouteMatch) {
    return {
      entry: currentRouteMatch.entry,
      exact: false,
      reason: 'route-fallback',
    };
  }

  return null;
};
