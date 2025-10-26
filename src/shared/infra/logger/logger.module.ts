// src/logger/logger.module.ts
import { Global, Module } from '@nestjs/common';
import { buildConsoleLoggerFromConfig } from './logger.factory';
import { FileCapableConsoleLogger } from './file-console.logger';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'APP_LOGGER',
      useFactory: (configService: ConfigService) => {
        const base = buildConsoleLoggerFromConfig(configService);
        if (base === false) return false; // logging disabled
        // If file logging is on, re-create as FileCapableConsoleLogger with same options
        const opts = (base as any).options ?? {};
        const fileOn = configService.get<boolean>('LOGGER_FILE', false);

        return fileOn
          ? new FileCapableConsoleLogger(opts, configService)
          : base;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['APP_LOGGER'],
})
export class LoggerModule {}
