// src/modules/iam/permissions/permissions.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { AssignPermissionsToUserDto } from './dto/assign-permissions-to-user.dto';
import { AssignPermissionsToRoleDto } from '../roles/dto/assign-permissions-to-role.dto';
import { RevokePermissionsFromUserDto } from './dto/revoke-permissions-from-user.dto';
import { RevokePermissionsFromRoleDto } from '../roles/dto/revoke-permissions-from-role.dto';

@ApiTags('IAM / Permissions')
@ApiBearerAuth('access-token')
@Controller('iam/permissions')
export class PermissionsController {
  private readonly logger = new Logger(PermissionsController.name);

  constructor(private readonly svc: PermissionsService) {
    this.logger.log('PermissionsController initialized');
  }

  // -------- Permissions --------
  @ApiOperation({
    summary: 'List all permissions',
    description: 'Return all available permissions in the system.',
  })
  @Get()
  listPermissions() {
    return this.svc.listPermissions();
  }

  // -------- Role ↔ Permission --------
  @ApiOperation({
    summary: 'Get role permissions',
    description: 'List all permissions assigned to a role.',
  })
  @Get('roles/:roleId')
  getRolePermissions(@Param('roleId') roleId: string) {
    return this.svc.getRolePermissions(roleId);
  }

  @ApiOperation({
    summary: 'Assign permissions to role',
    description: 'Upsert mapping role → permission.',
  })
  @Post('roles/:roleId/assign')
  assignPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionsToRoleDto,
  ) {
    return this.svc.assignPermissionsToRole(roleId, dto);
  }

  @ApiOperation({
    summary: 'Revoke permission from role',
    description: 'Remove a direct permission assignment from a role.',
  })
  @Delete('roles/:roleId/revoke')
  revokePermissionsFromRole(
    @Param('roleId') roleId: string,
    @Body() dto: RevokePermissionsFromRoleDto,
  ) {
    return this.svc.revokePermissionsFromRole(roleId, dto);
  }

  // -------- User ↔ Permission --------
  @ApiOperation({
    summary: 'Get user permissions',
    description: 'List all permissions assigned to a user.',
  })
  @Get('users/:userId')
  getUserPermissions(@Param('userId') userId: string) {
    return this.svc.getUserPermissions(userId);
  }

  @ApiOperation({
    summary: 'Assign permissions to user',
    description: 'Upsert mapping user → permission.',
  })
  @Post('users/:userId/assign')
  assignPermissionsToUser(
    @Param('userId') uid: string,
    @Body() dto: AssignPermissionsToUserDto,
  ) {
    return this.svc.assignPermissionsToUser(uid, dto);
  }

  @ApiOperation({
    summary: 'Revoke permission from user',
    description: 'Remove a direct permission assignment from a user.',
  })
  @Delete('users/:userId/revoke')
  revokePermissionsFromUser(
    @Param('userId') uid: string,
    @Body() dto: RevokePermissionsFromUserDto,
  ) {
    return this.svc.revokePermissionsFromUser(uid, dto);
  }
}
