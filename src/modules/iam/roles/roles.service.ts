import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { GroupRole } from '../groups/entities/group-role.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { UserPermission } from '../users/entities/user-permission.entity';
import { MembershipService } from '../membership/membership.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRolesToUserDto } from './dto/assign-roles-to-user.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePerms: Repository<RolePermission>,
    @InjectRepository(GroupRole)
    private readonly groupRoles: Repository<GroupRole>,
    @InjectRepository(UserRole)
    private readonly userRoles: Repository<UserRole>,
    @InjectRepository(UserPermission)
    private readonly userPerms: Repository<UserPermission>,

    private readonly membershipService: MembershipService,
  ) {}

  // -------- Roles CRUD --------
  async listRoles(): Promise<Role[]> {
    return this.roles.find({
      where: { key: Not('end_user') },
      order: { name: 'ASC' },
    });
  }

  async getRoleById(id: string): Promise<Role> {
    const role = await this.roles.findOne({
      where: { id },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async createRole(dto: CreateRoleDto): Promise<Role> {
    return this.roles.save(dto);
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.getRoleById(id);
    Object.assign(role, dto);
    return this.roles.save(role);
  }

  async deleteRole(id: string): Promise<{ success: boolean }> {
    await this.roles.delete(id);
    return { success: true };
  }

  // -------- Role ↔ Permission --------
  async getRolePermissions(roleId: string) {
    return this.rolePerms
      .find({
        where: { roleId },
        relations: ['permission'],
      })
      .then((rolePermissions) => rolePermissions.map((rp) => rp.permission));
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    for (const permissionId of permissionIds) {
      const existing = await this.rolePerms.findOne({
        where: { roleId, permissionId },
      });

      if (!existing) {
        const rolePermission = this.rolePerms.create({ roleId, permissionId });
        await this.rolePerms.save(rolePermission);
        await this.roles.increment({ id: roleId }, 'permissionCount', 1);
      }
    }

    return { ok: true };
  }

  async revokePermissionsFromRole(roleId: string, permissionIds: string[]) {
    for (const permissionId of permissionIds) {
      await this.rolePerms.delete({ roleId, permissionId });
      await this.roles.decrement({ id: roleId }, 'permissionCount', 1);
    }
    return { ok: true };
  }

  // -------- Group ↔ Role --------
  async assignRoleToGroup(groupId: string, roleId: string) {
    // First assign the role to group
    const existingGroupRole = await this.groupRoles.findOne({
      where: { groupId, roleId },
    });

    if (!existingGroupRole) {
      const groupRole = this.groupRoles.create({ groupId, roleId });
      await this.groupRoles.save(groupRole);
    }

    // Get role permissions and group members in parallel
    const [rolePermissions, groupMembers] = await Promise.all([
      this.rolePerms.find({
        where: { roleId },
        relations: ['permission'],
      }),
      this.membershipService.getGroupMembers(groupId),
    ]);

    // Add role permissions to all group members
    const memberIds = groupMembers.map((member) => member.id);
    if (memberIds.length > 0 && rolePermissions.length > 0) {
      for (const memberId of memberIds) {
        for (const rp of rolePermissions) {
          const metadata = {
            source: 'group_role',
            groupId,
            roleId,
          };

          const existing = await this.userPerms.findOne({
            where: { userId: memberId, permissionId: rp.permissionId },
          });

          if (existing) {
            existing.metadata = metadata;
            await this.userPerms.save(existing);
          } else {
            const userPerm = this.userPerms.create({
              userId: memberId,
              permissionId: rp.permissionId,
              metadata,
            });
            await this.userPerms.save(userPerm);
          }
        }
      }
    }

    // Get group and role details for event
    const [group, role] = await Promise.all([
      this.groupRoles.findOne({ where: { groupId }, relations: ['group'] }),
      this.roles.findOne({ where: { id: roleId } }),
    ]);

    return { ok: true };
  }

  async revokeRoleFromGroup(groupId: string, roleId: string) {
    // First get the role's permissions and current group members
    const [rolePermissions, groupMembers] = await Promise.all([
      this.rolePerms.find({
        where: { roleId },
        select: ['permissionId'],
      }),
      this.membershipService.getGroupMembers(groupId),
    ]);

    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    const memberIds = groupMembers.map((member) => member.id);

    // Remove the role from group
    await this.groupRoles.delete({ groupId, roleId });

    // Remove role permissions from all group members
    if (memberIds.length > 0 && permissionIds.length > 0) {
      await this.userPerms
        .createQueryBuilder()
        .delete()
        .where("metadata->>'groupId' = :groupId", { groupId })
        .andWhere("metadata->>'roleId' = :roleId", { roleId })
        .andWhere('userId IN (:...memberIds)', { memberIds })
        .andWhere('permissionId IN (:...permissionIds)', { permissionIds })
        .execute();
    }

    // Get group and role details for event
    const [group, role] = await Promise.all([
      this.groupRoles.findOne({ where: { groupId }, relations: ['group'] }),
      this.roles.findOne({ where: { id: roleId } }),
    ]);

    return { ok: true };
  }

  // -------- User ↔ Role --------
  async assignRolesToUser(userId: string, dto: AssignRolesToUserDto) {
    for (const roleId of dto.roleIds) {
      const existingUserRole = await this.userRoles.findOne({
        where: { userId, roleId },
      });

      if (!existingUserRole) {
        const userRole = this.userRoles.create({ userId, roleId });
        await this.userRoles.save(userRole);
        await this.roles.increment({ id: roleId }, 'userCount', 1);
      }
    }

    // Add all role permissions to user's permissions
    for (const roleId of dto.roleIds) {
      const rolePermissions = await this.rolePerms.find({
        where: { roleId },
        select: ['permissionId'],
      });
      for (const rp of rolePermissions) {
        const existing = await this.userPerms.findOne({
          where: { userId, permissionId: rp.permissionId },
        });

        if (existing) {
          existing.metadata = { source: 'role' };
          await this.userPerms.save(existing);
        } else {
          const userPerm = this.userPerms.create({
            userId,
            permissionId: rp.permissionId,
            metadata: { source: 'role' },
          });
          await this.userPerms.save(userPerm);
        }
      }
    }
    return { ok: true };
  }

  async revokeRoleFromUser(userId: string, roleId: string) {
    // Remove the role from user
    await this.userRoles.delete({ userId, roleId });
    const rolePermissions = await this.rolePerms.find({
      where: { roleId },
      select: ['permissionId'],
    });
    const permissionIds = rolePermissions.map((rp) => rp.permissionId);
    // Remove all role permissions from user's permissions
    await this.userPerms.delete({ userId, permissionId: In(permissionIds) });
    await this.roles.decrement({ id: roleId }, 'userCount', 1);
    return { ok: true };
  }
}
