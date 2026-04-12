import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { DependencyCheckResult } from '../common/interfaces/dependency-check.interface';
import storageConfig, { type StorageConfig } from '../config/storage.config';

@Injectable()
export class StorageService implements OnModuleDestroy {
  private readonly client: S3Client;
  private readonly presignClient: S3Client;

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
    this.presignClient =
      this.config.publicEndpoint === this.config.endpoint
        ? this.client
        : new S3Client({
            endpoint: this.config.publicEndpoint,
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

  async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.config.bucket,
        }),
      );
    } catch {
      await this.client.send(
        new CreateBucketCommand({
          Bucket: this.config.bucket,
        }),
      );
    }
  }

  async createPresignedUploadUrl(input: {
    key: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<string> {
    return getSignedUrl(
      this.presignClient,
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: input.key,
        ContentType: input.contentType,
      }),
      {
        expiresIn: input.expiresInSeconds,
      },
    );
  }

  async createPresignedDownloadUrl(input: {
    key: string;
    contentDispositionFileName: string;
    expiresInSeconds: number;
  }): Promise<string> {
    return getSignedUrl(
      this.presignClient,
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: input.key,
        ResponseContentDisposition: this.buildContentDisposition(
          input.contentDispositionFileName,
        ),
      }),
      {
        expiresIn: input.expiresInSeconds,
      },
    );
  }

  async headObject(key: string) {
    return this.client.send(
      new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );
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

    if (this.presignClient !== this.client) {
      this.presignClient.destroy();
    }
  }

  private buildContentDisposition(fileName: string): string {
    const sanitizedFileName = fileName.replace(/["\r\n]/g, '').trim() || 'file';

    return `attachment; filename="${sanitizedFileName}"`;
  }
}
