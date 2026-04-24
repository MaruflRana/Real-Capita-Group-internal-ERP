import { spawn } from 'node:child_process';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  readFileSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

export const resolveFromRoot = (...segments) =>
  path.resolve(workspaceRoot, ...segments);

export const relativeToRoot = (targetPath) =>
  path.relative(workspaceRoot, targetPath).replaceAll(path.sep, '/');

export const forwardedArgs = () =>
  process.argv.slice(2).filter((argument, index) => {
    if (argument !== '--') {
      return true;
    }

    return index !== 0;
  });

export const parseEnvFile = (envFilePath = '.env') => {
  const absolutePath = path.resolve(workspaceRoot, envFilePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Missing env file: ${relativeToRoot(absolutePath)}`);
  }

  const values = {};
  const lines = readFileSync(absolutePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return {
    path: absolutePath,
    values,
  };
};

export const requireEnvValues = (envValues, keys) => {
  const missingKeys = keys.filter((key) => !envValues[key]?.trim());

  if (missingKeys.length > 0) {
    throw new Error(`Missing required env values: ${missingKeys.join(', ')}`);
  }
};

export const assertFileIsReadableBackup = (filePath) => {
  const absolutePath = path.resolve(workspaceRoot, filePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Backup file does not exist: ${filePath}`);
  }

  const stats = statSync(absolutePath);

  if (!stats.isFile()) {
    throw new Error(`Backup path is not a file: ${filePath}`);
  }

  if (stats.size <= 0) {
    throw new Error(`Backup file is empty: ${filePath}`);
  }

  return {
    absolutePath,
    size: stats.size,
  };
};

export const formatBytes = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kib = bytes / 1024;

  if (kib < 1024) {
    return `${kib.toFixed(1)} KiB`;
  }

  return `${(kib / 1024).toFixed(1)} MiB`;
};

export const timestampForFile = () =>
  new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

export const sanitizeFilePart = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'postgres';

export const runProcess = ({
  command,
  args,
  cwd = workspaceRoot,
  inputFile,
  stdoutFile,
  captureStdout = false,
  silentStdout = false,
}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    const stdoutChunks = [];
    const stderrChunks = [];
    let settled = false;
    let stdoutClosed = !stdoutFile;
    let stdoutStream;

    const fail = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      reject(error);
    };

    if (stdoutFile) {
      stdoutStream = createWriteStream(stdoutFile, { flags: 'wx' });
      stdoutStream.once('close', () => {
        stdoutClosed = true;
      });
      stdoutStream.once('error', fail);
      child.stdout.pipe(stdoutStream);
    } else if (captureStdout) {
      child.stdout.on('data', (chunk) => {
        stdoutChunks.push(Buffer.from(chunk));
      });
    } else if (!silentStdout) {
      child.stdout.pipe(process.stdout);
    }

    child.stderr.on('data', (chunk) => {
      stderrChunks.push(Buffer.from(chunk));
      process.stderr.write(chunk);
    });

    if (inputFile) {
      const inputStream = createReadStream(inputFile);
      inputStream.once('error', fail);
      inputStream.pipe(child.stdin);
    } else {
      child.stdin.end();
    }

    child.once('error', fail);
    child.once('close', (code) => {
      const finalize = () => {
        if (settled) {
          return;
        }

        settled = true;

        if (code === 0) {
          resolve({
            stdout: Buffer.concat(stdoutChunks).toString('utf8'),
            stderr: Buffer.concat(stderrChunks).toString('utf8'),
          });
          return;
        }

        reject(
          new Error(
            `${command} ${args.join(' ')} exited with code ${
              code ?? 'unknown'
            }.`,
          ),
        );
      };

      if (!stdoutClosed && stdoutStream) {
        stdoutStream.once('close', finalize);
        return;
      }

      finalize();
    });
  });
