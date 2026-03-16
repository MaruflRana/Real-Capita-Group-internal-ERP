import { Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';

import type { DependencyCheckResult } from '../common/interfaces/dependency-check.interface';
import { PrismaService } from './prisma.service';

export type DatabaseTransactionClient = Prisma.TransactionClient;

@Injectable()
export class DatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  getClient(): PrismaClient {
    return this.prisma;
  }

  async checkConnection(): Promise<DependencyCheckResult> {
    const startedAt = performance.now();

    try {
      await this.prisma.$queryRaw(Prisma.sql`SELECT 1`);

      return {
        status: 'ok',
        target: 'postgresql',
        summary: 'Prisma connectivity check to PostgreSQL succeeded.',
        latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      };
    } catch (error) {
      return {
        status: 'error',
        target: 'postgresql',
        summary:
          error instanceof Error
            ? error.message
            : 'Prisma connectivity check to PostgreSQL failed.',
        latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      };
    }
  }

  async withTransaction<T>(
    operation: (transaction: DatabaseTransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction((transaction) => operation(transaction));
  }

  async queryRaw<T>(query: Prisma.Sql): Promise<T[]> {
    return this.prisma.$queryRaw<T[]>(query);
  }

  async executeRaw(query: Prisma.Sql): Promise<number> {
    return this.prisma.$executeRaw(query);
  }
}
