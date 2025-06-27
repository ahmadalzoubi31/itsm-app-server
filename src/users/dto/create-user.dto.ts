import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  ValidateNested,
} from 'class-validator';
import { RoleEnum } from '../constants/role.constant';
import { StatusEnum } from '../../shared/constants/status.constant';
import { BaseEntityDto } from '../../shared/dto/base-entity.dto';

export class CreateUserDto extends BaseEntityDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsOptional()
  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsString()
  @IsEnum(RoleEnum)
  role: RoleEnum;

  @IsString()
  @IsEnum(StatusEnum)
  status: StatusEnum;
}
