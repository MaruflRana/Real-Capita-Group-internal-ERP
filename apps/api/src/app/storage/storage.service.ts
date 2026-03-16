import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

import type { DependencyCheckResult } from '../common/interfaces/dependency-check.interface';
import storageConfig, { type StorageConfig } from '../config/storage.config';

@Injectable()
export class StorageService implements OnModuleDestroy {
  private readonly client: S3Client;

  constructor(
    @Inject(storageConfig.KEY)
    private readonly config: StorageConfig,
  ) {
    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      forcePathStyle: this.config.forcePathStyle,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
    });
  }

  getClient(): S3Client {
    return this.client;
  }

  getBucketName(): string {
    return this.config.bucket;
  }

  async checkConnection(): Promise<DependencyCheckResult> {
    const startedAt = performance.now();

    try {
      await this.client.send(new ListBucketsCommand({}));

      return {
        status: 'ok',
        target: this.config.bucket,
        summary: `S3-compatible storage endpoint is reachable for configured bucket ${this.config.bucket}.`,
        latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      };
    } catch (error) {
      return {
        status: 'error',
        target: this.config.bucket,
        summary:
          error instanceof Error
            ? error.message
            : 'S3-compatible storage connectivity check failed.',
        latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      };
    }
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}
