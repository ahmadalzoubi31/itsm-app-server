// src/modules/iam/roles/dto/assign-role-to-group.dto.ts
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleToGroupDto {
  @ApiProperty({ format: 'uuid', description: 'Role ID to assign to group.' })
  @IsUUID()
  roleId!: string;
}

