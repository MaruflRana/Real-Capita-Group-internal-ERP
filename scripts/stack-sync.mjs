import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { parseArgs } from 'node:util';

const useShell = process.platform === 'win32';
const corepackCommand = 'corepack';

const quoteArgument = (argument) => {
  if (!/[^\w./:-]/.test(argument)) {
    return argument;
  }

  return `"${argument.replace(/"/g, '\\"')}"`;
};

const runSpawnSync = (command, args, options) => {
  if (!useShell) {
    return spawnSync(command, args, options);
  }

  return spawnSync(
    [command, ...args].map(quoteArgument).join(' '),
    {
      ...options,
      shell: true,
    },
  );
};

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'skip-pull': {
      type: 'boolean',
    },
    'skip-install': {
      type: 'boolean',
    },
    'skip-migrate': {
      type: 'boolean',
    },
    'skip-smoke': {
      type: 'boolean',
    },
    help: {
      type: 'boolean',
      short: 'h',
    },
  },
  allowPositionals: false,
});

if (values.help) {
  console.log(`Usage:
  corepack pnpm stack:sync
  corepack pnpm stack:up

Options:
  --skip-pull
  --skip-install
  --skip-migrate
  --skip-smoke`);
  process.exit(0);
}

const run = (command, args, description) => {
  console.log(`[stack-sync] ${description}`);

  const result = runSpawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited with code ${result.status ?? 'unknown'}.`,
    );
  }
};

const capture = (command, args) => {
  const result = runSpawnSync(command, args, {
    encoding: 'utf8',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited with code ${result.status ?? 'unknown'}.`,
    );
  }

  return result.stdout.trim();
};

const ensureCleanWorktree = () => {
  const gitStatus = capture('git', ['status', '--porcelain=v1']);

  if (!gitStatus) {
    return;
  }

  throw new Error(
    'Local changes detected. Commit, stash, or discard them before running stack:sync.',
  );
};

const main = () => {
  if (!values['skip-pull']) {
    ensureCleanWorktree();
    run('git', ['pull', '--ff-only'], 'Pulling the current branch');
  }

  if (!values['skip-install']) {
    run(
      corepackCommand,
      ['pnpm', 'install', '--frozen-lockfile'],
      'Installing workspace dependencies',
    );
  }

  run(
    'docker',
    ['compose', 'up', '-d', '--build'],
    'Starting the Docker stack',
  );

  if (!values['skip-migrate']) {
    run(
      corepackCommand,
      ['pnpm', 'docker:migrate'],
      'Applying Prisma migrations',
    );
  }

  if (!values['skip-smoke']) {
    run(
      corepackCommand,
      ['pnpm', 'docker:smoke'],
      'Running the runtime smoke checks',
    );
  }

  console.log('[stack-sync] Stack is ready.');
  console.log('[stack-sync] Web: http://localhost:3000');
  console.log('[stack-sync] API: http://localhost:3333/api/v1/health');
  console.log('[stack-sync] Swagger: http://localhost:3333/api/docs');
};

try {
  main();
} catch (error) {
  console.error(
    error instanceof Error ? `[stack-sync] ${error.message}` : error,
  );
  process.exit(1);
}
