import { Injectable } from '@nestjs/common';
import { IamPermissionService } from './core/iam-permission.service';
import { Permission } from './permissions/entities/permission.entity';

/**
 * IAM Service - High-level interface for Identity and Access Management
 *
 * This service provides a unified API for:
 * - Permission resolution (combines user/group roles and direct permissions)
 * - Cache management
 * - Permission queries
 *
 * The permission resolution is cached for 60 seconds for performance.
 * Cache is automatically invalidated when roles or memberships change.
 */
@Injectable()
export class IamService {
  constructor(private readonly permissionService: IamPermissionService) {}

  /**
   * Get all effective permissions for a user
   * Combines permissions from:
   * - User's direct roles
   * - User's group roles
   * - Direct user permissions
   *
   * Results are cached for 60 seconds.
   *
   * @param userId - The user ID
   * @param groupIds - Array of group IDs the user belongs to
   * @returns Array of effective permissions
   */
  async getEffectivePermissions(
    userId: string,
    groupIds: string[],
  ): Promise<Permission[]> {
    return this.permissionService.getEffectivePermissions(userId, groupIds);
  }

  /**
   * Invalidate cache for a specific user
   * Call this whenever a user's roles or memberships change
   *
   * @param userId - The user ID to invalidate
   */
  invalidateUserCache(userId: string): void {
    this.permissionService.invalidateUserCache(userId);
  }

  /**
   * Clear all permission cache
   * Useful for group role changes that affect multiple users
   */
  clearCache(): void {
    this.permissionService.clearCache();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return this.permissionService.getCacheStats();
  }
}
