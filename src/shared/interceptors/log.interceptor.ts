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
  private readonly logger = new Logger('Interceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const body = request.body;
    const username = request.user?.username || 'Unauthenticated';

    this.logger.log(`Incoming Request: User: ${username} |  ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log(
            `Request Completed: User: ${username} | ${method} ${url} `,
          ),
        error: (error) => {
          const statusCode = error.getStatus?.() || 500;
          this.logger.error(
            `Request Failed: User: ${username} | ${method} ${url} | Status: ${statusCode} | Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
