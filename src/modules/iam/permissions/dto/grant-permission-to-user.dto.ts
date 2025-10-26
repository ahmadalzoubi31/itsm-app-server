// src/modules/iam/admin/dto/grant-permission-to-user.dto.ts
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GrantPermissionToUserDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Permission ID to grant to user.',
  })
  @IsUUID()
  permissionId!: string;
}
