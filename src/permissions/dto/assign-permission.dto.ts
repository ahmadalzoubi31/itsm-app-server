import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PermissionEnum } from '../enums/permission.enum';

export class AssignPermissionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsEnum(PermissionEnum)
  name: PermissionEnum;
}
