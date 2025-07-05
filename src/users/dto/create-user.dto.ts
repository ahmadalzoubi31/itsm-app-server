import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { RoleEnum } from '../constants/role.constant';
import { StatusEnum } from '../../shared/constants/status.constant';

export class CreateUserDto {
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

  @IsEnum(RoleEnum)
  role: RoleEnum;

  @IsEnum(StatusEnum)
  status: StatusEnum;

  @IsOptional()
  @IsString()
  objectGUID: string;

  @IsOptional()
  @IsString()
  managerId: string;
}
