import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { PermissionNameEnum } from '../constants/permission-name.constant';

export class AssignPermissionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @IsNotEmpty()
  permissionNames: PermissionNameEnum[];
}
