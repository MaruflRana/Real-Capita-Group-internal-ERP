import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import process from 'node:process';

const timeoutMs = Number.parseInt(
  process.env.RUNTIME_SMOKE_TIMEOUT_MS ?? '180000',
  10,
);
const pollIntervalMs = Number.parseInt(
  process.env.RUNTIME_SMOKE_POLL_INTERVAL_MS ?? '3000',
  10,
);
const requestTimeoutMs = Number.parseInt(
  process.env.RUNTIME_SMOKE_REQUEST_TIMEOUT_MS ?? '10000',
  10,
);
const maxRedirects = Number.parseInt(
  process.env.RUNTIME_SMOKE_MAX_REDIRECTS ?? '5',
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

const preferIpv4Loopback = (hostname, options, callback) => {
  const normalizedOptions = typeof options === 'function' ? {} : options;
  const normalizedCallback =
    typeof options === 'function' ? options : callback;

  if (hostname === 'localhost') {
    if (normalizedOptions.all) {
      normalizedCallback(null, [
        {
          address: '127.0.0.1',
          family: 4,
        },
      ]);
      return;
    }

    normalizedCallback(null, '127.0.0.1', 4);
    return;
  }

  dns.lookup(hostname, normalizedOptions, normalizedCallback);
};

const httpRequest = (url, redirectCount = 0) =>
  new Promise((resolve, reject) => {
    const targetUrl = new URL(url);
    const client = targetUrl.protocol === 'https:' ? https : http;

    const request = client.request(
      targetUrl,
      {
        method: 'GET',
        lookup: preferIpv4Loopback,
      },
      (response) => {
        response.resume();

        const statusCode = response.statusCode ?? 0;
        const redirectLocation = response.headers.location;

        if (
          redirectLocation &&
          statusCode >= 300 &&
          statusCode < 400 &&
          redirectCount < maxRedirects
        ) {
          response.once('end', () => {
            const nextUrl = new URL(redirectLocation, targetUrl);
            resolve(httpRequest(nextUrl, redirectCount + 1));
          });
          return;
        }

        if (
          redirectLocation &&
          statusCode >= 300 &&
          statusCode < 400 &&
          redirectCount >= maxRedirects
        ) {
          reject(
            new Error(
              `Too many redirects while checking ${targetUrl.toString()}.`,
            ),
          );
          return;
        }

        response.once('end', () => {
          resolve({
            statusCode,
            url: targetUrl.toString(),
          });
        });
      },
    );

    request.setTimeout(requestTimeoutMs, () => {
      request.destroy(
        new Error(`Request timed out after ${requestTimeoutMs}ms.`),
      );
    });

    request.once('error', reject);
    request.end();
  });

const waitForCheck = async ({ label, url }) => {
  const startedAt = Date.now();
  let lastError = 'No response received yet.';

  while (Date.now() - startedAt < timeoutMs) {
    try {
      // Node 24 + Windows can intermittently reset fetch() requests to
      // Docker-exposed localhost ports even when the service is healthy.
      const response = await httpRequest(url);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log(`[runtime-smoke] ${label} ok: ${url}`);
        return;
      }

      lastError = `HTTP ${response.statusCode}`;
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
