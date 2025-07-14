import { IsString, IsUUID, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { GroupMemberRoleEnum } from '../entities/group-member.entity';

export class CreateGroupMemberDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  groupId: string;

  @IsEnum(GroupMemberRoleEnum)
  role: GroupMemberRoleEnum;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 