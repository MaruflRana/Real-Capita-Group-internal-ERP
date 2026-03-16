import { Inject, Injectable } from '@nestjs/common';

import { API_SERVICE_NAME } from '../common/constants/api.constants';
import type { DependencyCheckResult } from '../common/interfaces/dependency-check.interface';
import appConfig, { type AppConfig } from '../config/app.config';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';
import type {
  HealthLivenessResponse,
  HealthReadinessResponse,
} from './health.types';

@Injectable()
export class HealthService {
  constructor(
    @Inject(appConfig.KEY) private readonly config: AppConfig,
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  getLiveness(): HealthLivenessResponse {
    return {
      status: 'ok',
      service: API_SERVICE_NAME,
      version: `v${this.config.apiVersion}`,
      timestamp: new Date().toISOString(),
      checks: {
        runtime: this.createRuntimeCheck(),
      },
    };
  }

  async getReadiness(): Promise<HealthReadinessResponse> {
    const [database, storage] = await Promise.all([
      this.databaseService.checkConnection(),
      this.storageService.checkConnection(),
    ]);

    return this.createReadinessResponse(database, storage);
  }

  async getDependencies(): Promise<HealthReadinessResponse> {
    return this.getReadiness();
  }

  private createReadinessResponse(
    database: DependencyCheckResult,
    storage: DependencyCheckResult,
  ): HealthReadinessResponse {
    const runtime = this.createRuntimeCheck();
    const status =
      database.status === 'ok' && storage.status === 'ok' ? 'ok' : 'error';

    return {
      status,
      service: API_SERVICE_NAME,
      version: `v${this.config.apiVersion}`,
      timestamp: new Date().toISOString(),
      checks: {
        runtime,
        database,
        storage,
      },
    };
  }

  private createRuntimeCheck(): DependencyCheckResult {
    return {
      status: 'ok',
      target: this.config.nodeEnv,
      summary: `Application runtime is responsive. Process uptime ${Math.round(process.uptime())}s.`,
    };
  }
}
