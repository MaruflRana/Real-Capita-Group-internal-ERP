import process from 'node:process';
import { parseArgs } from 'node:util';
import {
  assertFileIsReadableBackup,
  forwardedArgs,
  formatBytes,
  parseEnvFile,
  relativeToRoot,
  requireEnvValues,
  runProcess,
} from './lib/ops.mjs';

const usage = `Usage: corepack pnpm restore:db -- --file <backup-file> --confirm-destroy-data

Restores a PostgreSQL custom-format dump into the running Docker Compose database.
This is destructive: the script drops and recreates the public schema before pg_restore.

Options:
  --file <path>              Backup file to restore. A positional file path is also accepted.
  --env-file <path>          Env file to validate before restore. Default: .env
  --service <name>           Docker Compose PostgreSQL service. Default: postgres
  --dry-run                  Validate the file and database reachability without changing data
  --confirm-destroy-data     Required for an actual restore
  --force                    Alias for --confirm-destroy-data
  -h, --help                 Show this help text
`;

const parseCliArguments = () => {
  const { values, positionals } = parseArgs({
    args: forwardedArgs(),
    options: {
      file: {
        type: 'string',
      },
      'env-file': {
        type: 'string',
      },
      service: {
        type: 'string',
      },
      'dry-run': {
        type: 'boolean',
      },
      'confirm-destroy-data': {
        type: 'boolean',
      },
      force: {
        type: 'boolean',
      },
      help: {
        type: 'boolean',
        short: 'h',
      },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(usage);
    process.exit(0);
  }

  return {
    file: values.file ?? positionals[0],
    envFile: values['env-file'] ?? '.env',
    service: values.service ?? 'postgres',
    dryRun: values['dry-run'] ?? false,
    confirmed:
      (values['confirm-destroy-data'] ?? false) || (values.force ?? false),
  };
};

const inspectBackup = async (service, backupPath) => {
  const result = await runProcess({
    command: 'docker',
    args: ['compose', 'exec', '-T', service, 'pg_restore', '--list'],
    inputFile: backupPath,
    captureStdout: true,
  });

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith(';')).length;
};

const main = async () => {
  const { file, envFile, service, dryRun, confirmed } = parseCliArguments();

  if (!file) {
    throw new Error('A backup file path is required. Use --file <path>.');
  }

  const env = parseEnvFile(envFile);
  requireEnvValues(env.values, [
    'POSTGRES_DB',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
  ]);

  const backup = assertFileIsReadableBackup(file);
  console.log(
    `[restore:db] backup file ok: ${relativeToRoot(
      backup.absolutePath,
    )} (${formatBytes(backup.size)})`,
  );

  await runProcess({
    command: 'docker',
    args: [
      'compose',
      'exec',
      '-T',
      service,
      'sh',
      '-c',
      'pg_isready --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"',
    ],
    captureStdout: true,
  });
  const entryCount = await inspectBackup(service, backup.absolutePath);
  console.log(`[restore:db] backup metadata ok: ${entryCount} restore entries`);

  if (dryRun) {
    console.log(
      '[restore:db] dry run complete. No database changes were made.',
    );
    return;
  }

  if (!confirmed) {
    throw new Error(
      'Restore refused. Re-run with --confirm-destroy-data after stopping application traffic and taking a fresh backup.',
    );
  }

  console.log(
    `[restore:db] destructive restore confirmed for database "${env.values.POSTGRES_DB}".`,
  );
  console.log(
    '[restore:db] dropping and recreating the public schema before pg_restore.',
  );

  await runProcess({
    command: 'docker',
    args: [
      'compose',
      'exec',
      '-T',
      service,
      'sh',
      '-c',
      'PGPASSWORD="$POSTGRES_PASSWORD" psql --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --set ON_ERROR_STOP=on --command "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"',
    ],
  });

  await runProcess({
    command: 'docker',
    args: [
      'compose',
      'exec',
      '-T',
      service,
      'sh',
      '-c',
      'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore --verbose --exit-on-error --single-transaction --no-owner --no-privileges --dbname="$POSTGRES_DB" --username="$POSTGRES_USER"',
    ],
    inputFile: backup.absolutePath,
  });

  console.log('[restore:db] restore completed successfully.');
  console.log(
    '[restore:db] next: run corepack pnpm docker:migrate, then corepack pnpm docker:smoke.',
  );
};

void main().catch((error) => {
  console.error(
    `[restore:db] failed: ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
});
