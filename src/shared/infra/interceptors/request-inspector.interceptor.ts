import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface RequestInspectionData {
  method: string;
  url: string;
  endpoint: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  username?: string;
  role?: string;
  requestBody?: any;
  queryParams?: any;
  headers?: any;
  timestamp: Date;
  duration?: number;
  statusCode?: number;
  responseSize?: number;
}

@Injectable()
export class RequestInspectorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestInspectorInterceptor.name);

  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract request information
    const inspectionData: RequestInspectionData = {
      method: request.method,
      url: request.url,
      endpoint: `${request.method} ${request.route?.path || request.path}`,
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip || request.socket.remoteAddress,
      userId: (request as any).user?.userId,
      username: (request as any).user?.username,
      role: (request as any).user?.role,
      requestBody: this.sanitizeRequestBody(request.body),
      queryParams: request.query,
      headers: this.sanitizeHeaders(request.headers),
      timestamp: new Date(),
    };

    // Log incoming request
    this.logRequest(inspectionData);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const responseSize = this.safeStringifyLength(data);

          const responseData = {
            ...inspectionData,
            duration,
            statusCode: response.statusCode,
            responseSize,
          };

          this.logResponse(responseData, data);
          // Process request data for analytics and security monitoring
          // this.inspectorService.processRequest(responseData);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const errorData = {
            ...inspectionData,
            duration,
            statusCode: error.status || 500,
            error: error.message,
          };

          this.logError(errorData, error);
          // Process error data for analytics and security monitoring
          // this.inspectorService.processRequest(errorData);
        },
      }),
    );
  }

  private logRequest(data: RequestInspectionData): void {
    const logMessage = `🔍 REQUEST INSPECTOR - ${data.method} ${data.endpoint}`;
    const logContext = {
      endpoint: data.endpoint,
      method: data.method,
      url: data.url,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      userId: data.userId,
      username: data.username,
      role: data.role,
      queryParams: data.queryParams,
      timestamp: data.timestamp.toISOString(),
    };

    this.logger.log(logMessage);
    // this.logger.log(logMessage, logContext);

    // Log request body for non-GET requests (be careful with sensitive data)
    if (data.method !== 'GET' && data.requestBody) {
      this.logger.debug(`Request Body: ${JSON.stringify(data.requestBody)}`);
    }
  }

  private logResponse(
    data: RequestInspectionData & {
      duration: number;
      statusCode: number;
      responseSize: number;
    },
    responseData: any,
  ): void {
    const logMessage = `✅ RESPONSE INSPECTOR - ${data.method} ${data.endpoint} - ${data.statusCode} (${data.duration}ms)`;
    const logContext = {
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      duration: data.duration,
      responseSize: data.responseSize,
      userId: data.userId,
      username: data.username,
      role: data.role,
      ipAddress: data.ipAddress,
    };

    // Log success responses
    if (data.statusCode >= 200 && data.statusCode < 300) {
      this.logger.log(logMessage);
      // this.logger.log(logMessage, logContext);
    } else if (data.statusCode >= 300 && data.statusCode < 400) {
      this.logger.warn(logMessage);
      // this.logger.warn(logMessage, logContext);
    } else {
      this.logger.error(logMessage);
      // this.logger.error(logMessage, logContext);
    }

    // Log response data for debugging (be careful with sensitive data)
    if (process.env.NODE_ENV === 'development') {
      try {
        const safeJson = this.safeStringify(responseData);
        this.logger.debug(`Response Data: ${safeJson}`);
      } catch (err) {
        this.logger.debug(
          `Response Data: [Unable to stringify - may contain circular references]`,
        );
      }
    }
  }

  private logError(
    data: RequestInspectionData & {
      duration: number;
      statusCode: number;
      error: string;
    },
    error: any,
  ): void {
    const logMessage = `❌ ERROR INSPECTOR - ${data.method} ${data.endpoint} - ${data.statusCode} (${data.duration}ms)`;
    const logContext = {
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      duration: data.duration,
      error: data.error,
      userId: data.userId,
      username: data.username,
      role: data.role,
      ipAddress: data.ipAddress,
      stack: error.stack,
    };

    this.logger.error(logMessage);
    // this.logger.error(logMessage, logContext);
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
    ];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    if (!headers) return headers;

    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Safely stringify objects that may contain circular references
   */
  private safeStringify(obj: any, space?: number): string {
    const seen = new WeakSet();
    return JSON.stringify(
      obj,
      (key, value) => {
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        // Handle common non-serializable types
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (typeof value === 'function') {
          return '[Function]';
        }
        if (typeof value === 'symbol') {
          return '[Symbol]';
        }
        return value;
      },
      space,
    );
  }

  /**
   * Safely calculate the string length of an object that may contain circular references
   */
  private safeStringifyLength(obj: any): number {
    try {
      return this.safeStringify(obj).length;
    } catch (err) {
      // Fallback: estimate size based on type
      if (typeof obj === 'string') {
        return obj.length;
      }
      if (typeof obj === 'object' && obj !== null) {
        return JSON.stringify({ type: typeof obj, keys: Object.keys(obj) })
          .length;
      }
      return 0;
    }
  }
}
