// src/shared/infra/infra.module.ts
import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import { HealthModule } from './health/health.module';
import { dataSourceOptions } from '../../db/data-source';
import { LoggerModule } from './logger/logger.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RequestInspectorInterceptor } from './interceptors/request-inspector.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { ClsUserInterceptor } from './interceptors/cls-user.interceptor';
import { AuditSubscriber } from './subscribers/audit.subscriber';
import { DataSource } from 'typeorm';
import { RecordSubscriber } from './subscribers/record.subscriber';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
      },
    }),
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
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestInspectorInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClsUserInterceptor,
    },
    AuditSubscriber,
    RecordSubscriber,
  ],
})
export class InfraModule implements OnModuleInit {
  private readonly logger = new Logger(InfraModule.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly auditSubscriber: AuditSubscriber,
    private readonly recordSubscriber: RecordSubscriber,
  ) {}

  onModuleInit() {
    // Register the audit subscriber with TypeORM connection
    if (this.dataSource.subscribers) {
      this.dataSource.subscribers.push(this.auditSubscriber);
      this.dataSource.subscribers.push(this.recordSubscriber);
      this.logger.log('AuditSubscriber registered with TypeORM DataSource');
    }
  }
}
