import { IsOptional, IsString, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { GroupTypeEnum, GroupStatusEnum } from '../entities/group.entity';

export class GroupFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(GroupTypeEnum)
  type?: GroupTypeEnum;

  @IsOptional()
  @IsEnum(GroupStatusEnum)
  status?: GroupStatusEnum;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  leaderId?: string;
} 