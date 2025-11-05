import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsToRoleDto } from './dto/assign-permissions-to-role.dto';
import { AssignRoleToGroupDto } from './dto/assign-role-to-group.dto';
import { AssignRolesToUserDto } from './dto/assign-roles-to-user.dto';
import { RevokePermissionsFromRoleDto } from './dto/revoke-permissions-from-role.dto';

@ApiTags('IAM / Roles')
@ApiBearerAuth('access-token')
@Controller('iam/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ROLES CRUD
  @ApiOperation({ summary: 'List roles', description: 'Return all roles.' })
  @Get()
  listRoles() {
    return this.rolesService.listRoles();
  }

  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Return role details by ID.',
  })
  @Get(':id')
  getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  @ApiOperation({ summary: 'Create role', description: 'Create a new role.' })
  @Post()
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @ApiOperation({ summary: 'Update role', description: 'Update role by ID.' })
  @Put(':id')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @ApiOperation({ summary: 'Delete role', description: 'Delete role by ID.' })
  @Delete(':id')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  // ROLE ↔ PERMISSION
  @ApiOperation({
    summary: 'List role permissions',
    description: 'Return permissions assigned to a role.',
  })
  @Get(':id/permissions')
  getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  @ApiOperation({
    summary: 'Assign permissions to role',
    description: 'Upsert mapping role → permission.',
  })
  @Post(':id/permissions')
  assignPermissionToRole(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsToRoleDto,
  ) {
    return this.rolesService.assignPermissionsToRole(id, dto.permissionIds);
  }

  @ApiOperation({
    summary: 'Revoke permissions from role',
    description: 'Remove mapping role → permission.',
  })
  @Delete(':id/permissions')
  revokePermissionsFromRole(
    @Param('id') id: string,
    @Body() dto: RevokePermissionsFromRoleDto,
  ) {
    return this.rolesService.revokePermissionsFromRole(id, dto.permissionIds);
  }

  // GROUP ↔ ROLE
  @ApiOperation({
    summary: 'Assign role to group',
    description: 'Upsert mapping group → role.',
  })
  @Post('groups/:groupId/assign')
  assignRoleToGroup(
    @Param('groupId') gid: string,
    @Body() dto: AssignRoleToGroupDto,
  ) {
    return this.rolesService.assignRoleToGroup(gid, dto.roleId);
  }

  @ApiOperation({
    summary: 'Revoke role from group',
    description: 'Remove mapping group → role.',
  })
  @Delete('groups/:groupId/revoke/:roleId')
  revokeRoleFromGroup(
    @Param('groupId') gid: string,
    @Param('roleId') rid: string,
  ) {
    return this.rolesService.revokeRoleFromGroup(gid, rid);
  }

  // USER ↔ ROLE
  @ApiOperation({
    summary: 'Assign role to user',
    description: 'Upsert mapping user → role.',
  })
  @Post('users/:userId/assign')
  assignRolesToUser(
    @Param('userId') uid: string,
    @Body() dto: AssignRolesToUserDto,
  ) {
    return this.rolesService.assignRolesToUser(uid, dto);
  }

  @ApiOperation({
    summary: 'Revoke role from user',
    description: 'Remove mapping user → role.',
  })
  @Delete('users/:userId/revoke/:roleId')
  revokeRoleFromUser(
    @Param('userId') uid: string,
    @Param('roleId') rid: string,
  ) {
    return this.rolesService.revokeRoleFromUser(uid, rid);
  }
}
