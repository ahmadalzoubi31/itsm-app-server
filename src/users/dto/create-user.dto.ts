import {
  IsEmail,
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Role } from '../enums/role.enum';
import { BaseEntityDto } from 'src/shared/dto/base-entity.dto';
import { Status } from 'src/shared/enums/status.enum';

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

  @IsString()
  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsEnum(Status)
  status: Status;
}
