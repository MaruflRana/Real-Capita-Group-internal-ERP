import { Injectable } from '@nestjs/common';

import { API_VERSION } from '@real-capita/config';
import type { HealthCheckResponse } from '@real-capita/types';

@Injectable()
export class HealthService {
  getStatus(): HealthCheckResponse {
    return {
      status: 'ok',
      service: 'api',
      version: `v${API_VERSION}`,
      timestamp: new Date().toISOString(),
    };
  }
}
