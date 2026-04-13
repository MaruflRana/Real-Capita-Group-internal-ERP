import process from 'node:process';

const timeoutMs = Number.parseInt(
  process.env.RUNTIME_SMOKE_TIMEOUT_MS ?? '180000',
  10,
);
const pollIntervalMs = Number.parseInt(
  process.env.RUNTIME_SMOKE_POLL_INTERVAL_MS ?? '3000',
  10,
);

const checks = [
  {
    label: 'web',
    url: process.env.RUNTIME_WEB_URL ?? 'http://localhost:3000',
  },
  {
    label: 'api-readiness',
    url:
      process.env.RUNTIME_API_HEALTH_URL ??
      'http://localhost:3333/api/v1/health/ready',
  },
  {
    label: 'swagger',
    url: process.env.RUNTIME_SWAGGER_URL ?? 'http://localhost:3333/api/docs',
  },
];

const sleep = (durationMs) =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

const waitForCheck = async ({ label, url }) => {
  const startedAt = Date.now();
  let lastError = 'No response received yet.';

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
      });

      if (response.ok) {
        console.log(`[runtime-smoke] ${label} ok: ${url}`);
        return;
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : 'Unknown network failure.';
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(
    `[runtime-smoke] ${label} failed for ${url} after ${timeoutMs}ms: ${lastError}`,
  );
};

const main = async () => {
  for (const check of checks) {
    await waitForCheck(check);
  }
};

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
