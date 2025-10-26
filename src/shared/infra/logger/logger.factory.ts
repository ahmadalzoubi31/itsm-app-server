// src/logger/logger.factory.ts
import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type AppLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';

function toNestLevels(min: AppLevel): LogLevel[] {
  const order: AppLevel[] = [
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'verbose',
  ];
  const i = order.indexOf(min);
  const enabled = order.slice(0, i + 1);
  // Nest uses "log" instead of "info"
  return enabled.map((l) => (l === 'info' ? 'log' : l)) as LogLevel[];
}

export function buildConsoleLoggerFromConfig(configService: ConfigService) {
  const consoleEnabled = configService.get<boolean>('LOGGER_CONSOLE', true);
  if (!consoleEnabled) return false as const; // disable all Nest logs

  const level = configService.get<AppLevel>('LOGGER_LEVEL', 'info');
  const json = configService.get<string>('LOGGER_FORMAT', 'json') === 'json';
  const timestamp = configService.get<boolean>('LOGGER_TIMESTAMP', true);
  const name = configService.get<string>('LOGGER_NAME', 'default');
  const compact = configService.get<boolean>('LOGGER_COMPACT', true);

  const logLevels = toNestLevels(level);

  return new ConsoleLogger({
    json,
    colors: !json,
    prefix: name,
    timestamp,
    compact,
    logLevels,
  });
}
