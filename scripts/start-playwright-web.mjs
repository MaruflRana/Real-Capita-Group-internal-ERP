import { cpSync, existsSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const port = process.env.PLAYWRIGHT_PORT ?? '3100';
const appUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const apiBaseUrl =
  process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3333';
const buildIdPath = path.join(workspaceRoot, 'apps/web/.next/BUILD_ID');
const standaloneDir = path.join(
  workspaceRoot,
  'apps/web/.next/standalone/apps/web',
);
const standaloneServerPath = path.join(standaloneDir, 'server.js');
const standaloneStaticPath = path.join(standaloneDir, '.next/static');
const standalonePublicPath = path.join(standaloneDir, 'public');
const staticPath = path.join(workspaceRoot, 'apps/web/.next/static');
const publicPath = path.join(workspaceRoot, 'apps/web/public');

const run = (command, args, env) =>
  new Promise((resolve, reject) => {
    const resolvedCommand =
      process.platform === 'win32' && command === 'corepack'
        ? 'corepack.cmd'
        : command;
    const child =
      process.platform === 'win32'
        ? spawn(
            'cmd.exe',
            ['/d', '/s', '/c', [resolvedCommand, ...args].join(' ')],
            {
              cwd: workspaceRoot,
              env,
              stdio: 'inherit',
              shell: false,
            },
          )
        : spawn(resolvedCommand, args, {
            cwd: workspaceRoot,
            env,
            stdio: 'inherit',
            shell: false,
          });

    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? 'unknown'}.`));
    });
    child.once('error', reject);
  });

const main = async () => {
  const buildEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
    HOSTNAME: '0.0.0.0',
    PORT: port,
  };

  rmSync(path.join(workspaceRoot, 'apps/web/.next/lock'), { force: true });

  await run('corepack', ['pnpm', 'build:web'], buildEnv);

  if (!existsSync(buildIdPath)) {
    throw new Error('Missing Playwright web build output after build.');
  }

  if (!existsSync(standaloneServerPath)) {
    throw new Error('Missing standalone Playwright web server after build.');
  }

  rmSync(standaloneStaticPath, { recursive: true, force: true });
  cpSync(staticPath, standaloneStaticPath, { recursive: true });

  rmSync(standalonePublicPath, { recursive: true, force: true });
  cpSync(publicPath, standalonePublicPath, { recursive: true });

  const server = spawn(
    process.execPath,
    [standaloneServerPath],
    {
      cwd: workspaceRoot,
      env: buildEnv,
      stdio: 'inherit',
      shell: false,
    },
  );

  const stopServer = (signal) => {
    if (!server.killed) {
      server.kill(signal);
    }
  };

  process.on('SIGINT', () => stopServer('SIGINT'));
  process.on('SIGTERM', () => stopServer('SIGTERM'));

  server.once('exit', (code) => {
    process.exit(code ?? 0);
  });
  server.once('error', (error) => {
    console.error(error);
    process.exit(1);
  });
};

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
