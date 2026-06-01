import type {
  DefenseTraceFileReference,
  DefenseTraceResolvedFileTarget,
  DefenseTraceWorkspaceSettings,
} from './types';

export const DEFENSE_TRACE_ENABLED_STORAGE_KEY =
  'real-capita:defense-trace:enabled';

export const DEFENSE_TRACE_WORKSPACE_ROOT_STORAGE_KEY =
  'real-capita:defense-trace:workspace-root';

export const normalizeWorkspaceRoot = (workspaceRoot: string): string =>
  workspaceRoot
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\\/]+$/, '');

export const normalizeRelativePath = (relativePath: string): string =>
  relativePath.trim().replace(/^[/\\]+/, '').replace(/\\/g, '/');

const getPathSeparator = (workspaceRoot: string): '\\' | '/' =>
  workspaceRoot.includes('\\') ? '\\' : '/';

const escapeDoubleQuotes = (value: string): string => value.replace(/"/g, '\\"');

const createVscodeUri = (absolutePath: string, line?: number): string => {
  const normalizedPath = absolutePath.replace(/\\/g, '/');
  const encodedPath = encodeURI(normalizedPath)
    .replace(/#/g, '%23')
    .replace(/\?/g, '%3F')
    .replace(/'/g, '%27');

  return `vscode://file/${encodedPath}${line ? `:${line}` : ''}`;
};

const createVscodeCliCommand = (absolutePath: string, line?: number): string => {
  const target = line ? `${absolutePath}:${line}` : absolutePath;

  return `code -g "${escapeDoubleQuotes(target)}"`;
};

const createRipgrepCommand = (fileReference: DefenseTraceFileReference): string => {
  if (fileReference.symbolName) {
    return `rg "${escapeDoubleQuotes(fileReference.symbolName)}" "${escapeDoubleQuotes(fileReference.relativePath)}"`;
  }

  return `rg --files | rg "${escapeDoubleQuotes(fileReference.relativePath)}"`;
};

const createGitGrepCommand = (fileReference: DefenseTraceFileReference): string => {
  if (fileReference.symbolName) {
    return `git grep -n "${escapeDoubleQuotes(fileReference.symbolName)}" -- apps/web/src apps/api/src`;
  }

  return `git grep -n "${escapeDoubleQuotes(fileReference.relativePath)}" -- apps/web/src apps/api/src`;
};

export const buildAbsolutePath = (
  workspaceRoot: string,
  relativePath: string,
): string | null => {
  const normalizedRoot = normalizeWorkspaceRoot(workspaceRoot);

  if (!normalizedRoot) {
    return null;
  }

  const normalizedRelativePath = normalizeRelativePath(relativePath);
  const separator = getPathSeparator(normalizedRoot);

  return `${normalizedRoot}${separator}${normalizedRelativePath.replace(
    /\//g,
    separator,
  )}`;
};

export const resolveDefenseTraceFileTarget = (
  fileReference: DefenseTraceFileReference,
  workspaceRoot: string,
): DefenseTraceResolvedFileTarget | null => {
  const absolutePath = buildAbsolutePath(
    workspaceRoot,
    fileReference.relativePath,
  );

  if (!absolutePath) {
    return null;
  }

  return {
    relativePath: fileReference.relativePath,
    absolutePath,
    ...(fileReference.line === undefined ? {} : { line: fileReference.line }),
    ...(fileReference.symbolName
      ? { symbolName: fileReference.symbolName }
      : {}),
    vscodeUri: createVscodeUri(absolutePath, fileReference.line),
    vscodeCliCommand: createVscodeCliCommand(absolutePath, fileReference.line),
    ripgrepCommand: createRipgrepCommand(fileReference),
    gitGrepCommand: createGitGrepCommand(fileReference),
  };
};

export const readDefenseTraceWorkspaceSettings =
  (): DefenseTraceWorkspaceSettings | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const rawValue = window.localStorage.getItem(
        DEFENSE_TRACE_WORKSPACE_ROOT_STORAGE_KEY,
      );

      if (!rawValue) {
        return null;
      }

      const parsedValue = JSON.parse(rawValue) as Partial<DefenseTraceWorkspaceSettings>;
      const workspaceRoot =
        typeof parsedValue.workspaceRoot === 'string'
          ? normalizeWorkspaceRoot(parsedValue.workspaceRoot)
          : '';

      if (!workspaceRoot) {
        return null;
      }

      return {
        workspaceRoot,
        storedAtIso:
          typeof parsedValue.storedAtIso === 'string'
            ? parsedValue.storedAtIso
            : new Date().toISOString(),
      };
    } catch {
      return null;
    }
  };

export const writeDefenseTraceWorkspaceSettings = (
  workspaceRoot: string,
): DefenseTraceWorkspaceSettings | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const normalizedRoot = normalizeWorkspaceRoot(workspaceRoot);

  if (!normalizedRoot) {
    try {
      window.localStorage.removeItem(DEFENSE_TRACE_WORKSPACE_ROOT_STORAGE_KEY);
    } catch {
      return null;
    }

    return null;
  }

  const settings: DefenseTraceWorkspaceSettings = {
    workspaceRoot: normalizedRoot,
    storedAtIso: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      DEFENSE_TRACE_WORKSPACE_ROOT_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch {
    return null;
  }

  return settings;
};
