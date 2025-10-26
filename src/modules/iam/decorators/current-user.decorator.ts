// src/modules/iam/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator((_d, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().user as {
    userId: string;
    username: string;
  };
});
