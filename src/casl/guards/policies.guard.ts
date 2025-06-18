import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory, AppAbility } from 'src/casl/casl-ability.factory';
import { PolicyHandler } from '../intefaces/ipolicy-handler.interface';
import { CHECK_POLICIES_KEY } from '../decorators/check-policies.decorator';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
    private userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const { user } = context.switchToHttp().getRequest();

    const userInfo = await this.userService.findOne(user.userId);

    if (!userInfo) {
      throw new UnauthorizedException();
    }

    const ability = this.caslAbilityFactory.createForUser(userInfo);
    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
