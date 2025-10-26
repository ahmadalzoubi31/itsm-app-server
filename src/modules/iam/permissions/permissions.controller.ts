// src/modules/iam/admin/admin.controller.ts (add Swagger on endpoints)
import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionToRoleDto } from './dto/assign-permission-to-role.dto';
import { AssignRoleToGroupDto } from './dto/assign-role-to-group.dto';
import { AssignRoleToUserDto } from './dto/assign-role-to-user.dto';
import { GrantPermissionToUserDto } from './dto/grant-permission-to-user.dto';

@ApiTags('IAM / Permission / RBAC')
@ApiBearerAuth('access-token')
@Controller('iam/permissions')
export class PermissionsController {
  constructor(private readonly svc: PermissionsService) {}

  // PERMISSIONS
  @ApiOperation({
    summary: 'List all permissions',
    description: 'Return all available permissions in the system.',
  })
  @Get()
  listPermissions() {
    return this.svc.listPermissions();
  }

  // ROLES
  @ApiOperation({ summary: 'List roles', description: 'Return all roles.' })
  @Get('roles')
  listRoles() {
    return this.svc.listRoles();
  }

  @ApiOperation({ summary: 'Create role', description: 'Create a new role.' })
  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.svc.createRole(dto);
  }

  @ApiOperation({ summary: 'Delete role', description: 'Delete role by ID.' })
  @Delete('roles/:id')
  deleteRole(@Param('id') id: string) {
    return this.svc.deleteRole(id);
  }

  // ROLE ↔ PERMISSION
  @ApiOperation({
    summary: 'List role permissions',
    description: 'Return permissions assigned to a role.',
  })
  @Get('roles/:id/permissions')
  getRolePermissions(@Param('id') id: string) {
    return this.svc.getRolePermissions(id);
  }

  @ApiOperation({
    summary: 'Assign permission to role',
    description: 'Upsert mapping role → permission.',
  })
  @Post('roles/:id/permissions')
  assignPermissionToRole(
    @Param('id') id: string,
    @Body() dto: AssignPermissionToRoleDto,
  ) {
    return this.svc.assignPermissionToRole(id, dto.permissionId);
  }

  @ApiOperation({
    summary: 'Revoke permission from role',
    description: 'Remove mapping role → permission.',
  })
  @Delete('roles/:id/permissions/:permissionId')
  revokePermissionFromRole(
    @Param('id') id: string,
    @Param('permissionId') pid: string,
  ) {
    return this.svc.revokePermissionFromRole(id, pid);
  }

  // GROUP ↔ ROLE
  @ApiOperation({
    summary: 'Assign role to group',
    description: 'Upsert mapping group → role.',
  })
  @Post('groups/:groupId/roles')
  assignRoleToGroup(
    @Param('groupId') gid: string,
    @Body() dto: AssignRoleToGroupDto,
  ) {
    return this.svc.assignRoleToGroup(gid, dto.roleId);
  }

  @ApiOperation({
    summary: 'Revoke role from group',
    description: 'Remove mapping group → role.',
  })
  @Delete('groups/:groupId/roles/:roleId')
  revokeRoleFromGroup(
    @Param('groupId') gid: string,
    @Param('roleId') rid: string,
  ) {
    return this.svc.revokeRoleFromGroup(gid, rid);
  }

  // USER ↔ ROLE
  @ApiOperation({
    summary: 'Assign role to user',
    description: 'Upsert mapping user → role.',
  })
  @Post('users/:userId/roles')
  assignRoleToUser(
    @Param('userId') uid: string,
    @Body() dto: AssignRoleToUserDto,
  ) {
    return this.svc.assignRoleToUser(uid, dto.roleId);
  }

  @ApiOperation({
    summary: 'Revoke role from user',
    description: 'Remove mapping user → role.',
  })
  @Delete('users/:userId/roles/:roleId')
  revokeRoleFromUser(
    @Param('userId') uid: string,
    @Param('roleId') rid: string,
  ) {
    return this.svc.revokeRoleFromUser(uid, rid);
  }

  // USER ↔ PERMISSION
  @ApiOperation({
    summary: 'Grant permission to user',
    description: 'Upsert mapping user → permission.',
  })
  @Post('users/:userId/permissions')
  grantPermissionToUser(
    @Param('userId') uid: string,
    @Body() dto: GrantPermissionToUserDto,
  ) {
    return this.svc.grantPermissionToUser(uid, dto.permissionId);
  }

  @ApiOperation({
    summary: 'Revoke permission from user',
    description: 'Remove mapping user → permission.',
  })
  @Delete('users/:userId/permissions/:permissionId')
  revokePermissionFromUser(
    @Param('userId') uid: string,
    @Param('permissionId') pid: string,
  ) {
    return this.svc.revokePermissionFromUser(uid, pid);
  }
}
