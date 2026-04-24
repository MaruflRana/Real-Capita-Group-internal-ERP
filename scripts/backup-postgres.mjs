import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import {
  assertFileIsReadableBackup,
  forwardedArgs,
  formatBytes,
  parseEnvFile,
  relativeToRoot,
  requireEnvValues,
  resolveFromRoot,
  runProcess,
  sanitizeFilePart,
  timestampForFile,
} from './lib/ops.mjs';

const usage = `Usage: corepack pnpm backup:db [-- --output-dir backups/postgres]

Creates a timestamped PostgreSQL custom-format dump from the running Docker Compose postgres service.

Options:
  --env-file <path>      Env file to validate before backup. Default: .env
  --output-dir <path>    Backup output directory. Default: backups/postgres
  --service <name>       Docker Compose PostgreSQL service. Default: postgres
  -h, --help             Show this help text
`;

const parseCliArguments = () => {
  const { values } = parseArgs({
    args: forwardedArgs(),
    options: {
      'env-file': {
        type: 'string',
      },
      'output-dir': {
        type: 'string',
      },
      service: {
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
    console.log(usage);
    process.exit(0);
  }

  return values;
};

const main = async () => {
  const values = parseCliArguments();
  const env = parseEnvFile(values['env-file'] ?? '.env');
  requireEnvValues(env.values, [
    'POSTGRES_DB',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
  ]);

  const service = values.service ?? 'postgres';
  const outputDir = path.resolve(
    resolveFromRoot(),
    values['output-dir'] ??
      env.values.POSTGRES_BACKUP_DIR ??
      'backups/postgres',
  );
  mkdirSync(outputDir, { recursive: true });

  const backupFile = path.join(
    outputDir,
    `${sanitizeFilePart(env.values.POSTGRES_DB)}-${timestampForFile()}.dump`,
  );

  console.log(
    `[backup:db] creating PostgreSQL backup from Compose service "${service}"`,
  );
  console.log(`[backup:db] target: ${relativeToRoot(backupFile)}`);

  try {
    await runProcess({
      command: 'docker',
      args: [
        'compose',
        'exec',
        '-T',
        service,
        'sh',
        '-c',
        'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --format=custom --no-owner --no-privileges --dbname="$POSTGRES_DB" --username="$POSTGRES_USER"',
      ],
      stdoutFile: backupFile,
    });
  } catch (error) {
    rmSync(backupFile, { force: true });
    throw error;
  }

  const backup = assertFileIsReadableBackup(backupFile);
  console.log(
    `[backup:db] success: ${relativeToRoot(backup.absolutePath)} (${formatBytes(
      backup.size,
    )})`,
  );
};

void main().catch((error) => {
  console.error(
    `[backup:db] failed: ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
});
