import process from 'node:process';
import { parseArgs } from 'node:util';
import {
  assertFileIsReadableBackup,
  forwardedArgs,
  formatBytes,
  relativeToRoot,
  runProcess,
} from './lib/ops.mjs';

const usage = `Usage: corepack pnpm verify:backup -- --file <backup-file>

Checks that a PostgreSQL backup file exists, is non-empty, and can be read by pg_restore.

Options:
  --file <path>       Backup file to verify. A positional file path is also accepted.
  --service <name>    Docker Compose PostgreSQL service used for pg_restore. Default: postgres
  --skip-metadata     Only check file existence and size; do not run pg_restore --list
  -h, --help          Show this help text
`;

const parseCliArguments = () => {
  const { values, positionals } = parseArgs({
    args: forwardedArgs(),
    options: {
      file: {
        type: 'string',
      },
      service: {
        type: 'string',
      },
      'skip-metadata': {
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
    service: values.service ?? 'postgres',
    skipMetadata: values['skip-metadata'] ?? false,
  };
};

const countRestoreEntries = (output) =>
  output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith(';')).length;

const main = async () => {
  const { file, service, skipMetadata } = parseCliArguments();

  if (!file) {
    throw new Error('A backup file path is required. Use --file <path>.');
  }

  const backup = assertFileIsReadableBackup(file);
  console.log(
    `[verify:backup] file ok: ${relativeToRoot(backup.absolutePath)} (${formatBytes(
      backup.size,
    )})`,
  );

  if (skipMetadata) {
    console.log('[verify:backup] metadata inspection skipped by request.');
    return;
  }

  const result = await runProcess({
    command: 'docker',
    args: ['compose', 'exec', '-T', service, 'pg_restore', '--list'],
    inputFile: backup.absolutePath,
    captureStdout: true,
  });
  const entryCount = countRestoreEntries(result.stdout);

  if (entryCount <= 0) {
    throw new Error('pg_restore metadata inspection found no restore entries.');
  }

  console.log(
    `[verify:backup] pg_restore metadata ok: ${entryCount} restore entries`,
  );
};

void main().catch((error) => {
  console.error(
    `[verify:backup] failed: ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
});
