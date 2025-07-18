import { IsUUID, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class AddPermissionToGroupDto {
  @IsUUID()
  permissionId: string;
}

export class RemovePermissionFromGroupDto {
  @IsUUID()
  permissionId: string;
}

export class SetGroupPermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}
