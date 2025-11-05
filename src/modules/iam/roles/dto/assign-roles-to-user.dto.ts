// src/modules/iam/roles/dto/assign-role-to-user.dto.ts
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRolesToUserDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Role IDs to assign to user.',
  })
  @IsUUID('4', { each: true })
  roleIds!: string[];
}
