import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsEmail, IsPhoneNumber, MaxLength, IsEmpty, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { GroupTypeEnum, GroupStatusEnum } from '../entities/group.entity';
import { BaseEntityDto } from '../../shared/dto/base-entity.dto';

export class CreateGroupDto extends BaseEntityDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  description?: string;

  @IsEnum(GroupTypeEnum)
  type: GroupTypeEnum;

  @IsEnum(GroupStatusEnum)
  status: GroupStatusEnum;

  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  @ValidateIf((o) => o.leaderId !== null && o.leaderId !== undefined)
  @IsUUID()
  leaderId?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  @ValidateIf((o) => o.email !== null && o.email !== undefined)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value === '' ? null : value)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value === '' ? null : value)
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  memberIds?: string[];
}
