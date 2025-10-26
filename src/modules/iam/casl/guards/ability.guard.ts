import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ABILITY_CHECK_KEY } from '@modules/iam/casl/decorators/check-ability.decorator';
import { CaslAbilityFactory } from '../casl-ability.factory';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';

/**
 * AbilityGuard - For simple type-level permission checks
 * Use this for endpoints WITHOUT :id parameter
 * Example: Can user create a Case? Can user list all Cases?
 */
@Injectable()
export class AbilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly casl: CaslAbilityFactory,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<{
      action: IAM_ACTIONS;
      subject: string;
    }>(ABILITY_CHECK_KEY, [ctx.getHandler(), ctx.getClass()]);

    if (!meta) return true;

    const req = ctx.switchToHttp().getRequest();
    const ability = await this.casl.createForUser(req.user);

    if (!ability.can(meta.action, meta.subject as any)) {
      throw new ForbiddenException(
        `You do not have permission to ${meta.action} ${meta.subject}`,
      );
    }

    return true;
  }
}
