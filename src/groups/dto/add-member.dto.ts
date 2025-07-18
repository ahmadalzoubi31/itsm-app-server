import { IsString, IsEnum, IsOptional } from 'class-validator';
import { GroupMemberRoleEnum } from '../entities/group-member.entity';
import { BaseEntityDto } from '../../shared/dto/base-entity.dto';

export class AddMemberDto extends BaseEntityDto {
  @IsString()
  userId: string;

  @IsEnum(GroupMemberRoleEnum)
  @IsOptional()
  role?: GroupMemberRoleEnum = GroupMemberRoleEnum.MEMBER;
}
