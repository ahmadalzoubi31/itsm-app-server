import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LogInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const username = request.user?.username;

    this.logger.log(
      `username: ${username} | Request Method: ${method} | Request URL: ${url} |`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log('Response received');
        },
        error: (error) => {
          this.logger.error(`Error occurred: ${error.message}`);
        },
      }),
    );
  }
}
