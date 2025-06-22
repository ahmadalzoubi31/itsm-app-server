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
import { Role } from '../enums/role.enum';
import { BaseEntityDto } from '../../shared/dto/base-entity.dto';
import { Status } from '../../shared/enums/status.enum';
import { Type } from 'class-transformer';
import { AssignPermissionDto } from 'src/permissions/dto/assign-permission.dto';
import { Permission } from 'src/permissions/entities/permission.entity';
import { PermissionName } from 'src/permissions/enums/permission-name.enum';

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
  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsEnum(Status)
  status: Status;
}
