const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const workspaceRoot = path.resolve(__dirname, '../../../..');

const runNodeScript = (...args) =>
  spawnSync(process.execPath, args, {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });

const readJson = (relativePath) =>
  JSON.parse(readFileSync(path.join(workspaceRoot, relativePath), 'utf8'));

const readText = (relativePath) =>
  readFileSync(path.join(workspaceRoot, relativePath), 'utf8');

const listMigrationFiles = (directoryPath) => {
  const entries = readdirSync(directoryPath);
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry);

    if (statSync(entryPath).isDirectory()) {
      files.push(...listMigrationFiles(entryPath));
      continue;
    }

    if (entryPath.endsWith('.sql')) {
      files.push(entryPath);
    }
  }

  return files;
};

test('demo data root commands are explicit package scripts', () => {
  const packageJson = readJson('package.json');

  assert.equal(
    packageJson.scripts['seed:demo'],
    'node scripts/seed-demo-data.mjs',
  );
  assert.equal(
    packageJson.scripts['seed:demo:reset'],
    'node scripts/reset-demo-data.mjs',
  );
  assert.equal(
    packageJson.scripts['seed:demo:verify'],
    'node scripts/verify-demo-data.mjs',
  );
});

test('demo seed help and dry-run do not require a database connection', () => {
  const help = runNodeScript('scripts/seed-demo-data.mjs', '--help');

  assert.equal(help.status, 0);
  assert.match(help.stdout, /synthetic demo\/UAT data/u);
  assert.match(help.stdout, /--dry-run/u);

  const dryRun = runNodeScript('scripts/seed-demo-data.mjs', '--dry-run');

  assert.equal(dryRun.status, 0);
  assert.match(dryRun.stdout, /dry run: seed plan only/u);
  assert.match(dryRun.stdout, /real-capita-demo-uat/u);
});

test('demo reset and verify expose safety-oriented help text', () => {
  const resetHelp = runNodeScript('scripts/reset-demo-data.mjs', '--help');
  const verifyHelp = runNodeScript('scripts/verify-demo-data.mjs', '--help');

  assert.equal(resetHelp.status, 0);
  assert.match(resetHelp.stdout, /Deletes only guarded synthetic demo\/UAT data/u);
  assert.match(resetHelp.stdout, /--dry-run/u);

  assert.equal(verifyHelp.status, 0);
  assert.match(verifyHelp.stdout, /Verifies the synthetic demo\/UAT company/u);
});

test('demo data is not wired into startup, migrations, or normal bootstrap', () => {
  const packageJson = readJson('package.json');
  const startupScripts = [
    'dev',
    'dev:web',
    'dev:api',
    'docker:up',
    'docker:up:detached',
    'docker:infra',
    'docker:migrate',
    'docker:bootstrap',
    'prisma:migrate:deploy',
    'auth:bootstrap',
  ];

  for (const scriptName of startupScripts) {
    assert.doesNotMatch(packageJson.scripts[scriptName], /seed:demo|seed-demo/u);
  }

  const dockerCompose = readText('docker-compose.yml');
  assert.doesNotMatch(dockerCompose, /seed:demo|seed-demo/u);

  const migrationFiles = listMigrationFiles(
    path.join(workspaceRoot, 'prisma/migrations'),
  );

  for (const migrationFile of migrationFiles) {
    assert.doesNotMatch(readFileSync(migrationFile, 'utf8'), /seed:demo|seed-demo/u);
  }
});
