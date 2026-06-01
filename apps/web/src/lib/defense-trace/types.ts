export type DefenseTraceCategory =
  | 'accounting'
  | 'api-client'
  | 'attachments'
  | 'auth'
  | 'authorization'
  | 'crm'
  | 'dashboard'
  | 'database'
  | 'financial-reporting'
  | 'hr'
  | 'navigation'
  | 'payroll';

export type DefenseTraceOpenStrategy = 'vscode-file-uri';

export type DefenseTraceCopyStrategy =
  | 'absolute-path'
  | 'relative-path'
  | 'ripgrep'
  | 'vscode-cli';

export type DefenseTraceFutureAction =
  | 'copy-absolute-path'
  | 'copy-relative-path'
  | 'copy-ripgrep-command'
  | 'copy-vscode-cli-command'
  | 'open-vscode-file-uri';

export interface DefenseTraceFileReference {
  relativePath: string;
  line?: number;
  symbolName?: string;
  openStrategy: DefenseTraceOpenStrategy;
  copyStrategy: readonly DefenseTraceCopyStrategy[];
}

export interface DefenseTraceSearchCommand {
  label: string;
  command: string;
  scope?: string;
}

export interface DefenseTraceEntry {
  id: string;
  label: string;
  category: DefenseTraceCategory;
  routePatterns: readonly string[];
  apiPatterns?: readonly string[];
  uiTexts: readonly string[];
  frontendRouteFiles: readonly DefenseTraceFileReference[];
  frontendFeatureFiles: readonly DefenseTraceFileReference[];
  frontendApiFiles: readonly DefenseTraceFileReference[];
  backendFiles: readonly DefenseTraceFileReference[];
  prismaModels: readonly string[];
  searchCommands: readonly DefenseTraceSearchCommand[];
  presenterSummary: string;
  stackContext: string;
  beginnerExplanation: string;
  implementationNotes: readonly string[];
  editImpact: readonly string[];
  studyNotes: readonly string[];
  riskNotes: readonly string[];
}

export interface DefenseTraceWorkspaceSettings {
  workspaceRoot: string;
  storedAtIso: string;
}

export interface DefenseTraceResolvedFileTarget {
  relativePath: string;
  absolutePath: string;
  line?: number;
  symbolName?: string;
  vscodeUri: string;
  vscodeCliCommand: string;
  ripgrepCommand: string;
}

export interface DefenseTraceApiActivity {
  id: string;
  method: string;
  path: string;
  queryKeys: readonly string[];
  statusCode?: number;
  durationMs: number;
  timestampIso: string;
  failed: boolean;
  matchedTraceEntryId?: string;
  matchedTraceEntryLabel?: string;
  matchedApiPattern?: string;
}
