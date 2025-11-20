import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Type } from '@nestjs/common';
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
      subject: Type<any> | 'all';
    }>(ABILITY_CHECK_KEY, [ctx.getHandler(), ctx.getClass()]);

    if (!meta) return true;

    const req = ctx.switchToHttp().getRequest();
    const ability = await this.casl.createForUser(req.user);

    // Normalize the subject to ensure we use the same class reference
    // that was used when building the ability (from resolveSubject)
    // This ensures consistent matching in CASL
    const normalizedSubject = this.casl.resolveSubject(meta.subject);
    const canPerform = ability.can(meta.action, normalizedSubject as any);

    if (!canPerform) {
      const subjectName =
        typeof meta.subject === 'string'
          ? meta.subject
          : meta.subject?.name || 'Unknown';
      throw new ForbiddenException(
        `You do not have permission to ${meta.action} ${subjectName}`,
      );
    }

    return true;
  }
}
