import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface DatabaseError {
  code: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | undefined = 'Internal Server Error';

    // Handle NestJS HTTP exceptions
    // this.logger.error({
    //   status: exception.status,
    //   response: exception.response,
    // });
    if (exception.status) {
      status = exception.status;
      message = exception.response.message || this.getDefaultMessage(status);
      error = this.getErrorName(status);
    }
    // Handle database constraint violations
    else if (exception instanceof QueryFailedError) {
      const dbError = exception.driverError as DatabaseError;
      const { code, detail, constraint, table, column } = dbError;

      this.logger.error(
        `Database error: ${code} - ${detail || constraint}`,
        exception.stack,
      );

      if (code === '23505') {
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = this.getUniqueConstraintMessage(
          constraint || '',
          table || '',
          column || '',
        );
        error = 'Conflict';
      } else if (code === '23503') {
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Referenced resource does not exist';
        error = 'Bad Request';
      } else if (code === '23502') {
        // Not null constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = `Required field '${column}' cannot be null`;
        error = 'Bad Request';
      } else if (code === '23514') {
        // Check constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid data provided';
        error = 'Bad Request';
      }
    }
    // Handle validation errors
    else if (exception.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      error = 'Bad Request';
    }
    // Handle other known errors
    else if (exception.name === 'CastError') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data format';
      error = 'Bad Request';
    }
    // Log unexpected errors
    else {
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: status >= 500 ? error : undefined,
    };

    response.status(status).json(errorResponse);
  }

  private getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };
    return messages[status] || 'Unknown Error';
  }

  private getErrorName(status: number): string {
    const errorNames: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };
    return errorNames[status] || 'Unknown Error';
  }

  private getUniqueConstraintMessage(
    constraint: string,
    table?: string,
    column?: string,
  ): string {
    // Map specific constraints to user-friendly messages
    const constraintMessages: Record<string, string> = {
      // IAM module constraints
      UQ_user_username: 'Username already exists',
      UQ_group_key: 'Group key already exists',
      UQ_membership_groupId_userId: 'User is already a member of this group',
      UQ_userRole_userId_roleId: 'User already has this role',
      UQ_groupRole_groupId_roleId: 'Group already has this role',

      // Catalog module constraints
      UQ_service_key: 'Service key already exists',
      UQ_request_template_key: 'Template key already exists',

      // Business line constraints
      UQ_business_line_key: 'Business line key already exists',

      // Case module constraints
      UQ_case_number: 'Case number already exists',
    };

    // Try to get specific message for constraint
    if (constraintMessages[constraint]) {
      return constraintMessages[constraint];
    }

    // Fallback based on table and column
    if (table && column) {
      const tableNames: Record<string, string> = {
        user: 'User',
        group: 'Group',
        service: 'Service',
        request_template: 'Template',
        business_line: 'Business line',
        case: 'Case',
        sla_target: 'SLA target',
        sla_timer: 'SLA timer',
        outbox_message: 'Outbox message',
      };

      const tableName = tableNames[table] || table;
      return `${tableName} with this ${column} already exists`;
    }

    // Generic fallback
    return 'Resource already exists';
  }
}
