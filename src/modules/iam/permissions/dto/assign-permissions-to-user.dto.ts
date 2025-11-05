// src/modules/iam/permissions/dto/grant-permission-to-user.dto.ts
import { IsObject, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsToUserDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Permission IDs to grant to user.',
  })
  @IsUUID('4', { each: true })
  permissionIds!: string[];

  @ApiProperty({
    description: 'Metadata to assign to user.',
  })
  @IsObject()
  metadata!: Record<string, any>;
}
