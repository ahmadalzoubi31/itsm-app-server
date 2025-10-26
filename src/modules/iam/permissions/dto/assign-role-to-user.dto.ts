// src/modules/iam/admin/dto/assign-role-to-user.dto.ts
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleToUserDto {
  @ApiProperty({ format: 'uuid', description: 'Role ID to assign to user.' })
  @IsUUID()
  roleId!: string;
}
