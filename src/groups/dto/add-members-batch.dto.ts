import { IsArray, IsString, IsEnum, IsOptional } from 'class-validator';
import { GroupMemberRoleEnum } from '../entities/group-member.entity';

export class AddMembersBatchDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsEnum(GroupMemberRoleEnum)
  @IsOptional()
  role?: GroupMemberRoleEnum = GroupMemberRoleEnum.MEMBER;
}
