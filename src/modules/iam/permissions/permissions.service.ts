import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { AssignPermissionsToUserDto } from './dto/assign-permissions-to-user.dto';
import { Role } from '../roles/entities/role.entity';
import { AssignPermissionsToRoleDto } from '../roles/dto/assign-permissions-to-role.dto';
import { RevokePermissionsFromRoleDto } from '../roles/dto/revoke-permissions-from-role.dto';
import { RevokePermissionsFromUserDto } from './dto/revoke-permissions-from-user.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly perms: Repository<Permission>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  // -------- Permissions --------
  async listPermissions(): Promise<Permission[]> {
    return this.perms.find({ order: { subject: 'ASC', action: 'ASC' } });
  }

  // -------- Role ↔ Permission --------
  async getRolePermissions(roleId: string) {
    return await this.roles.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
  }
  async assignPermissionsToRole(
    roleId: string,
    dto: AssignPermissionsToRoleDto,
  ) {
    const role = await this.roles.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
    if (!role) {
      throw new BadRequestException(`Role ${roleId} not found`);
    }

    // Batch operation: fetch all permissions in one query
    const permissions = await this.perms.find({
      where: { id: In(dto.permissionIds) },
    });
    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException(`Some permissions not found`);
    }

    // Merge with existing permissions (avoid duplicates)
    const existingPermissionIds = new Set(role.permissions.map((p) => p.id));
    const newPermissions = permissions.filter(
      (p) => !existingPermissionIds.has(p.id),
    );

    role.permissions.push(...newPermissions);
    role.permissionCount += newPermissions.length;
    await this.roles.save(role, { reload: true });
    return { ok: true };
  }
  async revokePermissionsFromRole(
    roleId: string,
    dto: RevokePermissionsFromRoleDto,
  ) {
    const role = await this.roles.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
    if (!role) {
      throw new BadRequestException(`Role ${roleId} not found`);
    }

    const initialCount = role.permissions.length;
    role.permissions = role.permissions.filter(
      (p) => !dto.permissionIds.includes(p.id),
    );
    const removedCount = initialCount - role.permissions.length;

    if (removedCount > 0) {
      role.permissionCount -= removedCount;
    }

    await this.roles.save(role, { reload: true });
    return { ok: true };
  }

  // -------- User ↔ Permission --------
  async getUserPermissions(userId: string) {
    const userPermissions = await this.perms.find({
      where: { users: { id: userId } },
      relations: ['users'],
    });

    return userPermissions;
  }
  async assignPermissionsToUser(
    userId: string,
    dto: AssignPermissionsToUserDto,
  ) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['permissions'],
    });
    if (!user) {
      throw new BadRequestException(`User ${userId} not found`);
    }

    // Batch operation: fetch all permissions in one query
    const permissions = await this.perms.find({
      where: { id: In(dto.permissionIds) },
    });
    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException(`Some permissions not found`);
    }

    // Merge with existing permissions (avoid duplicates)
    const existingPermissionIds = new Set(user.permissions.map((p) => p.id));
    const newPermissions = permissions.filter(
      (p) => !existingPermissionIds.has(p.id),
    );

    user.permissions.push(...newPermissions);
    await this.users.save(user, { reload: true });

    return { ok: true };
  }
  async revokePermissionsFromUser(
    userId: string,
    dto: RevokePermissionsFromUserDto,
  ) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['permissions'],
    });
    if (!user) {
      throw new BadRequestException(`User ${userId} not found`);
    }

    user.permissions = user.permissions.filter(
      (p) => !dto.permissionIds.includes(p.id),
    );
    await this.users.save(user, { reload: true });

    return { ok: true };
  }
}
