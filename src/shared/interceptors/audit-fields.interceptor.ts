import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class AuditFieldsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      throw new UnauthorizedException('User info not found in request');
    }

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (request.body) {
        if (request.method === 'POST') {
          request.body.createdById = userId;
          request.body.updatedById = userId;
        } else {
          request.body.updatedById = userId;
        }
      }
    }

    return next.handle();
  }
}
