// src/modules/iam/iam-cache-invalidation.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IamPermissionService } from './core/iam-permission.service';
import { GroupsService } from './groups/groups.service';
import {
  UserRoleAssigned,
  UserRoleRevoked,
  UserPermissionGranted,
  UserPermissionRevoked,
  GroupRoleAssigned,
  GroupRoleRevoked,
  UserGroupJoined,
  UserGroupLeft,
} from '@shared/contracts/events';

@Injectable()
export class IamCacheInvalidationHandler {
  private readonly logger = new Logger(IamCacheInvalidationHandler.name);

  constructor(
    private readonly permissionService: IamPermissionService,
    private readonly groupsService: GroupsService,
  ) {}

  /** invalidate cache for affected user (after membership/role change) */
  invalidate(userId: string) {
    this.permissionService.invalidateUserCache(userId);
  }

  @OnEvent('user.role.assigned')
  handleUserRoleAssigned(payload: UserRoleAssigned) {
    this.logger.debug(
      `Invalidating cache for user: ${payload.userId} after role assigned`,
    );
    this.permissionService.invalidateUserCache(payload.userId);
  }

  @OnEvent('user.role.revoked')
  handleUserRoleRevoked(payload: UserRoleRevoked) {
    this.logger.debug(
      `Invalidating cache for user: ${payload.userId} after role revoked`,
    );
    this.permissionService.invalidateUserCache(payload.userId);
  }

  @OnEvent('user.permission.granted')
  handleUserPermissionGranted(payload: UserPermissionGranted) {
    this.logger.debug(
      `Invalidating cache for user: ${payload.userId} after permission granted`,
    );
    this.permissionService.invalidateUserCache(payload.userId);
  }

  @OnEvent('user.permission.revoked')
  handleUserPermissionRevoked(payload: UserPermissionRevoked) {
    this.logger.debug(
      `Invalidating cache for user: ${payload.userId} after permission revoked`,
    );
    this.permissionService.invalidateUserCache(payload.userId);
  }

  @OnEvent('user.group.joined')
  handleUserGroupJoined(payload: UserGroupJoined) {
    this.logger.debug(
      `Invalidating cache for user: ${payload.userId} after joining group`,
    );
    this.permissionService.invalidateUserCache(payload.userId);
  }

  @OnEvent('user.group.left')
  handleUserGroupLeft(payload: UserGroupLeft) {
    this.logger.debug(
      `Invalidating cache for user: ${payload.userId} after leaving group`,
    );
    this.permissionService.invalidateUserCache(payload.userId);
  }

  @OnEvent('group.role.assigned')
  async handleGroupRoleAssigned(payload: GroupRoleAssigned) {
    this.logger.debug(
      `Invalidating cache for ${payload.memberCount} members after group role assigned`,
    );
    try {
      const members = await this.groupsService.getGroupMembers(
        payload.groupId,
      );
      for (const member of members) {
        this.permissionService.invalidateUserCache(member.id);
      }
      this.logger.debug(
        `Invalidated cache for ${members.length} group members`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache for group ${payload.groupId}: ${error}`,
      );
      // Fallback: clear all cache if we can't get members
      this.permissionService.clearCache();
    }
  }

  @OnEvent('group.role.revoked')
  async handleGroupRoleRevoked(payload: GroupRoleRevoked) {
    this.logger.debug(
      `Invalidating cache for ${payload.memberCount} members after group role revoked`,
    );
    try {
      const members = await this.groupsService.getGroupMembers(
        payload.groupId,
      );
      for (const member of members) {
        this.permissionService.invalidateUserCache(member.id);
      }
      this.logger.debug(
        `Invalidated cache for ${members.length} group members`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache for group ${payload.groupId}: ${error}`,
      );
      // Fallback: clear all cache if we can't get members
      this.permissionService.clearCache();
    }
  }
}
