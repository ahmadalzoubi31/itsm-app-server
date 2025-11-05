// src/modules/iam/permissions/permissions.controller.ts
import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { AssignPermissionsToUserDto } from './dto/assign-permissions-to-user.dto';

@ApiTags('IAM / Permissions')
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

  // USER ↔ PERMISSION (Direct assignment)
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
    @Body() dto: AssignPermissionsToUserDto[],
  ) {
    console.log(dto);
    return this.svc.assignPermissionsToUser(uid, dto);
  }

  @ApiOperation({
    summary: 'Revoke permission from user',
    description: 'Remove a direct permission assignment from a user.',
  })
  @Delete('users/:userId/revoke/:permissionId')
  revokePermissionFromUser(
    @Param('userId') uid: string,
    @Param('permissionId') pid: string,
  ) {
    return this.svc.revokePermissionFromUser(uid, pid);
  }
}
