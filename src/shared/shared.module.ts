import { MiddlewareConsumer, Module, Logger, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { LogInterceptor } from './interceptors/log.interceptor';
import { UsersModule } from '../users/users.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';

@Module({
  imports: [UsersModule],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
  ],
  exports: [],
})
export class SharedModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
