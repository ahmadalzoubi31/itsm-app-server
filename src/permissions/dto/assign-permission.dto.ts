import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PermissionName } from '../enums/permission-name.enum';

export class AssignPermissionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  permissionId: string;
}
