import { IsString, IsEnum, IsOptional } from 'class-validator';
import { GroupMemberRoleEnum } from '../entities/group-member.entity';

export class AddMemberDto {
  @IsString()
  userId: string;

  @IsEnum(GroupMemberRoleEnum)
  @IsOptional()
  role?: GroupMemberRoleEnum = GroupMemberRoleEnum.MEMBER;
}
