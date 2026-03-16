import type {
  DependencyCheckResult,
  DependencyCheckStatus,
} from '../common/interfaces/dependency-check.interface';

export interface HealthLivenessResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  checks: {
    runtime: DependencyCheckResult;
  };
}

export interface HealthReadinessResponse {
  status: DependencyCheckStatus;
  service: string;
  version: string;
  timestamp: string;
  checks: {
    runtime: DependencyCheckResult;
    database: DependencyCheckResult;
    storage: DependencyCheckResult;
  };
}
