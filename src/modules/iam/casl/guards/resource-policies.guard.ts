import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../casl-ability.factory';
import { IAM_ACTIONS } from '@shared/constants/iam-actions.constant';
import { ModuleRef } from '@nestjs/core';

export const RESOURCE_CHECK_KEY = 'resource:check';

/**
 * ResourcePoliciesGuard - For resource-specific permission checks
 * Use this for endpoints WITH :id parameter
 * This guard fetches the actual resource and checks permissions against it
 */
@Injectable()
export class ResourcePoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly casl: CaslAbilityFactory,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<{
      action: IAM_ACTIONS;
      serviceName: Type<any>;
      methodName: string;
      paramName: string;
    }>(RESOURCE_CHECK_KEY, ctx.getHandler());

    if (!meta) return true;

    const req = ctx.switchToHttp().getRequest();
    const resourceId = req.params?.[meta.paramName || 'id'];

    if (!resourceId) {
      throw new ForbiddenException('Missing resource id');
    }

    // Load resource from service
    const service = this.moduleRef.get(meta.serviceName, { strict: false });
    const resource = await service[meta.methodName](resourceId);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    // Check CASL permission
    const ability = await this.casl.createForUser(req.user);

    if (!ability.can(meta.action, resource)) {
      throw new ForbiddenException('You cannot access this resource');
    }

    // Attach to request (optional optimization)
    req.resource = resource;
    return true;
  }
}
