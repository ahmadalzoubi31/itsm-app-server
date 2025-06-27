import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { PermissionNameEnum } from '../contants/permission-name.constant';

export class AssignPermissionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @IsNotEmpty()
  permissionNames: PermissionNameEnum[];
}
