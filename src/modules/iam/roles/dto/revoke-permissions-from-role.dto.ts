// src/modules/iam/roles/dto/revoke-permissions-from-role.dto.ts
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokePermissionsFromRoleDto {
  @ApiProperty({ format: 'uuid', description: 'Permission IDs to revoke.' })
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
