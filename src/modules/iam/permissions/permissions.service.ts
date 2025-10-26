import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { GroupRole } from '../groups/entities/group-role.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { UserPermission } from '../users/entities/user-permission.entity';
import {
  UserRoleAssigned,
  UserRoleRevoked,
  UserPermissionGranted,
  UserPermissionRevoked,
  GroupRoleAssigned,
  GroupRoleRevoked,
} from '@shared/contracts/events';
import { MembershipService } from '../membership/membership.service';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly perms: Repository<Permission>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
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

  // -------- Permissions --------
  async listPermissions(): Promise<Permission[]> {
    return this.perms.find({ order: { subject: 'ASC', action: 'ASC' } });
  }

  async getPermissions(permissionIds: string): Promise<Permission[]> {
    return this.perms.find({ where: { id: In(permissionIds.split(',')) } });
  }

  // -------- Roles --------
  listRoles() {
    return this.roles.find();
  }
  createRole(dto) {
    return this.roles.save(dto);
  }
  deleteRole(id: string) {
    return this.roles.delete(id);
  }

  // -------- Role ↔ Permission --------
  async getRolePermissions(roleId: string) {
    return this.rolePerms.find({
      where: { roleId },
      relations: ['permission'],
    });
  }
  async assignPermissionToRole(roleId: string, permissionId: string) {
    await this.rolePerms.upsert({ roleId, permissionId }, [
      'roleId',
      'permissionId',
    ]);
    return { ok: true };
  }
  async revokePermissionFromRole(roleId: string, permissionId: string) {
    await this.rolePerms.delete({ roleId, permissionId });
    return { ok: true };
  }

  // -------- Group ↔ Role --------
  async assignRoleToGroup(
    groupId: string,
    roleId: string,
    assignedBy?: string,
  ) {
    await this.groupRoles.upsert({ groupId, roleId }, ['groupId', 'roleId']);

    // Get group, role, and member details for event
    const [group, role, members] = await Promise.all([
      this.groupRoles.findOne({ where: { groupId }, relations: ['group'] }),
      this.roles.findOne({ where: { id: roleId } }),
      this.membershipService.getGroupMembers(groupId),
    ]);

    return { ok: true };
  }

  async revokeRoleFromGroup(
    groupId: string,
    roleId: string,
    revokedBy?: string,
  ) {
    await this.groupRoles.delete({ groupId, roleId });

    // Get group, role, and member details for event
    const [group, role, members] = await Promise.all([
      this.groupRoles.findOne({ where: { groupId }, relations: ['group'] }),
      this.roles.findOne({ where: { id: roleId } }),
      this.membershipService.getGroupMembers(groupId),
    ]);

    return { ok: true };
  }

  // -------- User ↔ Role --------
  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string) {
    await this.userRoles.upsert({ userId, roleId }, ['userId', 'roleId']);

    // Get role and user details for event
    const [role, user] = await Promise.all([
      this.roles.findOne({ where: { id: roleId } }),
      this.userRoles.findOne({ where: { userId }, relations: ['user'] }),
    ]);

    return { ok: true };
  }

  async revokeRoleFromUser(userId: string, roleId: string, revokedBy?: string) {
    await this.userRoles.delete({ userId, roleId });

    // Get role and user details for event
    const [role, user] = await Promise.all([
      this.roles.findOne({ where: { id: roleId } }),
      this.userRoles.findOne({ where: { userId }, relations: ['user'] }),
    ]);

    return { ok: true };
  }

  // -------- User ↔ Permission --------
  async grantPermissionToUser(
    userId: string,
    permissionId: string,
    grantedBy?: string,
  ) {
    await this.userPerms.upsert({ userId, permissionId }, [
      'userId',
      'permissionId',
    ]);

    // Get permission and user details for event
    const [permission, user] = await Promise.all([
      this.perms.findOne({ where: { id: permissionId } }),
      this.userPerms.findOne({ where: { userId }, relations: ['user'] }),
    ]);

    return { ok: true };
  }

  async revokePermissionFromUser(
    userId: string,
    permissionId: string,
    revokedBy?: string,
  ) {
    await this.userPerms.delete({ userId, permissionId });

    // Get permission and user details for event
    const [permission, user] = await Promise.all([
      this.perms.findOne({ where: { id: permissionId } }),
      this.userPerms.findOne({ where: { userId }, relations: ['user'] }),
    ]);

    return { ok: true };
  }
}
