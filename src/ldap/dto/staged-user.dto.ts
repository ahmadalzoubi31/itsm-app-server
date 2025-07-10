import {
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsObject,
} from 'class-validator';
import { StagedUserStatusEnum } from '../constants/staged-user-status.constant';
import { BaseEntityDto } from '../../shared/dto/base-entity.dto';

export class StagedUserDto extends BaseEntityDto {
  @IsOptional() @IsString() cn?: string;
  @IsOptional() @IsEmail() mail?: string;
  @IsOptional() @IsString() sAMAccountName?: string;
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() givenName?: string;
  @IsOptional() @IsString() sn?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsString() userPrincipalName?: string;
  @IsOptional() @IsString() objectGUID?: string;
  @IsOptional() @IsString() manager?: string;

  @IsOptional() @IsObject() additionalAttributes?: Record<string, any>;

  @IsOptional() @IsEnum(StagedUserStatusEnum) status?: StagedUserStatusEnum;
}
