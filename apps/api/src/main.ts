import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';
import type { ApiRuntimeConfig } from './app/config/runtime-config';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const runtimeConfig = configService.get<ApiRuntimeConfig>('api');

  if (!runtimeConfig) {
    throw new Error('API runtime configuration is unavailable.');
  }

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
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  if (runtimeConfig.enableSwagger) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle(runtimeConfig.appName)
        .setDescription(
          'REST API foundation for the Real Capita Group internal ERP.',
        )
        .setVersion(`v${runtimeConfig.apiVersion}`)
        .addBearerAuth()
        .build(),
    );

    SwaggerModule.setup(runtimeConfig.swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(runtimeConfig.port);
};

void bootstrap();
