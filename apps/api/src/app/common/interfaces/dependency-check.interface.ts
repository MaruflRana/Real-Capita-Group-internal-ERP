export type DependencyCheckStatus = 'ok' | 'error';

export interface DependencyCheckResult {
  status: DependencyCheckStatus;
  target: string;
  summary: string;
  latencyMs?: number;
}
