export interface HealthCheckResponse {
  status: 'ok';
  service: 'api';
  version: string;
  timestamp: string;
}
