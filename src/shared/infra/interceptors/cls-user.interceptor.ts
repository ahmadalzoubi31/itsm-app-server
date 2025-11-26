// src/shared/infra/interceptors/cls-user.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import { ClsStore } from '../cls/cls-store.interface';

@Injectable()
export class ClsUserInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ClsUserInterceptor.name);

  constructor(private readonly cls: ClsService<ClsStore>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Store user in CLS if it exists
    if (request.user) {
      this.cls.set('user', request.user);
      this.logger.log(`logged in user "${request.user.username}" set in CLS`);

      const retrievedUser = this.cls.get('user');
      this.logger.log(`retrieved user from CLS: ${retrievedUser?.username}`);
    } else {
      this.logger.log('no logged in user found in request');
    }

    return next.handle();
  }
}
