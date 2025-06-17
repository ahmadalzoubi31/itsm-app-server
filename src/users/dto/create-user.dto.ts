import {
  IsEmail,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Role } from '../enums/role.enum';

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

  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsEmpty()
  @IsString()
  phone: string;

  @IsEmpty()
  @IsString()
  address: string;

  @IsEnum(Role)
  role: Role;
}
