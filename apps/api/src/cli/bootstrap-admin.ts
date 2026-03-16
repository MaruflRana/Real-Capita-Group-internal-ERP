import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { parseArgs } from 'node:util';

import { AuthBootstrapService } from '../app/auth/auth-bootstrap.service';
import { AuthRepository } from '../app/auth/auth.repository';
import { PasswordService } from '../app/auth/password.service';
import { getValidatedEnvironment } from '../app/config/env.validation';
import { DatabaseService } from '../app/database/database.service';
import { PrismaService } from '../app/database/prisma.service';

const logger = new Logger('BootstrapAdminCli');
const ENVIRONMENT_FILE_PATHS = [
  'apps/api/.env.local',
  'apps/api/.env',
  '.env.local',
  '.env',
];

const parseCliArguments = () => {
  const { values } = parseArgs({
    options: {
      'company-name': {
        type: 'string',
      },
      'company-slug': {
        type: 'string',
      },
      'admin-email': {
        type: 'string',
      },
      'admin-password': {
        type: 'string',
      },
      help: {
        type: 'boolean',
        short: 'h',
      },
    },
    allowPositionals: false,
  });

  if (values.help) {
    logger.log(
      'Usage: corepack pnpm auth:bootstrap -- --company-name "<name>" --company-slug "<slug>" --admin-email "<email>" --admin-password "<password>"',
    );

    process.exit(0);
  }

  return {
    companyName: values['company-name'],
    companySlug: values['company-slug'],
    adminEmail: values['admin-email'],
    adminPassword: values['admin-password'],
  };
};

const requireArgument = (
  value: string | undefined,
  key: string,
): string => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`${key} is required.`);
  }

  return normalizedValue;
};

const parseEnvironmentFile = (filePath: string): Record<string, string> => {
  const fileContent = readFileSync(filePath, 'utf8');
  const entries: Record<string, string> = {};

  for (const line of fileContent.split(/\r?\n/u)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
};

const loadEnvironmentFiles = (): void => {
  const externallyDefinedKeys = new Set(Object.keys(process.env));

  for (const filePath of [...ENVIRONMENT_FILE_PATHS].reverse()) {
    const absoluteFilePath = resolve(filePath);

    if (!existsSync(absoluteFilePath)) {
      continue;
    }

    const parsedEntries = parseEnvironmentFile(absoluteFilePath);

    for (const [key, value] of Object.entries(parsedEntries)) {
      if (externallyDefinedKeys.has(key)) {
        continue;
      }

      process.env[key] = value;
    }
  }
};

const bootstrap = async () => {
  loadEnvironmentFiles();
  getValidatedEnvironment(process.env);

  const cliArguments = parseCliArguments();
  const prismaService = new PrismaService();

  await prismaService.$connect();

  try {
    const authBootstrapService = new AuthBootstrapService(
      new AuthRepository(prismaService),
      new PasswordService(),
      new DatabaseService(prismaService),
    );
    const result = await authBootstrapService.bootstrapAdmin({
      companyName: requireArgument(cliArguments.companyName, '--company-name'),
      companySlug: requireArgument(cliArguments.companySlug, '--company-slug'),
      adminEmail: requireArgument(cliArguments.adminEmail, '--admin-email'),
      adminPassword: requireArgument(
        cliArguments.adminPassword,
        '--admin-password',
      ),
    });

    logger.log('Bootstrap completed successfully.');
    logger.log(JSON.stringify(result, null, 2));
  } finally {
    await prismaService.$disconnect();
  }
};

void bootstrap().catch((error: unknown) => {
  logger.error(
    error instanceof Error ? error.message : 'Bootstrap failed.',
    error instanceof Error ? error.stack : undefined,
  );

  process.exit(1);
});
