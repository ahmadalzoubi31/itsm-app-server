// src/logger/file-console.logger.ts
import { ConsoleLogger, LogLevel, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ORDER: Array<'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'verbose'> =
  ['fatal', 'error', 'warn', 'info', 'debug', 'verbose'];

function fileEnabledFor(min: string, level: LogLevel) {
  const idx = ORDER.indexOf(min as any);
  const allowed = new Set(
    ORDER.slice(0, idx + 1).map((l) => (l === 'info' ? 'log' : l)),
  );
  return allowed.has(level as any);
}

export class FileCapableConsoleLogger extends ConsoleLogger {
  private stream: import('fs').WriteStream | null = null;
  private fileOn: boolean;
  private fileLevel: string;
  private fileJson: boolean;
  private fileTs: boolean;

  constructor(
    opts: ConstructorParameters<typeof ConsoleLogger>[0],
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    super(opts);

    // Initialize configuration values
    this.fileOn = this.configService.get<boolean>('LOGGER_FILE', false);
    this.fileLevel = this.configService
      .get<string>('LOGGER_FILE_LEVEL', 'info')
      .toLowerCase();
    this.fileJson =
      this.configService.get<string>('LOGGER_FILE_FORMAT', 'json') === 'json';
    this.fileTs = this.configService.get<boolean>(
      'LOGGER_FILE_TIMESTAMP',
      true,
    );

    if (this.fileOn) {
      const dir = 'logs';
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const name = this.configService.get<string>('LOGGER_NAME', 'default');
      this.stream = createWriteStream(join(dir, `${name}.log`), { flags: 'a' });
    }
  }

  private write(level: LogLevel, context: string | undefined, msg: string) {
    if (!this.stream || !fileEnabledFor(this.fileLevel, level)) return;
    const line = this.fileJson
      ? JSON.stringify({
          level,
          ts: this.fileTs ? new Date().toISOString() : undefined,
          context,
          message: msg,
        })
      : `${this.fileTs ? `[${new Date().toISOString()}] ` : ''}${level}${
          context ? ` [${context}]` : ''
        }: ${msg}`;
    this.stream.write(line + '\n');
  }

  override log(message: any, context?: string) {
    super.log(message, context);
    this.write(
      'log',
      context,
      typeof message === 'string' ? message : JSON.stringify(message),
    );
  }
  override error(message: any, stack?: string, context?: string) {
    super.error(message, stack, context);
    const msg = stack ? `${message} ${stack}` : message;
    this.write(
      'error',
      context,
      typeof msg === 'string' ? msg : JSON.stringify(msg),
    );
  }
  override warn(message: any, context?: string) {
    super.warn(message, context);
    this.write(
      'warn',
      context,
      typeof message === 'string' ? message : JSON.stringify(message),
    );
  }
  override debug(message: any, context?: string) {
    super.debug(message, context);
    this.write(
      'debug',
      context,
      typeof message === 'string' ? message : JSON.stringify(message),
    );
  }
  override verbose(message: any, context?: string) {
    super.verbose(message, context);
    this.write(
      'verbose',
      context,
      typeof message === 'string' ? message : JSON.stringify(message),
    );
  }
  // In Nest v10+, fatal may exist; guard call for compatibility
  override fatal(message: any, context?: string) {
    super.fatal?.(message, context);
    this.write('fatal' as LogLevel, context, String(message));
  }
}
