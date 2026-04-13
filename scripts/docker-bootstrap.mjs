import { spawn } from 'node:child_process';
import process from 'node:process';
import { parseArgs } from 'node:util';

const parseCliArguments = () => {
  const argv = process.argv.slice(2).filter((argument, index) => {
    if (argument !== '--') {
      return true;
    }

    return index !== 0;
  });
  const { values } = parseArgs({
    args: argv,
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
    console.log(
      'Usage: corepack pnpm docker:bootstrap -- --company-name "<name>" --company-slug "<slug>" --admin-email "<email>" --admin-password "<password>"',
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

const requireArgument = (value, key) => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`${key} is required.`);
  }

  return normalizedValue;
};

const main = async () => {
  const argumentsMap = parseCliArguments();
  const companyName = requireArgument(
    argumentsMap.companyName,
    '--company-name',
  );
  const companySlug = requireArgument(
    argumentsMap.companySlug,
    '--company-slug',
  );
  const adminEmail = requireArgument(
    argumentsMap.adminEmail,
    '--admin-email',
  );
  const adminPassword = requireArgument(
    argumentsMap.adminPassword,
    '--admin-password',
  );

  await new Promise((resolve, reject) => {
    const child = spawn(
      'docker',
      [
        'compose',
        '--profile',
        'ops',
        'run',
        '--rm',
        '-e',
        `BOOTSTRAP_COMPANY_NAME=${companyName}`,
        '-e',
        `BOOTSTRAP_COMPANY_SLUG=${companySlug}`,
        '-e',
        `BOOTSTRAP_ADMIN_EMAIL=${adminEmail}`,
        '-e',
        `BOOTSTRAP_ADMIN_PASSWORD=${adminPassword}`,
        'api-bootstrap',
      ],
      {
        env: process.env,
        stdio: 'inherit',
        shell: false,
      },
    );

    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`docker compose exited with code ${code ?? 'unknown'}.`));
    });
    child.once('error', reject);
  });
};

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
