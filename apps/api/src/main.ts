import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';
import { createValidationPipe } from './app/common/validation/create-validation-pipe';
import appConfig, { type AppConfig } from './app/config/app.config';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  const runtimeConfig = app.get<AppConfig>(appConfig.KEY);

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

  const logger = new Logger('Bootstrap');

  logger.log(
    `API listening on ${runtimeConfig.urls.apiBaseUrl}/${runtimeConfig.globalPrefix}/v${runtimeConfig.apiVersion}`,
  );
};

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');

  logger.error(
    'API bootstrap failed.',
    error instanceof Error ? error.stack : undefined,
  );

  process.exit(1);
});
