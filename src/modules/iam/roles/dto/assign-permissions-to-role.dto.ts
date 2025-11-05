// src/modules/iam/roles/dto/assign-permission-to-role.dto.ts
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsToRoleDto {
  @ApiProperty({ format: 'uuid', description: 'Permission IDs to assign.' })
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
