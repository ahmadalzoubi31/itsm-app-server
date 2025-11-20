import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class IamPermissionService {
  private readonly logger = new Logger(IamPermissionService.name);
  private readonly cache = new Map<
    string,
    { data: Permission[]; expires: number }
  >();
  private readonly ttlMs = 60_000; // 1 minute cache TTL

  constructor(
    @InjectRepository(Permission)
    private readonly perms: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  /**
   * Get all effective permissions for a user
   * Combines permissions from:
   * - User's direct roles
   * - User's group roles
   * - Direct user permissions
   * Results are cached for 60 seconds
   */
  async getEffectivePermissions(
    userId: string,
    groupIds: string[],
  ): Promise<Permission[]> {
    const key = `${userId}:${groupIds.sort().join(',')}`;
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      // this.logger.debug(`Cache hit for user: ${userId}`);
      return cached.data;
    }

    //this.logger.debug(`Cache miss, resolving permissions for user: ${userId}`);

    // 1) Get roles assigned directly to user
    const userRoleIds = await this.roles
      .find({
        where: { users: { id: userId } },
      })
      .then((roles) => roles.map((r) => r.id));

    // 2) Get roles assigned to user's groups
    // const groupRoleIds = await this.groupRoles
    //   .find({ where: { groupId: In(groupIds) } })
    //   .then((roles) => roles.map((r) => r.roleId));

    // Merge all unique role IDs
    const allRoleIds = [...new Set([...userRoleIds])];

    // 3) Get permissions from all roles
    const rolePermIds = await this.perms
      .find({ where: { roles: { id: In(allRoleIds) } } })
      .then((permissions) => permissions.map((p) => p.id));

    // 4) Get direct user permissions (not through roles)
    const userPermIds = await this.perms
      .find({ where: { users: { id: userId } } })
      .then((permissions) => permissions.map((p) => p.id));

    // Merge all unique permission IDs
    const allPermIds = [...new Set([...rolePermIds, ...userPermIds])];

    // Fetch actual permission entities
    const permissions = await this.perms.find({
      where: { id: In(allPermIds) },
    });

    // Cache the results
    this.cache.set(key, {
      data: permissions,
      expires: Date.now() + this.ttlMs,
    });

    this.logger.debug(
      `Resolved ${permissions.length} permissions for user: ${userId}`,
    );

    return permissions;
  }

  /**
   * Invalidate cache for a specific user
   */
  invalidateUserCache(userId: string): void {
    this.logger.debug(`Invalidating cache for user: ${userId}`);
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.logger.debug(
      `Invalidated ${invalidated} cache entries for user: ${userId}`,
    );
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.logger.debug('Clearing all permission cache');
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
