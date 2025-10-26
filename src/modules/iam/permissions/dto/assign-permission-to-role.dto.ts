// src/modules/iam/admin/dto/assign-permission-to-role.dto.ts
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionToRoleDto {
  @ApiProperty({ format: 'uuid', description: 'Permission ID to assign.' })
  @IsUUID()
  permissionId!: string;
}
