// src/modules/iam/decorators/current-user.decorator.ts
import {
  createParamDecorator,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

export const CurrentUser = createParamDecorator((_d, ctx: ExecutionContext) => {
  const logger = new Logger('CurrentUserDecorator');
  const request = ctx.switchToHttp().getRequest();

  // Log the request headers for debugging
  // logger.debug('Request headers:', JSON.stringify(request.headers, null, 2));
  // logger.debug('Cookies:', JSON.stringify(request.cookies, null, 2));
  // logger.debug('Request user:', JSON.stringify(request.user, null, 2));

  if (!request.user || !request.user.userId) {
    const errorMessage =
      'No authenticated user found in request. ' +
      'This could be due to:\n' +
      '1. Missing or invalid JWT token in Authorization header or cookies\n' +
      '2. JwtAuthGuard not properly applied to the route\n' +
      '3. JWT token expired or invalid\n' +
      '4. JWT strategy not properly configured';

    logger.error(errorMessage);
    throw new UnauthorizedException('Authentication required');
  }

  return request.user as {
    userId: string;
    username: string;
    role?: string;
    groupIds?: string[];
    jti: string;
  };
});
