// src/modules/iam/users/dto/user-permissions-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PermissionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  subject: string;

  @ApiProperty({ required: false, nullable: true })
  conditions?: Record<string, any>;

  @ApiProperty({ required: false })
  description?: string;
}

export class RoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;
}

export class GroupDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;
}

export class UserPermissionsResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  role?: string;

  @ApiProperty({ type: [GroupDto] })
  groups: GroupDto[];

  @ApiProperty({ type: [RoleDto] })
  roles: RoleDto[];

  @ApiProperty({ type: [PermissionDto] })
  permissions: PermissionDto[];

  @ApiProperty({
    description: 'Summary of what actions the user can perform',
    example: {
      Case: ['create', 'read', 'update'],
      User: ['read'],
    },
  })
  abilitySummary: Record<string, string[]>;
}
