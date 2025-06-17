import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
} from '@nestjs/common';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        data,
        status: 'success',
        message: 'Request was successful',
      })),
      catchError((error: HttpException) => {
        console.log(
          '🚀 ~ ResponseInterceptor ~ catchError ~ error:',
          error.getResponse(),
        );
        const response = context.switchToHttp().getResponse();
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;
        const responseMessage = error.getResponse();
        const message =
          typeof responseMessage === 'object' && 'message' in responseMessage
            ? responseMessage.message
            : 'Internal server error';

        response.status(statusCode);

        return of({
          data: null,
          status: 'error',
          message,
        });
      }),
    );
  }
}
