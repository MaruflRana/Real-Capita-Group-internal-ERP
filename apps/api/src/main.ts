import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';
import { createValidationPipe } from './app/common/validation/create-validation-pipe';
import appConfig, { type AppConfig } from './app/config/app.config';
import storageConfig, { type StorageConfig } from './app/config/storage.config';

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);
const INTERNAL_SERVICE_HOSTNAMES = new Set(['api', 'minio', 'postgres', 'web']);

const collectProductionWarnings = (
  runtimeConfig: AppConfig,
  storageRuntimeConfig: StorageConfig,
): string[] => {
  if (runtimeConfig.nodeEnv !== 'production') {
    return [];
  }

  const warnings: string[] = [];
  const webAppUrl = new URL(runtimeConfig.urls.webAppUrl);
  const apiBaseUrl = new URL(runtimeConfig.urls.apiBaseUrl);
  const storagePublicEndpoint = new URL(storageRuntimeConfig.publicEndpoint);

  if (runtimeConfig.enableSwagger) {
    warnings.push(
      'ENABLE_SWAGGER is enabled in production. Disable it if public API docs are not required on the target VM.',
    );
  }

  if (
    LOOPBACK_HOSTNAMES.has(webAppUrl.hostname) ||
    LOOPBACK_HOSTNAMES.has(apiBaseUrl.hostname)
  ) {
    warnings.push(
      'WEB_APP_URL or API_BASE_URL still points to a loopback host in production. Remote users will not be able to use the deployment until those URLs are updated.',
    );
  }

  if (
    !LOOPBACK_HOSTNAMES.has(webAppUrl.hostname) &&
    (!webAppUrl.protocol.startsWith('https') ||
      !apiBaseUrl.protocol.startsWith('https'))
  ) {
    warnings.push(
      'Secure auth cookies require HTTPS for non-localhost browser sessions. Use https:// origins for WEB_APP_URL and API_BASE_URL on the target VM or terminate TLS in front of the Compose stack.',
    );
  }

  if (
    LOOPBACK_HOSTNAMES.has(storagePublicEndpoint.hostname) ||
    INTERNAL_SERVICE_HOSTNAMES.has(storagePublicEndpoint.hostname)
  ) {
    warnings.push(
      'S3_PUBLIC_ENDPOINT is not browser-resolvable for remote users. Use a VM-visible DNS name or host/IP instead of localhost or internal container hostnames.',
    );
  }

  return warnings;
};

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  const runtimeConfig = app.get<AppConfig>(appConfig.KEY);
  const storageRuntimeConfig = app.get<StorageConfig>(storageConfig.KEY);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix(runtimeConfig.globalPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: runtimeConfig.apiVersion,
  });
  app.enableCors({
    credentials: true,
    origin: runtimeConfig.corsOrigins,
  });
  app.useGlobalPipes(
    createValidationPipe(),
  );
  app.enableShutdownHooks();

  if (runtimeConfig.enableSwagger) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle(runtimeConfig.appName)
        .setDescription(
          'REST API integration foundation for the Real Capita Group internal ERP.',
        )
        .setVersion(`v${runtimeConfig.apiVersion}`)
        .addServer(runtimeConfig.urls.apiBaseUrl)
        .addBearerAuth()
        .build(),
    );

    SwaggerModule.setup(runtimeConfig.swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(runtimeConfig.port, '0.0.0.0');

  logger.log(
    `API listening on ${runtimeConfig.urls.apiBaseUrl}/${runtimeConfig.globalPrefix}/v${runtimeConfig.apiVersion}`,
  );

  for (const warning of collectProductionWarnings(
    runtimeConfig,
    storageRuntimeConfig,
  )) {
    logger.warn(warning);
  }
};

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');

  logger.error(
    'API bootstrap failed.',
    error instanceof Error ? error.stack : undefined,
  );

  process.exit(1);
});
