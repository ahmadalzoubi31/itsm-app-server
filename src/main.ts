import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  Logger,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
// import { initializeDataSource } from './db/data-source';
import { setupSwagger } from './shared/infra/swagger/swagger';
import { GlobalExceptionFilter } from './shared/infra/filters/global-exception.filter';
import { buildConsoleLoggerFromConfig } from '@shared/infra/logger/logger.factory';
import { FileCapableConsoleLogger } from '@shared/infra/logger/file-console.logger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Build console logger first (per env)
    const base = buildConsoleLoggerFromConfig(new ConfigService());

    const app = await NestFactory.create(AppModule, {
      logger:
        base && new ConfigService().get<boolean>('LOGGER_FILE', false)
          ? new FileCapableConsoleLogger(
              (base as any).options ?? {},
              new ConfigService(),
            )
          : base,
    });

    logger.log('NestJS application created successfully');

    // Middleware
    app.use(cookieParser());
    app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            imgSrc: [
              `'self'`,
              'data:',
              'apollo-server-landing-page.cdn.apollographql.com',
            ],
            scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
            manifestSrc: [
              `'self'`,
              'apollo-server-landing-page.cdn.apollographql.com',
            ],
            frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
          },
        },
      }),
    );
    logger.debug('Security middleware configured');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    // Validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    logger.debug('Validation pipes configured');

    // Global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());
    logger.debug('Global exception filter configured');

    // Global prefix
    app.setGlobalPrefix('api', {
      exclude: [{ path: '/', method: RequestMethod.GET }],
    });
    logger.debug('Global API prefix configured');

    // Enable CORS with credentials for cookie support
    // app.enableCors({
    //   origin:
    //     new ConfigService().get<string>('NODE_ENV') === 'production'
    //       ? 'https://itsm.webpexo.com'
    //       : 'http://localhost:8080',
    //   credentials: true, // ✅ CRITICAL: Allow cookies to be sent across domains
    // });
    app.enableCors({
      origin: 'http://localhost:8080', // your frontend
      credentials: true, // allow cookies
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization',
    });
    logger.debug('CORS configured');

    // Swagger (add this right before app.listen)
    if (new ConfigService().get<string>('NODE_ENV') !== 'production') {
      setupSwagger(app); // 👈 enables Swagger at /docs
      logger.debug('Swagger documentation configured');
    }

    const port = new ConfigService().get<number>('PORT');
    if (!port) {
      throw new Error('PORT is not set');
    }

    logger.log(`Starting server on port ${port}...`);
    await app.listen(port);

    // logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.debug(`Environment: ${new ConfigService().get<string>('NODE_ENV')}`);
    logger.log('Application bootstrap completed successfully');
  } catch (error) {
    // Log fatal startup errors
    logger.fatal('Failed to start application', error.stack);
    logger.error(`Startup error: ${error.message}`);

    // Log specific error details for debugging
    if (error.code) {
      logger.error(`Error code: ${error.code}`);
    }
    if (error.errno) {
      logger.error(`System error number: ${error.errno}`);
    }

    // Exit with error code
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.fatal('Unhandled bootstrap error', error.stack);
  process.exit(1);
});
