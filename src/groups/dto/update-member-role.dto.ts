import { IsEnum } from 'class-validator';
import { GroupMemberRoleEnum } from '../entities/group-member.entity';

export class UpdateMemberRoleDto {
  @IsEnum(GroupMemberRoleEnum)
  role: GroupMemberRoleEnum;
}
