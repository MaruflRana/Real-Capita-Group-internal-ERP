import process from 'node:process';
import { parseArgs } from 'node:util';
import { forwardedArgs, parseEnvFile, relativeToRoot } from './lib/ops.mjs';

const usage = `Usage: corepack pnpm ops:env-check [-- --strict]

Warns about missing or placeholder-sensitive values in the root env file.

Options:
  --env-file <path>       Env file to check. Default: .env
  --strict                Exit non-zero when unsafe values are found
  --allow-placeholders    Treat placeholder values as expected, useful for .env.example
  -h, --help              Show this help text
`;

const requiredKeys = [
  'APP_NAME',
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'WEB_APP_URL',
  'API_BASE_URL',
  'CORS_ORIGIN',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'JWT_ACCESS_TOKEN_SECRET',
  'JWT_REFRESH_TOKEN_SECRET',
  'S3_PUBLIC_ENDPOINT',
  'S3_BUCKET',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
];

const sensitiveKeys = [
  'POSTGRES_PASSWORD',
  'JWT_ACCESS_TOKEN_SECRET',
  'JWT_REFRESH_TOKEN_SECRET',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
];

const placeholderPattern =
  /(change-me|changeme|placeholder|replace-me|example\.com|password)$/i;

const parseCliArguments = () => {
  const { values } = parseArgs({
    args: forwardedArgs(),
    options: {
      'env-file': {
        type: 'string',
      },
      strict: {
        type: 'boolean',
      },
      'allow-placeholders': {
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
    console.log(usage);
    process.exit(0);
  }

  return {
    envFile: values['env-file'] ?? '.env',
    strict: values.strict ?? false,
    allowPlaceholders: values['allow-placeholders'] ?? false,
  };
};

const main = () => {
  const { envFile, strict, allowPlaceholders } = parseCliArguments();
  const env = parseEnvFile(envFile);
  const warnings = [];

  for (const key of requiredKeys) {
    if (!env.values[key]?.trim()) {
      warnings.push(`${key} is missing or empty.`);
    }
  }

  if (!allowPlaceholders) {
    for (const key of sensitiveKeys) {
      const value = env.values[key]?.trim();

      if (value && placeholderPattern.test(value)) {
        warnings.push(`${key} still looks like a placeholder.`);
      }
    }
  }

  if (env.values.NODE_ENV === 'production') {
    for (const key of ['NEXT_PUBLIC_APP_URL', 'WEB_APP_URL', 'API_BASE_URL']) {
      const value = env.values[key];

      if (value?.includes('localhost') || value?.includes('127.0.0.1')) {
        warnings.push(`${key} points at a loopback host in production.`);
      }
    }

    if (env.values.ENABLE_SWAGGER === 'true') {
      warnings.push('ENABLE_SWAGGER=true in production.');
    }
  }

  if (warnings.length === 0) {
    console.log(`[ops:env-check] ok: ${relativeToRoot(env.path)}`);
    return;
  }

  console.warn(`[ops:env-check] warnings for ${relativeToRoot(env.path)}:`);
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }

  if (strict) {
    throw new Error('Unsafe env values found in strict mode.');
  }
};

try {
  main();
} catch (error) {
  console.error(
    `[ops:env-check] failed: ${error instanceof Error ? error.message : error}`,
  );
  process.exit(1);
}
