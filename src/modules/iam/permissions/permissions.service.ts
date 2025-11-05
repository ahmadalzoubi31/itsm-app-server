import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { UserPermission } from '../users/entities/user-permission.entity';
import { Role } from '../roles/entities/role.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { AssignPermissionsToUserDto } from './dto/assign-permissions-to-user.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly perms: Repository<Permission>,
    @InjectRepository(UserPermission)
    private readonly userPerms: Repository<UserPermission>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePerms: Repository<RolePermission>,
  ) {}

  // -------- Permissions --------
  async listPermissions(): Promise<Permission[]> {
    return this.perms.find({ order: { subject: 'ASC', action: 'ASC' } });
  }

  // -------- User Permissions --------
  async getUserPermissions(userId: string) {
    const userPermissions = await this.userPerms.find({
      where: { userId },
      relations: ['permission'],
      order: {
        permission: {
          subject: 'ASC',
          action: 'ASC',
        },
      },
    });

    // Get end_user role permissions to exclude them
    const endUserRole = await this.roles.findOne({
      where: { key: 'end_user' },
    });

    let endUserPermissionIds: Set<string> = new Set();
    if (endUserRole) {
      const endUserRolePermissions = await this.rolePerms.find({
        where: { roleId: endUserRole.id },
        select: ['permissionId'],
      });
      endUserPermissionIds = new Set(
        endUserRolePermissions.map((rp) => rp.permissionId),
      );
    }

    // Extract and return just the permission keys, excluding end_user role permissions
    return userPermissions
      .filter((up) => !endUserPermissionIds.has(up.permissionId))
      .map((up) => up.permission.key);
  }

  // -------- User ↔ Permission (Direct assignment) --------
  async assignPermissionsToUser(
    userId: string,
    dto: AssignPermissionsToUserDto[],
  ) {
    for (const d of dto) {
      for (const permissionId of d.permissionIds) {
        try {
          await this.userPerms.upsert(
            { userId, permissionId, metadata: d.metadata },
            ['userId', 'permissionId'],
          );
        } catch (error) {
          throw new BadRequestException(
            `Failed to assign permission ${permissionId} to user ${userId}: ${error.message}`,
          );
        }
      }
    }

    return { ok: true };
  }

  async revokePermissionFromUser(userId: string, permissionId: string) {
    await this.userPerms.delete({ userId, permissionId });

    return { ok: true };
  }
}
