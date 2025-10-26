// src/shared/infra/infra.module.ts
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import { HealthModule } from './health/health.module';
import { dataSourceOptions } from '../../db/data-source';
import { LoggerModule } from './logger/logger.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('Database');

        // Log database connection attempt
        logger.log(
          `Connecting to database: ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}/${configService.get('DB_NAME')}`,
        );

        const options = {
          ...dataSourceOptions,
          logging: configService.get<boolean>('DB_LOGGING', false),
          logger: 'advanced-console' as const,
          loggerLevels: ['error', 'warn', 'info'] as const,
        };

        // Log configuration details
        logger.debug(
          `Database configuration: SSL=${configService.get<boolean>('DB_SSL', false)}, Synchronize=${configService.get<boolean>('DB_SYNCHRONIZE', true)}, Logging=${configService.get<boolean>('DB_LOGGING', false)}`,
        );

        return options;
      },
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    LoggerModule,
    HealthModule,
  ],
})
export class InfraModule {}
