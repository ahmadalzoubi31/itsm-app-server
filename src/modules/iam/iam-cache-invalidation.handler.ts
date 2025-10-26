// src/modules/iam/iam-cache-invalidation.handler.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

import { IamPermissionService } from './core/iam-permission.service';

@Injectable()
export class IamCacheInvalidationHandler {
  private readonly logger = new Logger(IamCacheInvalidationHandler.name);

  constructor(private readonly permissionService: IamPermissionService) {}

  /** invalidate cache for affected user (after membership/role change) */
  invalidate(userId: string) {
    this.permissionService.invalidateUserCache(userId);
  }
}
